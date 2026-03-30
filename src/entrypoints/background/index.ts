import browser from "webextension-polyfill";
import { createMessaging, createSender } from "../../messaging";
import type { ContentMessaging } from "../content/messaging";
import { api } from "../../api/endpoints";
import { createLogger } from "../../logger";

const log = createLogger("background");

export const messaging = createMessaging()
  .add("ping", () => ping())
  .add("get-active-tab-selection", async () => getActiveTabSelection())
  .add("get-duck", async () => getDuck())
  .add("test-post", async () => testPost())
  .init();

export type BackgroundMessaging = typeof messaging;

const contentSender = createSender<ContentMessaging>();

async function getActiveTab(): Promise<browser.Tabs.Tab> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab) {
    throw new Error("No active tab");
  }
  return tab;
}

function ping() {
  log.info("ping received");
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
  return contentSender.sendToTab(tab.id, "get-selected-text", undefined);
}

async function getDuck() {
  return api.getRandomImage();
}

async function testPost() {
  return api.testPost({ body: { hello: "from extension", timestamp: Date.now() }, headers: { "header": "test-header" } });
}
