import type {
  ApiSchema,
  ApiClient,
  AnyApiFunction,
  CallOptions,
  JsonValue,
} from "./types";

export function createApi<Schema extends ApiSchema>(
  schema: Schema,
): ApiClient<Schema> {
  const client = {} as ApiClient<Schema>;

  for (const key in schema) {
    const endpoint = schema[key];

    (client as Record<string, AnyApiFunction>)[key] = async (
      options: CallOptions = {},
    ): Promise<JsonValue> => {
      let url = endpoint.url;

      if (options.params) {
        const query = new URLSearchParams(options.params).toString();
        url = `${url}?${query}`;
      }

      const validatedBody =
        endpoint.body && options.body !== undefined
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
        throw new Error(
          `${endpoint.method} ${url} failed: ${res.status} ${res.statusText}`,
        );
      }

      const data: JsonValue = await res.json();
      return endpoint.response.parse(data) as JsonValue;
    };
  }

  return client;
}
