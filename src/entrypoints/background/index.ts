import { createMessaging, createSender } from "../../messaging";
import type { ContentMessaging } from "../content/messaging";

const { sendToTab } = createSender<ContentMessaging>();
export const messaging = createMessaging()
  .add("ping", (_: void) => ({ pong: true as const }))
  .add("get-active-tab-title", async (_: void) => {
    const tabId = await getActiveTabId();
    return sendToTab(tabId, "get-page-title", undefined);
  })
  .init();

export type BackgroundMessaging = typeof messaging;

function getActiveTabId(): Promise<number> {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (tab?.id != null) {
        resolve(tab.id);
      } else {
        reject(new Error("No active tab"));
      }
    });
  });
}

chrome.runtime.onInstalled.addListener(() => {
  console.log("Service worker loaded");
});
