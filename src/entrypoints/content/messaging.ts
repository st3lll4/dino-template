import { createMessaging } from "../../messaging";
import type { HandlerSignature } from "../../messaging/types";

const GET_SELECTED_TEXT = "get-selected-text" as const;

export type ContentMessaging = {
  [GET_SELECTED_TEXT]: HandlerSignature<void, string>;
};

createMessaging()
  .add(GET_SELECTED_TEXT, () => window.getSelection()?.toString() ?? "")
  .init();
