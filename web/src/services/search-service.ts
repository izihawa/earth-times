import type { IIndexSeed, IndexQuery } from "summa-wasm";
import {
  ChunkedCacheConfig, LocalDatabaseSeed,
  RemoteEngineConfig,
  RemoteSearchService,
} from "summa-wasm";
import { ref, toRaw } from "vue";
import { ipfs_hostname, ipfs_http_protocol, ipfs_url } from "../options";
import axios from "axios";
import { db } from "../database";
import { IndexConfig } from "summa-wasm";

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
