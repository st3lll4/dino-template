// Marks a message as having a typed request and response.
// Messages without this wrapper are fire-and-forget (void return).
export type ProtocolWithReturn<Data, Return> = {
  __data: Data;
  __return: Return;
};

// The global message schema — extend this interface from your own files.
//
// Example:
//   declare module "../messaging" {
//     interface MessageSchema {
//       "get-tab-info": ProtocolWithReturn<{ tabId: number }, { url: string }>
//       "ping": ProtocolWithReturn<void, { pong: true }>
//     }
//   }
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface MessageSchema {}

// Union of all registered message names.
export type MessageId = keyof MessageSchema;

// Sender info available in every onMessage handler.
export type MessageSender = chrome.runtime.MessageSender;

// Extracts the request payload type from a schema entry.
export type DataOf<T> =
  T extends ProtocolWithReturn<infer Data, unknown> ? Data : T;

// Extracts the response type from a schema entry. void if fire-and-forget.
export type ReturnOf<T> =
  T extends ProtocolWithReturn<unknown, infer Return> ? Return : void;

// Internal — wraps every outgoing message so the dispatcher can identify it.
export type MessageRequest<Key extends MessageId> = {
  __bridge: true;
  messageId: Key;
  data: DataOf<MessageSchema[Key]>;
};

export type MessageResponse =
  | { ok: true; result: unknown }
  | { ok: false; error: string };
