# messaging

Typed, bidirectional message passing between extension contexts (background, popup, content scripts, sidepanel). Works on Chrome MV3 and Firefox MV2/MV3.

---

## Quick usage

**1. Declare your messages** (in `background/index.ts`):

```typescript
import type { ProtocolWithReturn } from "../messaging";

declare module "../messaging" {
  interface MessageSchema {
    ping: ProtocolWithReturn<void, { pong: true }>;
    "get-tab-info": ProtocolWithReturn<
      { tabId: number },
      { url: string; title: string }
    >;
  }
}
```

**2. Register handlers** (still in `background/index.ts`):

```typescript
import { onMessage, initMessaging } from "../messaging";

onMessage("ping", () => ({ pong: true }));

onMessage("get-tab-info", async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId);
  return { url: tab.url ?? "", title: tab.title ?? "" };
});

initMessaging();
```

**3. Call from popup or content**:

```typescript
import { sendMessage } from "../messaging";

const result = await sendMessage("ping", undefined);
// result is: { pong: true }

const info = await sendMessage("get-tab-info", { tabId: 42 });
// info is: { url: string; title: string }
```

**4. Send from background to a content script**:

```typescript
import { sendToTab } from "../messaging";

await sendToTab(tabId, "ping", undefined);
```

**5. Call `initMessaging()` in content scripts too** if they need to receive `sendToTab` messages.

---

## API reference

### `onMessage(messageId, handler)`

Registers a handler for an incoming message. Call this before `initMessaging()`.

- `messageId` — any key declared in `MessageSchema`
- `handler(data, sender)` — receives the typed payload and the Chrome sender object
- Return value is sent back as the response (can be async)
- If the handler throws, the caller's Promise is rejected

### `sendMessage(messageId, data)`

Sends a message from any context to the background.

Returns a `Promise` that resolves to the handler's return value, or rejects if the handler threw.

### `sendToTab(tabId, messageId, data)`

Sends a message from the background script to a specific tab's content script.

The content script must have called `initMessaging()` for this to work.

### `initMessaging()`

Wires up `chrome.runtime.onMessage`. Call once per context that needs to receive messages (background, content scripts). No-op if called again.

---

## Design decisions

### Module augmentation instead of a passed generic

The schema is a single `interface MessageSchema {}` that anyone can extend:

```typescript
declare module "../messaging" {
  interface MessageSchema {
    "my-message": ProtocolWithReturn<RequestType, ResponseType>;
  }
}
```

This means:

- Every declaration merges into one global schema at compile time
- You never annotate individual `sendMessage` calls — the types flow from the schema automatically
- If you add a message in one file, every other file that imports `sendMessage` immediately knows about it
- No central registry file that needs updating; declarations live next to the handlers that use them

The alternative — a generic like `sendMessage<MyMsg>(...)` — would require you to annotate every call site, and TypeScript would not enforce that the type you wrote actually matches anything.

### `ProtocolWithReturn<Data, Return>`

A message can be one of two things:

1. Fire-and-forget — the caller does not care about a response
2. Request/response — the caller expects a typed return value

`ProtocolWithReturn<Data, Return>` is just a type container that bundles both sides of a request/response pair. It has no runtime presence — it only exists in the type system.

```typescript
export type ProtocolWithReturn<Data, Return> = {
  __data: Data;
  __return: Return;
};
```

The `__data` and `__return` fields are never written to at runtime. They are phantom fields used only by `DataOf<T>` and `ReturnOf<T>` to extract the relevant type:

```typescript
export type DataOf<T> =
  T extends ProtocolWithReturn<infer Data, unknown> ? Data : T;

export type ReturnOf<T> =
  T extends ProtocolWithReturn<unknown, infer Return> ? Return : void;
```

If `T` is a `ProtocolWithReturn`, TypeScript uses the `infer` keyword to extract the type from the matching position. If it is not (fire-and-forget), `DataOf` falls through to `T` and `ReturnOf` falls through to `void`.

### `Key extends MessageId` — why not just `MessageId`

Every function that accepts or returns a message uses a generic `Key extends MessageId`:

```typescript
function sendMessage<Key extends MessageId>(
  messageId: Key,
  data: DataOf<MessageSchema[Key]>,
): Promise<ReturnOf<MessageSchema[Key]>>;
```

If we wrote `MessageId` directly instead of `Key extends MessageId`, TypeScript would evaluate `MessageSchema[MessageId]` as the union of every message type in the schema. The return type would then be `ReturnOf<union of everything>` — also a union of every return type — making every call site produce a broad, useless type.

With `Key extends MessageId`, TypeScript infers the exact string literal you passed (e.g. `"ping"`) and looks up only `MessageSchema["ping"]`. The return type narrows to exactly `{ pong: true }`.

