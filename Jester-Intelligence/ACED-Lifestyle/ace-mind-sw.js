/* ACE Mind Service Worker v25.8.1
   Direct-performance runtime.
   ace-mind.html now contains the v8 performance cache directly, so this worker
   no longer rewrites HTML. It only purges old ACE Mind caches and fetches the
   canonical runtime fresh from network.
*/

const ACE_MIND_SW_VERSION = "25.8.1-direct-performance-20260618";
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

  const criticalAsset =
    url.pathname.endsWith("/ace-mind.html") ||
    url.pathname.endsWith("/shared/js/flamewalker-canonical-profile-v3-3.js") ||
    url.pathname.includes("/shared/optimizer/") ||
    url.pathname.includes("/shared/data/supplements/") ||
    url.pathname.includes("/packages/engines/supplement/");

  if (criticalAsset) {
    event.respondWith(fetch(request, { cache: "no-store" }));
  }
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const targetUrl = "./ace-mind.html?v=2581-direct-performance-20260618";

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
      runtime: "./ace-mind.html",
      trace_store: "./shared/js/ace-mind-trace-store-v0-1.js",
      cache_mode: "direct-performance-network-no-store"
    });
  }
});
