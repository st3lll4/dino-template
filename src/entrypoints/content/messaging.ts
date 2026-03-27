import { createMessaging } from "../../messaging";
import type { HandlerSignature } from "../../messaging/types";

export type ContentMessaging = {
  "get-selected-text": HandlerSignature<void, string>;
};

createMessaging()
  .add("get-selected-text", () => window.getSelection()?.toString() ?? "")
  .init();
