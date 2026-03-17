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
        console.debug('[hmr] background updated, reloading tabs then extension');
        reloadTabsThenExtension();
      }

      if (msg.event === 'content-updated') {
        console.debug('[hmr] reloading tabs for content script update');
        reloadTabs();
      }
    });

    ws.addEventListener('close', scheduleReconnect);
    ws.addEventListener('error', scheduleReconnect);
  }

  async function reloadTabsThenExtension() {
    try {
      await reloadTabs();
    } catch {
      // ignore and continue to extension reload
    }

    setTimeout(function() {
      chrome.runtime.reload();
    }, 150);
  }

  function scheduleReconnect() {
    clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(connect, 1000);
  }

  async function reloadTabs() {
    try {
      let tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      if (tabs.length === 0) {
        tabs = await chrome.tabs.query({ active: true });
      }

      const reloadJobs = [];

      for (const tab of tabs) {
        if (!tab.id) continue;
        if (tab.url && (tab.url.startsWith('chrome:') || tab.url.startsWith('about:'))) continue;
        reloadJobs.push(chrome.tabs.reload(tab.id, { bypassCache: true }));
      }

      await Promise.allSettled(reloadJobs);

      if (reloadJobs.length > 0) {
        console.debug('[hmr] requested active-tab refresh for ' + reloadJobs.length + ' tab(s)');
      }
    } catch(e) {
      console.error('[hmr] failed to reload tabs after content update', e);
      if (ws && ws.readyState === 1) {
        ws.send(JSON.stringify({ event: 'ext:error', message: String(e) }));
      }
    }
  }

  connect();
})();
`;
}
