# Publishing

## CI/CD overview

Two workflows are included in `.github/workflows/`:

| Workflow | Trigger | What it does |
| -------- | ------- | ------------ |
| `ci.yml` | Every push to any branch | Typechecks, runs tests, and verifies Chrome and Firefox builds in parallel |
| `publish.yml` | Manual only | Builds both extensions, uploads them as artifacts, and publishes to the stores if credentials are configured |

To trigger a manual publish: **Actions → Publish → Run workflow → select branch → Run workflow**

Publishing is opt-in. If store credentials are not configured, the build and artifact steps still run and succeed — only the publish steps are skipped.

## Before your first publish

The publish pipeline can only update an existing extension — it cannot create one. Before running `publish.yml` for the first time you need to manually submit your extension to each store and get it approved.

**Chrome** — build with `npm run build`, zip the `dist/` folder, and upload it via the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole). Fill in the store listing and submit for review. Once approved, copy the extension ID from the dashboard. For a full walkthrough see the [Chrome Web Store developer docs](https://developer.chrome.com/docs/webstore).

**Firefox** — build with `npm run build:firefox`, zip the `dist/` folder, and upload it via the [AMO Developer Hub](https://addons.mozilla.org/developers/). Once listed, copy the extension ID from the manage page.

When zipping on macOS, use the `-X` flag to exclude hidden system files:

```bash
cd dist && zip -r -X ../extension-firefox.zip . && cd ..
```

AMO's linter will flag an `Unsafe call to import` warning in `content.js`. This is expected — the content script loads its messaging module via `import(browser.runtime.getURL(...))`, which is the standard pattern for loading modules in content scripts that cannot use static imports. Add the following to your notes to reviewer:

> The dynamic import() in content.js loads modules/messaging.js using browser.runtime.getURL(), which resolves to a locally bundled file within the extension package. This is the standard pattern for loading ES modules in content scripts. No remote code is executed.

After the first manual submission is approved, all future updates can go through `publish.yml`. Note that most of the times, your sumbission will not be published immediately and will still need to go through manual review.

## Setting up credentials

### Firefox

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

### Chrome

Chrome requires OAuth2. This is a one-time setup.

**Step 1 — Create OAuth credentials**

1. Open [Google Cloud Console](https://console.cloud.google.com/) and create a project.
2. Go to **APIs & Services → Library**, search for "Chrome Web Store API", and enable it.
3. Go to **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
4. Choose **Desktop app** as the application type.
5. Go to **APIs & Services → OAuth consent screen**, set user type to **External**, and add your Google account as a test user.
6. Copy the **Client ID** and **Client Secret** from the credentials page.

**Step 2 — Get a refresh token**

Open the following URL in your browser (replace `YOUR_CLIENT_ID`):

```
https://accounts.google.com/o/oauth2/auth?client_id=YOUR_CLIENT_ID&response_type=code&scope=https://www.googleapis.com/auth/chromewebstore&redirect_uri=http://localhost&access_type=offline&prompt=consent
```

Add `http://localhost` as an authorized redirect URI in your OAuth client settings first. After approving, the browser will try to load `http://localhost/?code=XXXX` — it won't load, but copy the `code` value from the URL bar.

Exchange it for a refresh token:

```bash
curl -X POST https://oauth2.googleapis.com/token \
  -d client_id=YOUR_CLIENT_ID \
  -d client_secret=YOUR_CLIENT_SECRET \
  -d code=YOUR_AUTH_CODE \
  -d grant_type=authorization_code \
  -d redirect_uri=http://localhost
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
