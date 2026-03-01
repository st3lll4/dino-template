import { SourceManifest, TargetBrowser } from "../types/hmr-plugin-types"

export function transformManifest(src: SourceManifest, target: TargetBrowser): SourceManifest {
  const m: SourceManifest = JSON.parse(JSON.stringify(src))

  if (target === "chrome-mv3" || target === "firefox-mv3") {
    m.manifest_version = 3

    // MV3 uses service_worker, not scripts[]
    if (m.background) {
      const sw = m.background.service_worker ?? m.background.scripts?.[0] ?? "background.js"
      m.background = { service_worker: sw, type: "module" }
    }

    // if source used browser_action, promote it
    if (m.browser_action && !m.action) {
      m.action = m.browser_action
    }
    delete m.browser_action

    // MV3 web_accessible_resources must be array of objects
    if (Array.isArray(m.web_accessible_resources)) {
      const first = m.web_accessible_resources[0]
      if (typeof first === "string") {
        m.web_accessible_resources = [{
          resources: m.web_accessible_resources as string[],
          matches: ["<all_urls>"],
        }]
      }
    }
  }
  if (target === "chrome-mv3") {
    delete m.browser_specific_settings
  }

  if (target === "firefox-mv3") {
    delete m.side_panel

    if (!m.browser_specific_settings?.gecko?.id) {
      m.browser_specific_settings = {
        gecko: {
          id: m.browser_specific_settings?.gecko?.id ?? "{your-extension-id@example.com}",
          strict_min_version: "109.0",
        }
      }
    }
  }

  if (target === "firefox-mv2") {
    m.manifest_version = 2

    if (m.background) {
      const script = m.background.service_worker ?? m.background.scripts?.[0] ?? "background.js"
      m.background = { scripts: [script], persistent: false }
    }

    if (m.action) {
      m.browser_action = m.action
      delete m.action
    }

    delete m.side_panel

    // MV2 has no host_permissions, merge into permissions
    if (m.host_permissions?.length) {
      m.permissions = [...(m.permissions ?? []), ...m.host_permissions]
      delete m.host_permissions
    }

    // MV2 doesn't need scripting permission
    if (m.permissions) {
      m.permissions = m.permissions.filter(p => p !== "scripting")
    }

    // MV2 web_accessible_resources is a flat string array
    if (Array.isArray(m.web_accessible_resources)) {
      const first = m.web_accessible_resources[0]
      if (first && typeof first === "object" && "resources" in first) {
        m.web_accessible_resources = (
          m.web_accessible_resources as Array<{ resources: string[] }>
        ).flatMap(entry => entry.resources)
      }
    }

    // Ensure gecko id exists
    if (!m.browser_specific_settings?.gecko?.id) {
      m.browser_specific_settings = {
        gecko: {
          id: "{your-extension-id@example.com}",
          strict_min_version: "109.0",
        }
      }
    }
  }

  return m
}