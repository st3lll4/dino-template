import { createMessaging } from "../../messaging";

export const messaging = createMessaging()
  .add("get-page-title", (_: void) => document.title)
  .init();

export type ContentMessaging = typeof messaging;
