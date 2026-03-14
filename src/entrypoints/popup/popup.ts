import { createSender } from "../../messaging";
import type { BackgroundMessaging } from "../background";

const { send } = createSender<BackgroundMessaging>();
const result = () => document.getElementById("result") as HTMLParagraphElement;

document.addEventListener("DOMContentLoaded", () => {
  // popup - background
  document.getElementById("ping")?.addEventListener("click", async () => {
    try {
      await send("ping", undefined);
    } catch (e) {
      result().textContent = `ping error: ${e}`;
      console.log("error", e);
    }
  });

  // full round-trip: popup - bg - content - bg - popup
  document.getElementById("get-title")?.addEventListener("click", async () => {
    try {
      const title = await send("get-active-tab-title", undefined);
      result().textContent = `page title: "${title}"`;
    } catch (e) {
      result().textContent = `error: ${e}`;
      console.log("error", e);
    }
  });
});
