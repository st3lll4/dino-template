import { createMessaging } from "../../messaging";
import type { HandlerSignature } from "../../messaging/types";

export type ContentMessaging = {
  "get-page-title": HandlerSignature<void, string>;
};

console.log("[content] messaging handlers registering");

createMessaging()
  .add("get-page-title", (_: void) => document.title)
  .init();

console.log("[content] messaging ready");
