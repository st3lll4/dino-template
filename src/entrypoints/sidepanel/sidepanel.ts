import { createSender } from "../../messaging";
import type { BackgroundMessaging } from "../background";

const sender = createSender<BackgroundMessaging>();
const result = () => document.getElementById("result") as HTMLParagraphElement;

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("ping")?.addEventListener("click", async () => {
    try {
      const res = await sender.send("ping", undefined);
      result().textContent = `Ping OK\n${JSON.stringify(res, null, 2)}`;
    } catch (e) {
      result().textContent = `ping error: ${e}`;
      console.log("error", e);
    }
  });

  document
    .getElementById("get-selection")
    ?.addEventListener("click", async () => {
      try {
        const text = await sender.send("get-active-tab-selection", undefined);
        result().textContent = text
          ? `Selected text\n"${text}"`
          : "Selected text\n(none)";
      } catch (e) {
        result().textContent = `error: ${e}`;
        console.log("error", e);
      }
    });
});
