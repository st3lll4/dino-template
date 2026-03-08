import type {
  MessageId,
  MessageSender,
  MessageSchema,
  RequestEnvelope,
  ResponseEnvelope,
  DataOf,
  ReturnOf,
} from "./types";

export type { ProtocolWithReturn, MessageSchema, MessageId, MessageSender } from "./types";

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

// Register a handler for a message. Call this before initMessaging().
export function onMessage<Key extends MessageId>(
  messageId: Key,
  handler: (data: DataOf<MessageSchema[Key]>, sender: MessageSender) => ReturnOf<MessageSchema[Key]> | Promise<ReturnOf<MessageSchema[Key]>>,
): void {
  handlers.set(messageId, handler as (data: DataOf<MessageSchema[MessageId]>, sender: MessageSender) => unknown);
}

// Wire up chrome.runtime.onMessage. Call once at the top of background/index.ts
// and content/index.ts. Returns true to keep the channel open for async handlers.
export function initMessaging(): void {
  chrome.runtime.onMessage.addListener(
    (
      message: unknown,
      sender: MessageSender,
      sendResponse: (response: ResponseEnvelope) => void,
    ) => {
      if (!isRequestEnvelope(message)) return false;

      const handler = handlers.get(message.messageId);

      if (!handler) {
        sendResponse({ ok: false, error: `No handler for "${String(message.messageId)}"` });
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

// Send a message to background from any context (popup, content, sidepanel).
export function sendMessage<Key extends MessageId>(
  messageId: Key,
  data: DataOf<MessageSchema[Key]>,
): Promise<ReturnOf<MessageSchema[Key]>> {
  return new Promise((resolve, reject) => {
    const envelope: RequestEnvelope<Key> = { __bridge: true, messageId, data };

    chrome.runtime.sendMessage(envelope, (response: ResponseEnvelope) => {
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

// Send a message from background to a specific tab's content script.
export function sendToTab<Key extends MessageId>(
  tabId: number,
  messageId: Key,
  data: DataOf<MessageSchema[Key]>,
): Promise<ReturnOf<MessageSchema[Key]>> {
  return new Promise((resolve, reject) => {
    const envelope: RequestEnvelope<Key> = { __bridge: true, messageId, data };

    chrome.tabs.sendMessage(tabId, envelope, (response: ResponseEnvelope) => {
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
