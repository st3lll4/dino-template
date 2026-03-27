import { z } from "zod";
import { createApi } from "./index";

export const api = createApi({
  getRandomImage: {
    url: "https://random-d.uk/api/random",
    method: "GET",
    response: z.object({
      url: z.string(),
      message: z.string().optional(),
    }),
  },
  testPost: {
    url: "https://httpbin.org/post",
    method: "POST",
    headers: { "X-Custom-Header": "hello-from-extension" },
    body: z.object({
      hello: z.string(),
      timestamp: z.number(),
    }),
    response: z.object({
      json: z.unknown(),
      url: z.string(),
      headers: z.record(z.string(), z.string()),
    }),
  },
});
