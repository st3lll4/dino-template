import { createMessaging } from "../../messaging";
import type { HandlerSignature } from "../../messaging/types";

const GET_TITLE = "get-page-title" as const;

export type ContentMessaging = {
  [GET_TITLE]: HandlerSignature<void, string>;
};

createMessaging()
  .add(GET_TITLE, () => document.title)
  .init();