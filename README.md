# ✨ Extension template

Your cross-browser extension starter.
No refreshing manually like it's 2012. Supports Chrome MV3 and Firefox MV3. Safari is supported via the Chrome MV3 build — feed `dist/` to `xcrun safari-web-extension-converter` to generate the Xcode project. Has HMR, end-to-end typed messaging, and type-safe external API requests.

## 💅 Setup

```bash
npm install
```

## 🔥 Dev mode

Vite watches your files, rebuilds on save, and HMR keeps your extension pages fresh in real time. Iconic.

```bash
# Chrome
npm run dev

# Firefox
npm run dev:firefox
```

Then load your extension from `dist/`:

- **Chrome** — `chrome://extensions` → enable developer mode → load unpacked → select `dist/`
- **Firefox** — `about:debugging` → This Firefox → load temporary add-on → select `dist/manifest.json`

## Production build

When you're ready to go live:

```bash
# Chrome
npm run build

# Firefox
npm run build:firefox
```

Output lands in `dist/`. TypeScript errors will fail the build — run `npm run typecheck` to check without building.

### Safari

Safari uses the Chrome MV3 build as input. After running `npm run build`, convert it with:

```bash
xcrun safari-web-extension-converter dist/ --project-location ./safari --app-name "YourExtension"
```

This generates an Xcode project you can build and distribute via the Mac App Store.

## HMR 101

| Layer             | What happens                                                              |
| ----------------- | ------------------------------------------------------------------------- |
| Popup / sidepanel | Native Vite HMR via `localhost:5173`                                      |
| Background script | WebSocket event → reload active tab(s) then `browser.runtime.reload()`     |
| Content scripts   | WebSocket event → reload active tab(s) to re-run content script injection |

WebSocket server runs on port `5174`. Configurable in `vite.config.ts` if you're feeling creative.

> Vite does not run type checking during dev — TypeScript errors will not stop HMR. Use `npm run typecheck` to catch them, or rely on your editor.

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

## Typed API requests

External API requests are defined in `src/api/endpoints.ts` using `createApi`. Each endpoint has a URL, HTTP method, and a [Zod](https://zod.dev) response schema. Zod validates the response at runtime and TypeScript infers the return type automatically.

```ts
export const api = createApi({
  getRandomImage: {
    url: "https://random-d.uk/api/random",
    method: "GET",
    response: z.object({
      url: z.string(),
      message: z.string().optional(),
    }),
  },
});

// return type is inferred: { url: string, message?: string }
const duck = await api.getRandomImage();
```

If an endpoint defines a `body` schema, TypeScript enforces the correct shape at compile time:

```ts
testPost: {
  url: "https://httpbin.org/post",
  method: "POST",
  body: z.object({ name: z.string() }),
  response: z.object({ json: z.unknown() }),
}

await api.testPost({ body: { name: "Mary" } }); // ok
await api.testPost({ body: { nme: "Mary" } });  // compile error
```

You can also pass query params and custom headers at call time:

```ts
await api.getUser({ params: { id: "123" } });
await api.createUser({ body: { name: "Sally" } });
await api.getUser({ headers: { Authorization: "Bearer token" } });
```

Static headers (e.g. API keys) can be set on the endpoint definition directly:

```ts
headers: { "Authorization": `Bearer ${token}` },
```

To avoid blocked calls on production, add `host_permissions` to `src/manifest.json` for each external domain you call:

```json
"host_permissions": ["https://api.example.com/*"]
```

> API requests should be made from the background script, which has stable network access and the correct permissions.

## CI/CD

Two workflows are included in `.github/workflows/`:

| Workflow | Trigger | What it does |
| -------- | ------- | ------------ |
| `ci.yml` | Every push to any branch | Typechecks, runs tests, and verifies Chrome and Firefox builds in parallel |
| `publish.yml` | Manual only | Builds both extensions, uploads them as artifacts, and publishes to the stores if credentials are configured |

To trigger a manual publish: **Actions → Publish → Run workflow → select branch → Run workflow**

Publishing is opt-in. If store credentials are not configured, the build and artifact steps still run and succeed — only the publish steps are skipped.

### Setting up publishing

#### Firefox

1. Go to [addons.mozilla.org/developers/addon/api/key](https://addons.mozilla.org/en-US/developers/addon/api/key/) and generate an API key pair.
2. Find your extension ID on the AMO manage page for your extension.

Add to GitHub **Secrets** (`Settings → Secrets and variables → Actions → Secrets`):

| Secret | Where to find it |
| ------ | ---------------- |
| `AMO_JWT_ISSUER` | Shown after generating the API key |
| `AMO_JWT_SECRET` | Shown once after generating — save it immediately |

Add to GitHub **Variables** (`Settings → Secrets and variables → Actions → Variables`):

| Variable | Where to find it |
| -------- | ---------------- |
| `FIREFOX_EXTENSION_ID` | AMO manage page for your extension |

#### Chrome

Chrome requires OAuth2. This is a one-time setup.

**Step 1 — Create OAuth credentials**

1. Open [Google Cloud Console](https://console.cloud.google.com/) and create a project.
2. Go to **APIs & Services → Library**, search for "Chrome Web Store API", and enable it.
3. Go to **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
4. Choose **Desktop app** as the application type.
5. Copy the **Client ID** and **Client Secret**.

**Step 2 — Get a refresh token**

Open the following URL in your browser (replace `YOUR_CLIENT_ID`):

```
https://accounts.google.com/o/oauth2/auth?client_id=YOUR_CLIENT_ID&response_type=code&scope=https://www.googleapis.com/auth/chromewebstore&redirect_uri=urn:ietf:wg:oauth:2.0:oob
```

Approve the permissions. Copy the authorization code shown, then exchange it for a refresh token:

```bash
curl -X POST https://oauth2.googleapis.com/token \
  -d client_id=YOUR_CLIENT_ID \
  -d client_secret=YOUR_CLIENT_SECRET \
  -d code=YOUR_AUTH_CODE \
  -d grant_type=authorization_code \
  -d redirect_uri=urn:ietf:wg:oauth:2.0:oob
```

Copy `refresh_token` from the response. This token does not expire.

**Step 3 — Add to GitHub**

Add to GitHub **Secrets**:

| Secret | Where to find it |
| ------ | ---------------- |
| `CHROME_CLIENT_ID` | Google Cloud Console → Credentials |
| `CHROME_CLIENT_SECRET` | Google Cloud Console → Credentials |
| `CHROME_REFRESH_TOKEN` | From the curl response above |

Add to GitHub **Variables**:

| Variable | Where to find it |
| -------- | ---------------- |
| `CHROME_EXTENSION_ID` | Chrome Web Store Developer Dashboard → your extension |
