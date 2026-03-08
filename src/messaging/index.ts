import type {
  MessageId,
  MessageSender,
  MessageSchema,
  RequestEnvelope,
  ResponseEnvelope,
  DataOf,
  ReturnOf,
} from "./types";

export type {
  ProtocolWithReturn,
  MessageSchema,
  MessageId,
  MessageSender,
} from "./types";

function isRequestEnvelope(msg: unknown): msg is RequestEnvelope<MessageId> {
  return (
    typeof msg === "object" &&
    msg !== null &&
    (msg as Record<string, unknown>).__bridge === true
  );
}

const handlers = new Map<
  MessageId,
  (data: DataOf<MessageSchema[MessageId]>, sender: MessageSender) => unknown
>();

let initialized = false;

// Register a handler for a message. Call this before initMessaging().
export function onMessage<Key extends MessageId>(
  messageId: Key,
  handler: (
    data: DataOf<MessageSchema[Key]>,
    sender: MessageSender,
  ) => ReturnOf<MessageSchema[Key]> | Promise<ReturnOf<MessageSchema[Key]>>,
): void {
  handlers.set(
    messageId,
    handler as (
      data: DataOf<MessageSchema[MessageId]>,
      sender: MessageSender,
    ) => unknown,
  );
}

// Wire up chrome.runtime.onMessage. No-op if called more than once.
export function initMessaging(): void {
  if (initialized) return;
  initialized = true;

  chrome.runtime.onMessage.addListener(
    (
      message: unknown,
      sender: MessageSender,
      sendResponse: (response: ResponseEnvelope) => void,
    ) => {
      if (!isRequestEnvelope(message)) return false;

      const handler = handlers.get(message.messageId);

      if (!handler) {
        sendResponse({
          ok: false,
          error: `No handler for "${String(message.messageId)}"`,
        });
        return false;
      }

      Promise.resolve(handler(message.data, sender))
        .then((result) => sendResponse({ ok: true, result }))
        .catch((err: unknown) =>
          sendResponse({
            ok: false,
            error: err instanceof Error ? err.message : String(err),
          }),
        );

      return true;
    },
  );
}

function sendVia<Key extends MessageId>(
  send: (
    envelope: RequestEnvelope<Key>,
    cb: (r: ResponseEnvelope) => void,
  ) => void,
  messageId: Key,
  data: DataOf<MessageSchema[Key]>,
): Promise<ReturnOf<MessageSchema[Key]>> {
  return new Promise((resolve, reject) => {
    send({ __bridge: true, messageId, data }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      if (!response.ok) {
        reject(new Error(response.error));
        return;
      }
      resolve(response.result as ReturnOf<MessageSchema[Key]>);
    });
  });
}

// Send a message to the background from any context (popup, content, sidepanel).
export const sendMessage = <Key extends MessageId>(
  messageId: Key,
  data: DataOf<MessageSchema[Key]>,
) => sendVia((env, cb) => chrome.runtime.sendMessage(env, cb), messageId, data);

// Send a message from the background to a specific tab's content script.
export const sendToTab = <Key extends MessageId>(
  tabId: number,
  messageId: Key,
  data: DataOf<MessageSchema[Key]>,
) =>
  sendVia(
    (env, cb) => chrome.tabs.sendMessage(tabId, env, cb),
    messageId,
    data,
  );
