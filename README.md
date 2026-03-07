# Browser Extension Template with HMR

Cross-browser extension template with Hot Module Replacement using Vite. Supports Chrome MV3, Firefox MV2, and Firefox MV3.

## Setup

```bash
npm install
```

## Development

Runs Vite in watch mode (rebuilds `dist/` on save) alongside a dev server with HMR for extension pages.

```bash
# Chrome MV3
npm run dev

# Firefox MV2
npm run dev:firefox
```

Then load the extension from `dist/` in your browser:

- **Chrome** — `chrome://extensions` → Enable developer mode → Load unpacked → select `dist/`
- **Firefox** — `about:debugging` → This Firefox → Load Temporary Add-on → select `dist/manifest.json`

## Production build

```bash
# Chrome MV3
npm run build

# Firefox MV2
npm run build:firefox

# Firefox MV3
npm run build:firefox-mv3
```

Output is written to `dist/`.

## Tests

```bash
# Run once
npm test

# Watch mode
npm run test:watch
```

## HMR behaviour

| Layer             | Strategy                                                          |
| ----------------- | ----------------------------------------------------------------- |
| Popup / sidepanel | Native Vite HMR via `localhost:5173`                              |
| Background script | WebSocket event → `chrome.runtime.reload()`                       |
| Content scripts   | WebSocket event → unregister + re-register via `chrome.scripting` |

The WebSocket server runs on port `5174` (configurable via `hmrPlugin` options in `vite.config.ts`).
