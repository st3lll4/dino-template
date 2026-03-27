import { z } from "zod";

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export type ZodBody = z.ZodObject<z.ZodRawShape> | z.ZodArray<z.ZodTypeAny>;

export type EndpointDefinition = {
  url: string;
  method: HttpMethod;
  response: z.ZodTypeAny;
  body?: ZodBody;
  headers?: Record<string, string>;
};

export type ApiSchema = Record<string, EndpointDefinition>;
