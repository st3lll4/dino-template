import { createMessaging } from "../../messaging";

export const messaging = createMessaging()
  .add("ping", (_: void) => ({ pong: true as const }))
  .add("get-tab-info", ({ tabId }: { tabId: number }) =>
    new Promise<{ url: string; title: string }>((resolve) =>
      chrome.tabs.get(tabId, (tab) =>
        resolve({ url: tab.url ?? "", title: tab.title ?? "" }),
      ),
    ),
  )
  .init();

export type BackgroundMessaging = typeof messaging;

chrome.runtime.onInstalled.addListener(() => { console.log("Service worker loaded"); });