### The `RequestEnvelope` and `__bridge` marker

`chrome.runtime.onMessage` receives every message sent within the extension, including messages from other libraries or the extension's own internal Chrome events. To avoid accidentally handling something we did not send, every message we send is wrapped in a `RequestEnvelope`:

```typescript
export type RequestEnvelope<Key extends MessageId> = {
  __bridge: true;
  messageId: Key;
  data: DataOf<MessageSchema[Key]>;
};
```

The `__bridge: true` marker is checked by `isRequestEnvelope()` before we do anything with the message:

```typescript
function isRequestEnvelope(msg: unknown): msg is RequestEnvelope<MessageId> {
  return (
    typeof msg === "object" &&
    msg !== null &&
    (msg as Record<string, unknown>).__bridge === true
  );
}
```

This is a type guard. If the check passes, TypeScript narrows the type of `msg` from `unknown` to `RequestEnvelope<MessageId>`, so we can safely access `.messageId` and `.data`.

### `ResponseEnvelope` — explicit ok/error instead of throwing

When a handler runs and the response comes back, it arrives as a plain `unknown` value. There is no way to receive a thrown exception across the Chrome messaging boundary — it would just become `undefined`.

Instead, every response is wrapped in a `ResponseEnvelope`:

```typescript
export type ResponseEnvelope =
  | { ok: true; result: unknown }
  | { ok: false; error: string };
```

The dispatcher catches handler errors and sends `{ ok: false, error: "..." }`. The caller checks `response.ok` and rejects the Promise if it is false. This way errors propagate correctly across the boundary and the caller can `.catch()` them like a normal rejected Promise.

### Why `initMessaging()` is explicit

`chrome.runtime.onMessage.addListener(...)` should not run automatically when the module is imported. Side effects at import time break tests (the Chrome API is not available in a test environment), make it harder to reason about when listeners are registered, and prevent you from calling `onMessage()` to register handlers before the listener is active.

By requiring an explicit `initMessaging()` call, the order is clear:

```typescript
onMessage("ping", handler); // register first
initMessaging(); // then start listening
```

### Callback form instead of Chrome's Promise API

Chrome MV3 added Promise-returning versions of `chrome.runtime.sendMessage` and `chrome.tabs.sendMessage`. Firefox's `chrome.*` compatibility layer (used instead of `browser.*`) is callback-only — it does not return Promises from those functions.

To work on both browsers without a polyfill, `sendMessage` and `sendToTab` use the callback form and wrap it in a `new Promise(...)` manually:

```typescript
chrome.runtime.sendMessage(envelope, (response: ResponseEnvelope) => {
  if (chrome.runtime.lastError) { reject(...); return }
  if (!response.ok) { reject(...); return }
  resolve(response.result as ReturnOf<MessageSchema[Key]>)
})
```

`chrome.runtime.lastError` must be read inside the callback to prevent Chrome from logging an unchecked error warning.

### `return true` in `onMessage` listener

Chrome's messaging protocol closes the response channel as soon as the `onMessage` listener returns. If a handler is async, the listener returns before the handler has resolved, and Chrome closes the channel before `sendResponse` is called.

Returning `true` from the listener tells Chrome to keep the channel open. The listener always returns `true` because we don't know at registration time whether the handler will be async or not.

### Errors reject the caller's Promise, not resolve with undefined

`ReturnOf<T>` produces the handler's exact return type — `{ pong: true }`, `{ url: string }`, etc. If errors were signalled by resolving with `undefined`, the return type would need to include `undefined` in every case, which pollutes every call site with nullable handling even on the happy path.

By rejecting the Promise on error, the happy path type stays clean. Error handling is opt-in via `.catch()` or `try/catch`.

---

## What `MessageSender` gives you

Every handler receives `sender: MessageSender` as its second argument. Useful fields:

| Field             | What it contains                                                                         |
| ----------------- | ---------------------------------------------------------------------------------------- |
| `sender.tab`      | The `chrome.tabs.Tab` object of the sending tab (only set if sent from a content script) |
| `sender.tab?.id`  | Tab ID — use with `sendToTab` to reply back                                              |
| `sender.tab?.url` | URL of the page the content script is running on                                         |
| `sender.id`       | Extension ID of the sender                                                               |
| `sender.frameId`  | Frame ID (0 = top-level frame)                                                           |

---

## File layout

```
src/messaging/
  index.ts   — public API: sendMessage, onMessage, initMessaging, sendToTab
  types.ts   — all shared types (ProtocolWithReturn, MessageSchema, envelopes, etc.)
  README.md  — this file
```

Everything exported from `index.ts` is the public surface. `types.ts` is internal — import from `"../messaging"`, not directly from `"../messaging/types"`.
