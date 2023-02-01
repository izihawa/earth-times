import type { IIndexSeed, IndexQuery } from "summa-wasm";
import {
  ChunkedCacheConfig,
  LocalDatabaseSeed,
  RemoteEngineConfig,
  RemoteSearchService,
} from "summa-wasm";
import { toRaw } from "vue";
import { ipfs_hostname, ipfs_http_protocol, ipfs_url } from "../options";
import axios from "axios";
import { db } from "../database";
import { IndexConfig } from "summa-wasm";

export class IpfsDatabaseSeed implements IIndexSeed {
  ipfs_path: string;
  chunked_cache_config: ChunkedCacheConfig;

  constructor(ipfs_path: string, chunked_cache_config: ChunkedCacheConfig) {
    this.ipfs_path = ipfs_path;
    this.chunked_cache_config = chunked_cache_config;
  }

  async retrieve_remote_engine_config(): Promise<RemoteEngineConfig> {
    const response = await axios.get(ipfs_url + this.ipfs_path);
    let ipfs_hash = response.headers["x-ipfs-roots"];
    if (
      ipfs_hash === undefined &&
      response.headers["content-type"] === "text/html"
    ) {
      const parser = new DOMParser();
      const htmlDoc = parser.parseFromString(response.data, "text/html");
      if (htmlDoc.getElementsByClassName("ipfs-hash").length > 0) {
        // Kubo
        ipfs_hash = htmlDoc
          .getElementsByClassName("ipfs-hash")[0]
          .textContent!.trim();
      } else {
        // Iroh
        ipfs_hash = htmlDoc
          .getElementsByTagName("title")[0]
          .textContent!.replace("/ipfs/", "")
          .trim();
        if (ipfs_hash.endsWith("/")) {
          ipfs_hash = ipfs_hash.substring(0, ipfs_hash.length - 1);
        }
      }
    }
    try {
      // ToDo: Create separate check function
      await axios.get(
        `${ipfs_http_protocol}//${ipfs_hash}.ipfs.${ipfs_hostname}/meta.json`
      );
      return new RemoteEngineConfig(
        "GET",
        `${ipfs_http_protocol}//${ipfs_hash}.ipfs.${ipfs_hostname}/{file_name}`,
        new Map([["range", "bytes={start}-{end}"]]),
        this.chunked_cache_config
      );
    } catch {
      return new RemoteEngineConfig(
        "GET",
        `${ipfs_http_protocol}//${ipfs_hostname}/ipfs/${ipfs_hash}/{file_name}`,
        new Map([["range", "bytes={start}-{end}"]]),
        this.chunked_cache_config
      );
    }
  }
}

async function get_startup_configs() {
  return [
    {
      index_name: "meduza",
      seed: new LocalDatabaseSeed(
        "/data/meduza",
        new ChunkedCacheConfig(16 * 1024, 128 * 1024 * 1024)
      ),
      is_enabled: true,
    },
  ];
}

export class SearchService {
  init_guard: Promise<void>;
  remote_search_service: RemoteSearchService;

  constructor(options: { num_threads: number }) {
    const worker_url = new URL(
      "../../node_modules/summa-wasm/dist/root-worker.js",
      import.meta.url
    );
    const wasm_url = new URL(
      "../../node_modules/summa-wasm/dist/index_bg.wasm",
      import.meta.url
    );
    this.remote_search_service = new RemoteSearchService(
      worker_url,
      wasm_url,
      options
    );
    this.init_guard = (async () => {
      await this.remote_search_service.init_guard;
      return await this.setup();
    })();
  }

  async setup() {
    try {
      await this.load_from_store();
      if (await this.is_empty()) {
        await this.install_defaults();
      }
    } catch (e) {
      console.error("Dropping stored data due to error: ", e);
      await db.index_configs.clear();
      throw e;
    }
  }

  async load_from_store() {
    const index_configs = await db.index_configs.toArray();
    const loading_futures = index_configs.map((index_config) =>
      (async () => {
        const remote_engine_config = toRaw(index_config.remote_engine_config);
        await this.remote_search_service.add(
          remote_engine_config,
          index_config.index_name
        );
      })()
    );
    return await Promise.all(loading_futures);
  }
  async add_index(startup_config: {
    index_name: string;
    seed: IIndexSeed;
    is_enabled: boolean;
  }): Promise<Object> {
    const remote_engine_config =
      await startup_config.seed.retrieve_remote_engine_config();
    const index_attributes = await this.remote_search_service.add(
      remote_engine_config,
      startup_config.index_name
    );
    const index_config = new IndexConfig(
      startup_config.is_enabled,
      startup_config.index_name,
      index_attributes.description!,
      index_attributes.created_at,
      startup_config.seed,
      remote_engine_config
    );
    await db.save(index_config);
    return index_config;
  }
  async search(index_queries: IndexQuery[]) {
    return this.remote_search_service.search(index_queries);
  }
  async is_empty() {
    return (await db.index_configs.count()) == 0;
  }
  async install_defaults() {
    const startup_configs = await get_startup_configs();
    await Promise.all(
      startup_configs.map((startup_config) =>
        (async () => {
          await this.add_index(startup_config);
        })()
      )
    );
  }
}
