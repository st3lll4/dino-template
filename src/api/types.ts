import { z } from "zod";

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export type HttpHeaders = { [header: string]: string };

export type Body = z.ZodObject<z.ZodRawShape> | z.ZodArray<z.ZodTypeAny>;

export type EndpointDefinition = {
  url: string;
  method: HttpMethod;
  response: z.ZodTypeAny;
  body?: Body;
  headers?: HttpHeaders;
};

export type ApiSchema = { [endpoint: string]: EndpointDefinition };

export type JsonPrimitive = string | number | boolean | null;
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

export type BodyArg<Def extends EndpointDefinition> = Def["body"] extends z.ZodTypeAny
  ? { body: z.infer<Def["body"]> }
  : { body?: never };

export type RequestOverrides = {
  params?: HttpHeaders;
  headers?: HttpHeaders;
};

export type EndpointOptions<Def extends EndpointDefinition> = BodyArg<Def> & RequestOverrides;

export type ApiClient<Schema extends ApiSchema> = {
  [Key in keyof Schema]: (
    options?: EndpointOptions<Schema[Key]>,
  ) => Promise<z.infer<Schema[Key]["response"]>>;
};

export type CallOptions = RequestOverrides & { body?: JsonObject | JsonArray };

export type AnyApiFunction = (options?: CallOptions) => Promise<JsonValue>;
