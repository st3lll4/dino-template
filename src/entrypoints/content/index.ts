(async () => {
  const _browser = typeof browser !== "undefined" ? browser : chrome;
  try {
    await import(_browser.runtime.getURL("modules/messaging.js"));
  } catch (error) {
    console.error("Failed to load content messaging module", error);
  }
})();
