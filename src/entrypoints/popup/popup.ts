import { createSender } from "../../messaging";
import type { BackgroundMessaging } from "../background";

const { send } = createSender<BackgroundMessaging>();
const result = () => document.getElementById("result") as HTMLParagraphElement;

document.addEventListener("DOMContentLoaded", () => {
  console.log("popup loaded");

  document
    .getElementById("sayhi")
    ?.addEventListener("click", () => console.log("hi!"));

  // popup → background only
  document.getElementById("ping")?.addEventListener("click", async () => {
    try {
      const res = await send("ping", undefined);
      result().textContent = `ping → ${JSON.stringify(res)}`;
      console.log("ping response:", res);
    } catch (e) {
      result().textContent = `ping error: ${e}`;
      console.error(e);
    }
  });

  // full round-trip: popup → bg → content → bg → popup
  document.getElementById("get-title")?.addEventListener("click", async () => {
    try {
      const title = await send("get-active-tab-title", undefined);
      result().textContent = `page title: "${title}"`;
      console.log("get-active-tab-title response:", title);
    } catch (e) {
      result().textContent = `error: ${e}`;
      console.error(e);
    }
  });
});
