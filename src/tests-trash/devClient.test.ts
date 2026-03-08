import { describe, it, expect } from "vitest";
import { generateDevClient } from "../hmr-plugin/generateDevClient";

describe("generateDevClient", () => {
  it("is wrapped in an IIFE so it does not leak scope", () => {
    const client = generateDevClient(5174);
    expect(client).toContain("(function()");
    expect(client).toContain("})()");
  });

  it("interpolates the given port and does not bleed into other instances", () => {
    const a = generateDevClient(5174);
    const b = generateDevClient(9999);
    expect(a).toContain("5174");
    expect(b).toContain("9999");
    expect(b).not.toContain("5174");
  });

  it("calls chrome.runtime.reload for background reload", () => {
    const client = generateDevClient(5174);
    expect(client).toContain("chrome.runtime.reload()");
  });
});
