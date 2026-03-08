import { initMessaging, onMessage } from "../../messaging"
import type { ProtocolWithReturn } from "../../messaging"

// Add your message types here and they will be available to sendMessage() across all layers
declare module "../../messaging" {
  interface MessageSchema {
    ping: ProtocolWithReturn<void, { pong: true }>
    "get-tab-info": ProtocolWithReturn<{ tabId: number }, { url: string; title: string }>
  }
}

onMessage("ping", () => ({ pong: true }))

onMessage("get-tab-info", ({ tabId }) =>
  new Promise((resolve) =>
    chrome.tabs.get(tabId, (tab) =>
      resolve({ url: tab.url ?? "", title: tab.title ?? "" }),
    ),
  ),
)

initMessaging()