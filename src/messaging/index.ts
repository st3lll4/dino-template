import browser from "webextension-polyfill";
import type {
  HandlerMap,
  DataOf,
  ReturnOf,
  MessageRequest,
  MessageResponse,
} from "./types";

export type { HandlerMap } from "./types";

function isMessageRequest(msg: unknown): msg is MessageRequest {
  return (
    typeof msg === "object" &&
    msg !== null &&
    (msg as Record<string, unknown>).__bridge === true
  );
}

type AnyHandler = (
  data: unknown,
  sender: browser.Runtime.MessageSender,
) => unknown;

async function sendVia<Result>(
  send: (req: MessageRequest) => Promise<MessageResponse>,
  messageId: string,
  data: unknown,
): Promise<Result> {
  const res = await send({ __bridge: true, messageId, data });
  if (!res.ok) throw new Error(res.error);
  return res.result as Result;
}

class MessagingBuilder<Schema extends HandlerMap> {
  private handlers: Map<string, AnyHandler>;

  constructor(
    private schema: Schema,
    handlers?: Map<string, AnyHandler>,
  ) {
    this.handlers = handlers ?? new Map();
  }

  /* Register a handler */
  add<Key extends string, Data, Result>(
    key: Key,
    handler: (
      data: Data,
      sender?: browser.Runtime.MessageSender,
    ) => Result | Promise<Result>,
  ) {
    this.handlers.set(key, handler as AnyHandler);

    type Next = Schema & Record<Key, (data: Data) => Result | Promise<Result>>;
    return new MessagingBuilder<Next>(this.schema as Next, this.handlers);
  }

  /* Start listening for messages. Returns the schema type for `typeof messaging` */
  init(): Schema {
    browser.runtime.onMessage.addListener((msg, sender) => {
      if (!isMessageRequest(msg)) return;

      const handler = this.handlers.get(msg.messageId);

      if (!handler) {
        return Promise.resolve({ ok: false, error: `No handler for "${msg.messageId}"` });
      }

      return Promise.resolve()
        .then(() => handler(msg.data, sender))
        .then((result) => ({ ok: true, result }))
        .catch((err: unknown) => ({
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        }));
    });

    return this.schema;
  }
}

export function createMessaging() {
  return new MessagingBuilder<{}>({});
}

/* ------------------------------------------------------------------ */
/*  Sender – sends typed messages from popup / content / sidepanel    */
/* ------------------------------------------------------------------ */

export function createSender<Schema extends HandlerMap>() {
  return {
    send<Key extends keyof Schema & string>(
      key: Key,
      data: DataOf<Schema, Key>,
    ) {
      return sendVia<ReturnOf<Schema, Key>>(
        (req) => browser.runtime.sendMessage(req) as Promise<MessageResponse>,
        key,
        data,
      );
    },

    sendToTab<Key extends keyof Schema & string>(
      tabId: number,
      key: Key,
      data: DataOf<Schema, Key>,
    ) {
      return sendVia<ReturnOf<Schema, Key>>(
        (req) => browser.tabs.sendMessage(tabId, req) as Promise<MessageResponse>,
        key,
        data,
      );
    },
  };
}
