import { initMessaging, sendMessage } from "../../messaging"

const result = await sendMessage("ping", undefined);
// result is: { pong: true }

const info = await sendMessage("get-tab-info", { tabId: 42 });
// info is: { url: string; title: string }
initMessaging()
