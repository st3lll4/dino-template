import browser from "webextension-polyfill";
import { createMessaging, createSender } from "../../messaging";
import type { ContentMessaging } from "../content/messaging";

const { sendToTab } = createSender<ContentMessaging>();
export const messaging = createMessaging()
  .add("ping", () => ping())
  .add("get-active-tab-selection", async () => getActiveTabSelection())
  .init();

export type BackgroundMessaging = typeof messaging;

async function getActiveTab(): Promise<browser.Tabs.Tab> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab) {
    throw new Error("No active tab");
  }
  return tab;
}

function ping() {
  return {
    pong: true as const,
    source: "background" as const,
    at: new Date().toISOString(),
  };
}

async function getActiveTabSelection(): Promise<string> {
  const tab = await getActiveTab();
  if (tab.id == null) {
    throw new Error("No active tab id");
  }
  return sendToTab(tab.id, "get-selected-text", undefined);
}
