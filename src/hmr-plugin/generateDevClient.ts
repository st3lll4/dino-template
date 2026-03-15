export function generateDevClient(wsPort: number): string {
  return `
(function() {
  const WS_PORT = ${wsPort};
  let ws;
  let reconnectTimer;

  function connect() {
    try {
      ws = new WebSocket('ws://localhost:' + WS_PORT);
    } catch(e) {
      scheduleReconnect();
      return;
    }

    ws.addEventListener('open', function() {
      console.debug('[hmr] background connected to dev server');
      clearTimeout(reconnectTimer);
      ws.send(JSON.stringify({ event: 'ext:ready' }));
    });

    ws.addEventListener('message', function(e) {
      let msg;
      try { msg = JSON.parse(e.data); } catch { return; }

      if (msg.event === 'background-updated' || msg.event === 'full-reload') {
        console.debug('[hmr] reloading extension');
        chrome.runtime.reload();
      }

      if (msg.event === 'content-updated') {
        console.debug('[hmr] re-injecting content script');
        reloadContentScript(msg.scriptId);
      }
    });

    ws.addEventListener('close', scheduleReconnect);
    ws.addEventListener('error', scheduleReconnect);
  }

  function scheduleReconnect() {
    clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(connect, 1000);
  }

  async function reloadContentScript(scriptId) {
    try {
      const existing = await chrome.scripting.getRegisteredContentScripts({ ids: [scriptId] });
      if (existing.length > 0) {
        await chrome.scripting.unregisterContentScripts({ ids: [scriptId] });
      }

      console.log("1111 GETS HERE")
      // issue: 
      // content script gets removed when it updates. no new ontent script gets injected. tab doesnt reload

      await chrome.scripting.registerContentScripts([{
        id: scriptId,
        js: ['content.js'],
        matches: ['<all_urls>'],
        runAt: 'document_idle',
      }]);

      console.log("22222 GETS HERE")
      
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        if (
          tab.id &&
          tab.url &&
          !tab.url.startsWith('chrome://') &&
          !tab.url.startsWith('about:')
        ) {
          chrome.tabs.reload(tab.id).catch(() => {});
        }
      }
    } catch(e) {
      console.error('[hmr] failed to reload content script', e);
      // ws.send(JSON.stringify({ event: 'ext:error', message: String(e) }));
    }
  }

  connect();
})();
`;
}
