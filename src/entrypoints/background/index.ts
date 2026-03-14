import { createMessaging, createSender } from "../../messaging";
import type { ContentMessaging } from "../content/messaging";

const { sendToTab } = createSender<ContentMessaging>();
export const messaging = createMessaging()
  .add("ping", () => ping())
  .add("get-active-tab-title", async () => getActiveTabTitle())
  .init();

export type BackgroundMessaging = typeof messaging;

function ping() {
  return {
    pong: true as const,
    source: "background" as const,
    at: new Date().toISOString(),
  };
}

async function getActiveTab(): Promise<chrome.tabs.Tab> {
  const [ tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) {
    throw new Error("No active tab");
  }
  return tab;
}

async function getActiveTabTitle(): Promise<string> {
  const tab = await getActiveTab();
  if (tab.id == null) {
    throw new Error("No active tab id");
  }
  return sendToTab(tab.id, "get-page-title", undefined);
}
