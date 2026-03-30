const log = {
  debug: (...args: unknown[]) => console.debug("[content]", ...args),
  info: (...args: unknown[]) => console.info("[content]", ...args),
  error: (...args: unknown[]) => console.error("[content]", ...args),
};

(async () => {
  // @ts-ignore
  const _browser = typeof browser !== "undefined" ? browser : chrome;
  try {
    await import(_browser.runtime.getURL("modules/messaging.js"));
    log.info("messaging module loaded");
  } catch (error) {
    log.error("failed to load messaging module", error);
  }
})();
