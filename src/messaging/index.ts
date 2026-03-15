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
  sender: chrome.runtime.MessageSender,
) => unknown;

function sendVia<Result>(
  transport: (req: MessageRequest, cb: (res: MessageResponse) => void) => void,
  messageId: string,
  data: unknown,
): Promise<Result> {
  return new Promise((resolve, reject) => {
    transport({ __bridge: true, messageId, data }, (res) => {
      if (chrome.runtime.lastError)
        return reject(new Error(chrome.runtime.lastError.message));
      if (!res.ok) return reject(new Error(res.error));
      resolve(res.result as Result);
    });
  });
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
      sender?: chrome.runtime.MessageSender,
    ) => Result | Promise<Result>,
  ) {
    this.handlers.set(key, handler as AnyHandler);

    type Next = Schema & Record<Key, (data: Data) => Result | Promise<Result>>;
    return new MessagingBuilder<Next>(this.schema as Next, this.handlers);
  }

  /* Start listening for messages. Returns the schema type for `typeof messaging` */
  init(): Schema {
    chrome.runtime.onMessage.addListener((msg, sender, respond) => {
      if (!isMessageRequest(msg)) return false;

      const handler = this.handlers.get(msg.messageId);

      if (!handler) {
        respond({ ok: false, error: `No handler for "${msg.messageId}"` });
        return false;
      }

      Promise.resolve()
        .then(() => handler(msg.data, sender))
        .then((result) => respond({ ok: true, result }))
        .catch((err: unknown) =>
          respond({
            ok: false,
            error: err instanceof Error ? err.message : String(err),
          }),
        );

      return true; 
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
        (req, cb) => chrome.runtime.sendMessage(req, cb),
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
        (req, cb) => chrome.tabs.sendMessage(tabId, req, cb),
        key,
        data,
      );
    },
  };
}
