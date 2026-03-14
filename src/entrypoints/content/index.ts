// content.js is non-module in manifest; bootstrap typed handlers via dynamic import
(async () => {
  try {
    const moduleUrl = chrome.runtime.getURL("modules/messaging.js");
    if (moduleUrl.startsWith("chrome-extension://invalid/")) {
      return;
    }
    await import(moduleUrl);
  } catch (error) {
    console.error("Failed to load content module", error);
  }
})();
