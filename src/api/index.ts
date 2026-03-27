import { z } from "zod";
import type { ApiSchema, EndpointDefinition } from "./types";

type JsonPrimitive = string | number | boolean | null;
type JsonObject = { [key: string]: JsonValue };
type JsonArray = JsonValue[];
type JsonValue = JsonPrimitive | JsonObject | JsonArray;

type CallOptions = {
  params?: Record<string, string>;
  body?: JsonObject | JsonArray;
  headers?: Record<string, string>;
};

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

type AnyApiFunction = (options?: CallOptions) => Promise<JsonValue>;

export function createApi<Schema extends ApiSchema>(schema: Schema): ApiClient<Schema> {
  const client = {} as ApiClient<Schema>;

  for (const key in schema) {
    const endpoint = schema[key];

    (client as Record<string, AnyApiFunction>)[key] = async (options: CallOptions = {}): Promise<JsonValue> => {
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

      const data: JsonValue = await res.json();
      return endpoint.response.parse(data) as JsonValue;;
    };
  }

  return client;
}
