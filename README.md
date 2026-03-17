# ✨ Extension template

Your cross-browser extension starter.
No refreshing manually like it's 2012. Supports Chrome MV3, Firefox MV2, and Firefox MV3 because we don't discriminate. Has HMR and end to end messaging! Type safe queries on the way.

## 💅 Setup

```bash
npm install
```

## 🔥 Dev mode

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

## Production build

When you're ready to go live:

```bash
# Chrome MV3
npm run build

# Firefox MV2
npm run build:firefox

# Firefox MV3
npm run build:firefox-mv3
```

Output lands in `dist/`. I'll setup ci/cd later. It's giving automation, queen.

## Tests

```bash
# run once and go
npm test

# stay and watch (very dedicated)
npm run test:watch
```

## HMR 101

| Layer             | What happens                                                              |
| ----------------- | ------------------------------------------------------------------------- |
| Popup / sidepanel | Native Vite HMR via `localhost:5173`                                      |
| Background script | WebSocket event → reload active tab(s) then `chrome.runtime.reload()`     |
| Content scripts   | WebSocket event → reload active tab(s) to re-run content script injection |

WebSocket server runs on port `5174`. Configurable in `vite.config.ts` if you're feeling creative.

### HMR wiring notes

- This template uses `vite build --watch` + a custom WebSocket bridge for extension-only reload behavior.
- Change detection is hash-based in `src/hmr-plugin/watchFile.ts`, so touched-but-unchanged outputs are ignored.
- Background updates are prioritized over content updates when both are detected in one debounce window.
- Current watched outputs are:
  - `dist/background.js`
  - `dist/content.js`
  - `dist/modules/messaging.js`

### Adding new scripts and modules

If you add another content-related entry/module that should trigger content tab reload, include its output file in the HMR watcher list in `src/hmr-plugin/index.ts`.

The current setup does not auto-discover all entries from Rollup output, so new relevant outputs must be registered explicitly.
