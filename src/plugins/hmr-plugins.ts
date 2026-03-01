import type { Plugin, ResolvedConfig } from "vite";
import { WebSocketServer, type WebSocket } from "ws";
import path from "node:path";
import fs from "node:fs";
import type {
  HmrOptions,
  ServerToExtensionEvent,
  SourceManifest,
  ExtensionToServerEvent,
  TargetBrowser,
} from "../types/hmr-plugin-types"; // only used for type checking, erased at runtime
import { transformManifest } from "../helpers/transformManifest";
import { watchFile } from "../helpers/watchFile";
import { generateDevClient } from "../helpers/generateDevClient";

export function hmrPlugin(options: HmrOptions): Plugin[] {
  const browser: TargetBrowser =
    options.browser ?? (process.env.BROWSER as TargetBrowser) ?? "chrome";
  const wsPort = options.wsPort ?? 5174;
  const devPort = options.devPort ?? 5173;

  // placeholders so can call them
  let resolvedConfig: ResolvedConfig;
  let wss: WebSocketServer | null = null;
  const clients = new Set<WebSocket>();

  // send messages from server to extension
  function broadcast(msg: ServerToExtensionEvent) {
    const raw = JSON.stringify(msg);
    clients.forEach((ws) => {
      if (ws.readyState === 1) {
        ws.send(raw);
      }
    });
  }

  const manifestPlugin: Plugin = {
    name: "hmr:manifest",

    // store it so we can read the output directory path later
    configResolved(cfg) {
      resolvedConfig = cfg;
    },

    // where we read, transform, and write the manifest
    buildStart() {
      const root = resolvedConfig.root;
      const outDir = path.resolve(root, resolvedConfig.build.outDir);

      // Read the source manifest
      const srcPath = path.resolve(root, "manifest.json");
      if (!fs.existsSync(srcPath)) {
        this.error(`Could not find manifest.json at ${srcPath}`);
        return;
      }

      let src: SourceManifest;
      try {
        src = JSON.parse(fs.readFileSync(srcPath, "utf-8"));
      } catch (e) {
        this.error(`Failed to parse manifest.json: ${e}`);
        return;
      }

      // transform
      const transformed = transformManifest(src, browser);

      // Make sure the output directory exists and write to it
      fs.mkdirSync(outDir, { recursive: true });
      const outPath = path.resolve(outDir, "manifest.json");
      fs.writeFileSync(outPath, JSON.stringify(transformed, null, 2));

      console.log(`[ext-hmr] manifest.json written for ${browser}`);
    },
  };

  const devServerPlugin: Plugin = {
    name: "hmr:dev-server",

    configResolved(cfg) {
      resolvedConfig = cfg;
    },

    configureServer() {
      wss = new WebSocketServer({ port: wsPort });

      wss.on("connection", (ws) => {
        // new client connected (background script)
        clients.add(ws);
        console.log(`[hmr] extension connected`);

        ws.on("close", () => {
          clients.delete(ws);
          console.log(`[hmr] extension disconnected`);
        });

        ws.on("error", () => {
          clients.delete(ws);
        });

        ws.on("message", (raw) => {
          let msg: ExtensionToServerEvent;
          try {
            msg = JSON.parse(raw.toString());
          } catch {
            return;
          }
          if (msg.event === "ext:ready") {
            console.log(`[ext-hmr] extension ready`);
          }
          if (msg.event === "ext:error") {
            console.error(`[ext-hmr] extension error: ${msg.message}`);
          }
        });
      });

      wss.on("error", (err) => {
        console.error(`[ext-hmr] WebSocket server error: ${err.message}`);
      });

      console.log(`[ext-hmr] WS server started on ws://localhost:${wsPort}`);

      const outDir = path.resolve(resolvedConfig.build.outDir);

      const backgroundOut = path.join(outDir, "background.js");
      const contentOut = path.join(outDir, "content.js");

      watchFile(backgroundOut, () => {
        console.log(`[hmr] background rebuilt, reloading extension`);
        broadcast({ event: "background-updated" });
      });

      watchFile(contentOut, () => {
        console.log(`[hmr] content script rebuilt, re-injecting`);
        broadcast({ event: "content-updated", scriptId: "content-main" });
      });
    },

    // clean up
    closeBundle() {
      wss?.close();
      wss = null;
    },
  };

  const devClientPlugin: Plugin = {
    name: "hmr:dev-client",

    renderChunk(code, chunk) {
      if (resolvedConfig.command !== "serve") return null;

      if (chunk.fileName === "background.js") {
        const client = generateDevClient(wsPort);
        return { code: client + "\n\n" + code, map: null };
      }

      return null;
    },
  };
  const serverConfigPlugin: Plugin = {
    name: "hmr:server-config",

    config() {
      return {
        server: {
          port: devPort,
          strictPort: true, // fail if port is already in use, don't pick a random one
          cors: {
            // allow requests from extension pages
            origin: [
              /chrome-extension:\/\/.*/,
              /moz-extension:\/\/.*/,
              /http:\/\/localhost/,
            ],
          },
          hmr: {
            protocol: "ws",
            host: "localhost",
            port: devPort,
          },
        },
      };
    },
  };

  return [manifestPlugin, devServerPlugin, devClientPlugin, serverConfigPlugin];
}
