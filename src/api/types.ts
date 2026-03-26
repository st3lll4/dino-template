import { z } from "zod";

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

// TODO: add typed params validation using Zod
export type EndpointDefinition<TBody extends z.ZodTypeAny = z.ZodTypeAny> = {
  url: string;
  method: HttpMethod;
  response: z.ZodTypeAny;
  body?: TBody;
  headers?: Record<string, string>;
};

export type ApiSchema = Record<string, EndpointDefinition>;
