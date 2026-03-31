import { SourceManifest, TargetBrowser } from "./types";

export function transformManifest(
  src: SourceManifest,
  target: TargetBrowser,
  hmrEnabled = false,
  wsPort = 5174,
): SourceManifest {
  const m: SourceManifest = JSON.parse(JSON.stringify(src));

  if (target === "chrome") {
    if (m.background?.service_worker) {
      m.background = { service_worker: m.background.service_worker, type: "module" };
    }
    delete m.browser_specific_settings;
  }

  if (target === "firefox") {
    if (m.background?.service_worker) {
      m.background = { page: "background.html" };
    }

delete m.side_panel;

    if (m.permissions) {
      m.permissions = m.permissions.filter((p) => p !== "sidePanel");
    }

    if (hmrEnabled) {
      m.content_security_policy = {
        extension_pages: `script-src 'self'; connect-src 'self' https: ws://localhost:${wsPort}`,
      };
    }

    if (!m.browser_specific_settings?.gecko?.id) {
      m.browser_specific_settings = {
        gecko: {
          id: "extension@example.com",
          strict_min_version: "109.0",
          data_collection_permissions: { required: ["none"], optional: [] },
        },
      };
    } else {
      m.browser_specific_settings.gecko!.data_collection_permissions = { required: ["none"], optional: [] };
    }
  }

  return m;
}
