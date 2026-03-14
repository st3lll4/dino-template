import { createMessaging, createSender } from "../../messaging";
import type { ContentMessaging } from "../content/messaging";

const { sendToTab } = createSender<ContentMessaging>();
export const messaging = createMessaging()
  .add("ping", (_: void) => ({
    pong: true as const,
    source: "background" as const,
    at: new Date().toISOString(),
  }))
  .add("get-active-tab-title", async (_: void) => getActiveTabTitle())
  .init();

export type BackgroundMessaging = typeof messaging;

function getActiveTab(): Promise<chrome.tabs.Tab> {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (tab) {
        resolve(tab);
      } else {
        reject(new Error("No active tab"));
      }
    });
  });
}

async function getActiveTabTitle(): Promise<string> {
  const tab = await getActiveTab();

  if (tab.id == null) {
    throw new Error("No active tab id");
  }

  return sendToTab(tab.id, "get-page-title", undefined);
}
