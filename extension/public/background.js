// AutoApply — Service Worker (background.js)

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[AutoApply] Extension installed — version', chrome.runtime.getManifest().version);
  } else if (details.reason === 'update') {
    console.log('[AutoApply] Extension updated to version', chrome.runtime.getManifest().version);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PING') {
    sendResponse({ status: 'ok', version: chrome.runtime.getManifest().version });
    return true;
  }
});
