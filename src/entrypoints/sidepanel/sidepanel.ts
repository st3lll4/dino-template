import { createSender } from "../../messaging";
import type { BackgroundMessaging } from "../background";

const { send } = createSender<BackgroundMessaging>();

document.addEventListener("DOMContentLoaded", async () => {
  const title = await send("get-active-tab-title", undefined);
  document.getElementById("tab-title")!.textContent = title;
});