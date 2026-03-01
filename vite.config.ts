import { defineConfig } from "vite";
import { hmrPlugin } from "./src/plugins/hmr-plugins";

export default defineConfig({
  root: "src",
  build: {
    outDir: "../dist",
    rollupOptions: {
      input: {
        background: "src/background.js",
        content: "src/content.js",
        popup: "src/popup/popup.html",
        sidepanel: "src/sidepanel/sidepanel.html",
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
