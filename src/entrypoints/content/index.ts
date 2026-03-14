// content script runs as classic script; load messaging module dynamically
(async () => {
  try {
    await import(chrome.runtime.getURL("modules/messaging.js"));
  } catch (error) {
    console.error("Failed to load content messaging module", error);
  }
})();
