export type HandlerMap = Record<string, (data: any) => any>;

// extracts request type for a given message key
export type DataOf<
  Handler extends HandlerMap,
  Key extends keyof Handler,
> = Handler[Key] extends (data: infer Data) => any ? Data : never;

// unwraps promises and extraxts return value 
export type ReturnOf<
  Handler extends HandlerMap,
  Key extends keyof Handler,
> = Handler[Key] extends (data: any) => infer ReturnValue
  ? Awaited<ReturnValue>
  : null;

// wrapper
export type MessageRequest = {
  __bridge: true;
  messageId: string;
  data: unknown;
};

export type MessageResponse =
  | { ok: true; result: unknown }
  | { ok: false; error: string };

export type HandlerSignature<Data, ReturnValue> = (
  data: Data,
) => ReturnValue | Promise<ReturnValue>;