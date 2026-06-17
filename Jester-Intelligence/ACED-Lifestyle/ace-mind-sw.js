/* ACE Mind Service Worker v25.0.7
   Live-authority cache seal.
   Canonical launch file: ./ace-mind-trace.html
   Runtime app file remains: ./ace-mind.html
   Critical optimizer modules always bypass the HTTP cache.
*/

const ACE_MIND_SW_VERSION = "25.0.7-live-authority-v2";
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
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const criticalOptimizerAsset =
    url.pathname.includes("/shared/optimizer/") ||
    url.pathname.includes("/packages/engines/supplement/") ||
    url.pathname.endsWith("/supplement-registry.v1.json");

  if (criticalOptimizerAsset) {
    event.respondWith(fetch(request, { cache: "no-store" }));
  }
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const targetUrl = "./ace-mind-trace.html?v=2538-live-authority-v2-20260617";

  event.waitUntil(
    (async () => {
      const allClients = await clients.matchAll({
        type: "window",
        includeUncontrolled: true
      });

      for (const client of allClients) {
        try {
          if (client.url.includes("ace-mind-trace.html") || client.url.includes("ace-mind.html")) {
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
      canonical: "./ace-mind-trace.html",
      runtime: "./ace-mind.html",
      trace_store: "./shared/js/ace-mind-trace-store-v0-1.js",
      cache_mode: "optimizer-network-no-store"
    });
  }
});
