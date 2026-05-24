/* ACE Mind Service Worker v25.0.5
   Safe cache purge version.
   Canonical app file: ./ace-mind.html
   Purpose: stop old boot/cache ghosts and route notifications to ACE Mind.
*/

const ACE_MIND_SW_VERSION = "25.0.5-system-splash-only";
const CACHE_PREFIX = "ace-mind-cache-";

self.addEventListener("install", event => {
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();

      await Promise.all(
        names
          .filter(name => name.startsWith(CACHE_PREFIX))
          .map(name => caches.delete(name))
      );

      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", event => {
  // Network-only service worker.
  // This prevents old cached boot versions from being served.
  return;
});

self.addEventListener("notificationclick", event => {
  event.notification.close();

  const targetUrl = "./ace-mind.html";

  event.waitUntil(
    (async () => {
      const allClients = await clients.matchAll({
        type: "window",
        includeUncontrolled: true
      });

      for (const client of allClients) {
        try {
          if (client.url.includes("ace-mind.html")) {
            await client.focus();
            return;
          }
        } catch (error) {}
      }

      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })()
  );
});

self.addEventListener("notificationclose", event => {
  // Reserved for future ACE Halo / Attention Garden.
  // No tracking. No network call.
});

self.addEventListener("message", event => {
  const data = event.data || {};

  if (data.type === "ACE_MIND_SKIP_WAITING") {
    self.skipWaiting();
  }

  if (data.type === "ACE_MIND_VERSION_REQUEST") {
    event.source?.postMessage({
      type: "ACE_MIND_SW_VERSION",
      version: ACE_MIND_SW_VERSION,
      canonical: "./ace-mind.html",
      cache_mode: "network-only-cache-purge"
    });
  }
});
