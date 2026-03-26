import { z } from "zod";
import type { ApiSchema, EndpointDefinition } from "./types";

type BodyArg<Def extends EndpointDefinition> = Def["body"] extends z.ZodTypeAny
  ? { body: z.infer<Def["body"]> }
  : { body?: never };

type ApiClient<Schema extends ApiSchema> = {
  [Key in keyof Schema]: (
    options?: BodyArg<Schema[Key]> & {
      params?: Record<string, string>;
      headers?: Record<string, string>;
    }
  ) => Promise<z.infer<Schema[Key]["response"]>>;
};

export function createApi<Schema extends ApiSchema>(schema: Schema): ApiClient<Schema> {
  const client = {} as ApiClient<Schema>;

  for (const key in schema) {
    const endpoint = schema[key];

    (client as Record<string, unknown>)[key] = async (options: {
      params?: Record<string, string>;
      body?: unknown;
      headers?: Record<string, string>;
    } = {}) => {
      let url = endpoint.url;

      if (options.params) {
        const query = new URLSearchParams(options.params).toString();
        url = `${url}?${query}`;
      }

      const validatedBody = endpoint.body && options.body !== undefined
        ? endpoint.body.parse(options.body)
        : options.body;

      const res = await fetch(url, {
        method: endpoint.method,
        headers: {
          "Content-Type": "application/json",
          ...endpoint.headers,
          ...options.headers,
        },
        body:
          endpoint.method !== "GET" && validatedBody !== undefined
            ? JSON.stringify(validatedBody)
            : undefined,
      });

      if (!res.ok) {
        throw new Error(`${endpoint.method} ${url} failed: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      return endpoint.response.parse(data);
    };
  }

  return client;
}
