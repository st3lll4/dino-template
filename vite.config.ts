import { defineConfig } from "vite";
import { hmrPlugin } from "./src/hmr-plugin";

export default defineConfig({
  root: "src",
  build: {
    outDir: "../dist",
    rollupOptions: {
      input: {
        background: "src/entrypoints/background/index.ts",
        content: "src/entrypoints/content/index.ts",
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
