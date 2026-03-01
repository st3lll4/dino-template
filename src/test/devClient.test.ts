import { describe, it, expect } from "vitest"
import { generateDevClient } from "../helpers/generateDevClient"

describe("generateDevClient", () => {
  const client = generateDevClient(5174)

  it("is a string", () => {
    expect(typeof client).toBe("string")
  })

  it("contains the correct port", () => {
    expect(client).toContain("5174")
  })

  it("is wrapped in an IIFE so it does not leak scope", () => {
    expect(client).toContain("(function()")
    expect(client).toContain("})()")
  })

  it("connects to the correct websocket url", () => {
    expect(client).toContain("ws://localhost:")
  })

  it("sends ext:ready on open", () => {
    expect(client).toContain("ext:ready")
  })

  it("handles background-updated event", () => {
    expect(client).toContain("background-updated")
  })

  it("handles full-reload event", () => {
    expect(client).toContain("full-reload")
  })

  it("handles content-updated event", () => {
    expect(client).toContain("content-updated")
  })

  it("calls chrome.runtime.reload on background-updated", () => {
    expect(client).toContain("chrome.runtime.reload()")
  })

  it("has reconnect logic", () => {
    expect(client).toContain("scheduleReconnect")
  })

  it("uses different port when specified", () => {
    const otherClient = generateDevClient(9999)
    expect(otherClient).toContain("9999")
    expect(otherClient).not.toContain("5174")
  })
})