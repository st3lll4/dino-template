import { describe, it, expect } from "vitest";
import { transformManifest } from "../hmr-plugin/transformManifest";
import type { SourceManifest } from "../hmr-plugin/types";

const source: SourceManifest = {
  manifest_version: 3,
  name: "Test Extension",
  version: "1.0.0",
  action: { default_popup: "popup.html" },
  background: { service_worker: "background.js" },
  permissions: ["storage", "scripting"],
  host_permissions: ["<all_urls>"],
  web_accessible_resources: [
    { resources: ["content.js"], matches: ["<all_urls>"] },
  ],
  side_panel: { default_path: "sidepanel.html" },
};

describe("transformManifest", () => {
  describe("chrome-mv3", () => {
    const result = transformManifest(source, "chrome-mv3");

    it("sets manifest_version to 3", () => {
      expect(result.manifest_version).toBe(3);
    });
    it("keeps action", () => {
      expect(result.action?.default_popup).toBe("popup.html");
    });
    it("removes browser_action", () => {
      expect(result.browser_action).toBeUndefined();
    });
    it("removes browser_specific_settings", () => {
      expect(result.browser_specific_settings).toBeUndefined();
    });
    it("keeps service_worker", () => {
      expect(result.background?.service_worker).toBe("background.js");
    });
  });

  describe("firefox-mv3", () => {
    const result = transformManifest(source, "firefox-mv3");

    it("sets manifest_version to 3", () => {
      expect(result.manifest_version).toBe(3);
    });
    it("keeps action", () => {
      expect(result.action?.default_popup).toBe("popup.html");
    });
    it("removes side_panel", () => {
      expect(result.side_panel).toBeUndefined();
    });
    it("adds gecko id", () => {
      expect(result.browser_specific_settings?.gecko?.id).toBeTruthy();
    });
  });

  describe("firefox-mv2", () => {
    const result = transformManifest(source, "firefox-mv2");

    it("sets manifest_version to 2", () => {
      expect(result.manifest_version).toBe(2);
    });
    it("removes action", () => {
      expect(result.action).toBeUndefined();
    });
    it("adds browser_action", () => {
      expect(result.browser_action?.default_popup).toBe("popup.html");
    });
    it("removes side_panel", () => {
      expect(result.side_panel).toBeUndefined();
    });
    it("removes host_permissions", () => {
      expect(result.host_permissions).toBeUndefined();
    });
    it("merges host_permissions into permissions", () => {
      expect(result.permissions).toContain("<all_urls>");
    });
    it("strips scripting permission", () => {
      expect(result.permissions).not.toContain("scripting");
    });
    it("flattens web_accessible_resources to string array", () => {
      expect(result.web_accessible_resources?.[0]).toBe("content.js");
    });
    it("adds gecko id", () => {
      expect(result.browser_specific_settings?.gecko?.id).toBeTruthy();
    });
    it("uses scripts[] for background", () => {
      expect(result.background?.scripts?.[0]).toBe("background.js");
    });
  });

  describe("immutability", () => {
    it("does not mutate the source manifest", () => {
      expect(source.manifest_version).toBe(3);
      expect(source.action?.default_popup).toBe("popup.html");
      expect(source.permissions).toContain("scripting");
    });
  });
});
