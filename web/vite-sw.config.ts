import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import topLevelAwait from "vite-plugin-top-level-await";
import vue from "@vitejs/plugin-vue";
import vuePugPlugin from "vue-pug-plugin";
import wasm from "vite-plugin-wasm";

// https://vitejs.dev/config/
export default defineConfig({
  base: "",
  build: {
    emptyOutDir: false,
    rollupOptions: {
      input: {
        "service-worker": "./node_modules/summa-wasm/dist/service-worker.js",
      },
      output: [
        {
          entryFileNames: () => {
            return "[name].js";
          },
        },
      ],
    },
    target: "esnext",
  },
});
