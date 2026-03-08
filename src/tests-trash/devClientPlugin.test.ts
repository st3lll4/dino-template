import { describe, it, expect } from "vitest";
import { hmrPlugin } from "../hmr-plugin";
import type { ResolvedConfig } from "vite";

// Extract devClientPlugin (index 2) from the real hmrPlugin array.
// Set the shared resolvedConfig closure by calling configResolved on
// manifestPlugin (index 0) — they share the same closure variable.
function setup(command: "serve" | "build", wsPort = 5174) {
  const plugins = hmrPlugin({ wsPort, devPort: 5173 });
  const configResolved = plugins[0].configResolved as (
    cfg: ResolvedConfig,
  ) => void;
  configResolved({ command } as unknown as ResolvedConfig);
  const renderChunk = plugins[2].renderChunk as (
    code: string,
    chunk: { fileName: string },
  ) => { code: string; map: null } | null;
  return renderChunk;
}

describe("devClientPlugin (real plugin)", () => {
  it("returns null in build mode", () => {
    const renderChunk = setup("build");
    expect(renderChunk("user code", { fileName: "background.js" })).toBeNull();
  });

  it("returns null for non-background chunks in dev mode", () => {
    const renderChunk = setup("serve");
    expect(renderChunk("user code", { fileName: "content.js" })).toBeNull();
  });

  it("injects dev client before user code in background.js", () => {
    const renderChunk = setup("serve");
    const result = renderChunk("user code", { fileName: "background.js" });
    expect(result).not.toBeNull();
    expect(result!.code.indexOf("(function()")).toBeLessThan(
      result!.code.indexOf("user code"),
    );
  });

  it("preserves user code in the output", () => {
    const renderChunk = setup("serve");
    const result = renderChunk("// my background code", {
      fileName: "background.js",
    });
    expect(result?.code).toContain("// my background code");
  });

  it("injects the correct wsPort into the dev client", () => {
    const renderChunk = setup("serve", 9999);
    const result = renderChunk("user code", { fileName: "background.js" });
    expect(result?.code).toContain("9999");
  });
});
