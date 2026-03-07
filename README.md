# ✨ extension template

Your cross-browser extension starter with Hot Module Replacement. No refreshing manually like it's 2012. Supports Chrome MV3, Firefox MV2, and Firefox MV3 because we don't discriminate.

## 💅 setup

```bash
npm install
```

One command. That's it. You're basically already done.

## 🔥 dev mode

Vite watches your files, rebuilds on save, and HMR keeps your extension pages fresh in real time. Iconic.

```bash
# Chrome MV3 (the main character)
npm run dev

# Firefox MV2 (also valid, we love her)
npm run dev:firefox
```

Then load your extension from `dist/`:

- **Chrome** — `chrome://extensions` → enable developer mode → load unpacked → select `dist/`
- **Firefox** — `about:debugging` → This Firefox → load temporary add-on → select `dist/manifest.json`

## 🏗️ production build

When you're ready to go live and look good doing it:

```bash
# Chrome MV3
npm run build

# Firefox MV2
npm run build:firefox

# Firefox MV3
npm run build:firefox-mv3
```

Output lands in `dist/`. Ship it.

## 🧪 tests

```bash
# run once and go
npm test

# stay and watch (very dedicated)
npm run test:watch
```

## 📁 project structure

```
src/
  entrypoints/
    background/index.ts            — the brains of the operation
    content/index.ts               — gets injected into pages, very sneaky
    popup/popup.html + .ts         — the face of the extension ✨
    sidepanel/sidepanel.html + .ts — the sidepiece (Chrome only, sorry Firefox)
  helpers/
    generateDevClient.ts           — dev IIFE injected into background during dev
    transformManifest.ts           — makes one manifest work for all browsers
    watchFile.ts                   — watches output files, fires callback on change
  plugins/
    hmr-plugins.ts                 — the HMR mastermind: manifest, WS server, CORS
  types/
    hmr-plugin-types.ts            — all shared types, no any allowed in this house
  manifest.json                    — browser-agnostic source manifest
dist/                              — built output, load this in the browser
```

## ⚡ HMR behaviour

| Layer             | What happens                                                      |
| ----------------- | ----------------------------------------------------------------- |
| Popup / sidepanel | Native Vite HMR via `localhost:5173`                              |
| Background script | WebSocket event → `chrome.runtime.reload()`                       |
| Content scripts   | WebSocket event → unregister + re-register via `chrome.scripting` |

WebSocket server runs on port `5174`. Configurable in `vite.config.ts` if you're feeling creative.
