import { createSender } from "../../messaging";
import type { BackgroundMessaging } from "../background";
import { createLogger } from "../../logger";

const log = createLogger("popup");

const sender = createSender<BackgroundMessaging>();
const result = () => document.getElementById("result") as HTMLParagraphElement;

document.addEventListener("DOMContentLoaded", () => {
  // popup - background
  document.getElementById("ping")?.addEventListener("click", async () => {
    try {
      const res = await sender.send("ping", undefined);
      result().textContent = `Ping OK\n${JSON.stringify(res, null, 2)}`;
    } catch (e) {
      result().textContent = `ping error: ${e}`;
      log.error("error", e);
    }
  });

  // full round-trip: popup - bg - content - bg - popup
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
        log.error("error", e);
      }
    });

  // popup - bg - external api
  document.getElementById("get-duck")?.addEventListener("click", async () => {
    try {
      const duck = await sender.send("get-duck", undefined);
      const img = document.getElementById("duck-img") as HTMLImageElement;
      img.src = duck.url;
      img.style.display = "block";
      result().textContent = duck.message ?? "🦆";
    } catch (e) {
      result().textContent = `error: ${e}`;
    }
  });

  // popup - bg - post test
  document.getElementById("test-post")?.addEventListener("click", async () => {
    try {
      const res = await sender.send("test-post", undefined);
      result().textContent = `POST ok\njson: ${JSON.stringify(res.json, null, 2)}\nheaders: ${JSON.stringify(res.headers, null, 2)}`;
    } catch (e) {
      result().textContent = `error: ${e}`;
    }
  });
});
