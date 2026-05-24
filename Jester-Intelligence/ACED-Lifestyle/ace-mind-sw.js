/* ACE Mind Service Worker v24.9
   Scope: notification click/focus support + future local scheduling experiments. */
const ACE_MIND_SW_VERSION = '24.9-pwa-nudge-lab';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const data = event.notification.data || {};
  const targetUrl = data.url || './ace-mind-v24-9-pwa-nudge-lab.html';

  event.waitUntil((async () => {
    const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });

    for (const client of allClients) {
      if ('focus' in client) {
        try {
          await client.focus();
          return;
        } catch (e) {}
      }
    }

    if (clients.openWindow) {
      return clients.openWindow(targetUrl);
    }
  })());
});

self.addEventListener('notificationclose', event => {
  // Reserved for future Scholar calibration. No network call, no tracking.
});
