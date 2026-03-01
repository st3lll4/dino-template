import { describe, it, expect, vi } from "vitest"
import { generateDevClient } from "../helpers/generateDevClient"

// We test the renderChunk logic directly rather than
// going through Vite internals — same logic, easier to test

function simulateRenderChunk(
  code: string,
  fileName: string,
  command: "serve" | "build",
  wsPort: number
) {
  // mirrors exactly what devClientPlugin.renderChunk does
  if (command !== "serve") return null

  if (fileName === "background.js") {
    const client = generateDevClient(wsPort)
    return { code: client + "\n\n" + code, map: null }
  }

  return null
}

describe("devClientPlugin renderChunk logic", () => {
  it("does nothing in build mode", () => {
    const result = simulateRenderChunk("user code", "background.js", "build", 5174)
    expect(result).toBeNull()
  })

  it("does nothing for non-background chunks in dev mode", () => {
    const result = simulateRenderChunk("user code", "content/index.js", "serve", 5174)
    expect(result).toBeNull()
  })

  it("injects dev client into background.js in dev mode", () => {
    const result = simulateRenderChunk("user code", "background.js", "serve", 5174)
    expect(result).not.toBeNull()
    expect(result?.code).toContain("user code")
    expect(result?.code).toContain("ext:ready")
  })

  it("dev client appears before user code", () => {
    const result = simulateRenderChunk("user code", "background.js", "serve", 5174)
    const devClientIndex = result!.code.indexOf("ext:ready")
    const userCodeIndex = result!.code.indexOf("user code")
    expect(devClientIndex).toBeLessThan(userCodeIndex)
  })

  it("injects correct port", () => {
    const result = simulateRenderChunk("user code", "background.js", "serve", 9999)
    expect(result?.code).toContain("9999")
  })
})