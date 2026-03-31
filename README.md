# 🦕 dino-template

Your cross-browser extension starter. Supports Chrome MV3 and Firefox MV3. Safari is supported via the Chrome MV3 build. Has HMR, end-to-end typed messaging, and type-safe external API requests.

## Making it yours

Before building anything, update these fields in `src/manifest.json`:

| Field | Default | What to set |
| ----- | ------- | ----------- |
| `name` | `"dino-template@st31114"` | Your extension's name |
| `version` | `"1.0"` | Your starting version |
| `description` | template description | What your extension does |
| `browser_specific_settings.gecko.id` | `"dino-template@st3lll4"` | A unique ID for Firefox AMO, e.g. `your-extension@yourname` |
| `host_permissions` | demo API domains | The external domains your extension actually calls — remove the defaults if you are not using them |

## Setup

```bash
npm install
```

## Dev mode

Vite watches your files, rebuilds on save, and HMR keeps your extension pages fresh in real time. iconic.

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

When you're ready to go to prod:

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


## HMR

- This template uses `vite build --watch` + a custom WebSocket bridge for extension-only reload behavior.
- Background updates are prioritized over content updates when both are detected in one debounce window.
- Current watched outputs are:
  - `dist/background.js`
  - `dist/content.js`
  - `dist/modules/messaging.js`

> Vite does not run type checking during dev — TypeScript errors will not stop HMR. Use `npm run typecheck` to catch them, or rely on your editor.

### Adding new scripts and modules

If you add another content-related entry/module that should trigger content tab reload, include its output file in the HMR watcher list in `src/hmr-plugin/index.ts`.

The current setup does not auto-discover entries, so new relevant outputs must be registered !

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

## Logging

Each context has a logger created with `createLogger(prefix)` from `src/logger.ts`, which wraps `console` with a `[prefix]` tag. The content script inlines the same pattern directly to avoid static imports.

## CI/CD

CI runs on every push. A manual publish workflow is included for Chrome and Firefox. See [PUBLISHING.md](./PUBLISHING.md) for setup instructions.
