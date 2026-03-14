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

| Layer             | What happens                                                      |
| ----------------- | ----------------------------------------------------------------- |
| Popup / sidepanel | Native Vite HMR via `localhost:5173`                              |
| Background script | WebSocket event → `chrome.runtime.reload()`                       |
| Content scripts   | WebSocket event → unregister + re-register via `chrome.scripting` |

WebSocket server runs on port `5174`. Configurable in `vite.config.ts` if you're feeling creative.
