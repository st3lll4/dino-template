import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";
import { createApi } from "../api/index";

/* Hello there! 
These tests are just an example where and how to set up tests for any logic the developer writes. 
The tests are illustrative to show how the pipeline uses them and where to add more tests if necessary.  */

const schema = {
  getUser: {
    url: "https://api.example.com/user",
    method: "GET" as const,
    response: z.object({ id: z.number(), name: z.string() }),
  },
};

function mockFetch(body: unknown, ok = true, status = 200) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok,
      status,
      statusText: ok ? "OK" : "Not Found",
      json: () => Promise.resolve(body),
    }),
  );
}

beforeEach(() => {
  vi.unstubAllGlobals();
});

describe("createApi", () => {
  it("returns parsed response when fetch succeeds and shape matches", async () => {
    mockFetch({ id: 1, name: "Mary" });
    const api = createApi(schema);

    const result = await api.getUser();

    expect(result).toEqual({ id: 1, name: "Mary" });
  });

  it("throws when response shape does not match the schema", async () => {
    mockFetch({ id: "not-a-number", name: "Mary" });
    const api = createApi(schema);

    await expect(api.getUser()).rejects.toThrow();
  });

  it("throws when fetch returns a non-ok status", async () => {
    mockFetch({}, false, 404);
    const api = createApi(schema);

    await expect(api.getUser()).rejects.toThrow("GET https://api.example.com/user failed: 404");
  });
});
