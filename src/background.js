// background.ts
// This is the service worker for the extension.

chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
});