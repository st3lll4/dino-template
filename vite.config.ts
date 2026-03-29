import { defineConfig } from "vite";
import path from "node:path";
import { hmrPlugin } from "./src/hmr-plugin";

export default defineConfig({
  root: "src",
  cacheDir: path.resolve(__dirname, "node_modules/.vite"),
  build: {
    outDir: "../dist",
    rollupOptions: {
      input: {
        background: "src/entrypoints/background/index.ts",
        content: "src/entrypoints/content/index.ts",
        "modules/messaging": "src/entrypoints/content/messaging.ts",
        popup: "src/entrypoints/popup/popup.html",
        sidepanel: "src/entrypoints/sidepanel/sidepanel.html",
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "[name].js",
        assetFileNames: "[name].[ext]",
      },
    },
  },
  plugins: [
    hmrPlugin({
      wsPort: 5174,
      devPort: 5173,
    }),
  ],
});
