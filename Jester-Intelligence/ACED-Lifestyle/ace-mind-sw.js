/* ACE Mind Service Worker v25.0
   Canonical live file: ace-mind.html
   Scope: same folder as ace-mind.html
   Purpose: PWA install support, offline fallback, notification click routing.
*/

const ACE_MIND_SW_VERSION = "25.0-canonical-ace-mind";
const CACHE_NAME = "ace-mind-cache-v25-0-canonical";

const APP_SHELL = [
  "./ace-mind.html",
  "./manifest.json",
  "./shared/assets/logos/ace-mind.png",
  "./shared/assets/logos/aced.png",
  "../shared/assets/logos/jester-intelligence.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      for (const url of APP_SHELL) {
        try {
          const request = new Request(url, { cache: "reload" });
          const response = await fetch(request);

          if (response && response.ok) {
            await cache.put(url, response);
          }
        } catch (error) {
          // Optional assets may fail depending on GitHub folder structure.
          // Do not fail install because one logo path is missing.
        }
      }

      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();

      await Promise.all(
        cacheNames
          .filter(name => name.startsWith("ace-mind-cache-") && name !== CACHE_NAME)
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

  // Navigation requests: network first, cache fallback.
  // This helps GitHub Pages show the newest ace-mind.html after you replace it.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          const cache = await caches.open(CACHE_NAME);
          await cache.put("./ace-mind.html", fresh.clone());
          return fresh;
        } catch (error) {
          const cached = await caches.match("./ace-mind.html");
          if (cached) return cached;
          return new Response("ACE Mind is offline and no cached shell is available.", {
            status: 503,
            headers: { "Content-Type": "text/plain" }
          });
        }
      })()
    );
    return;
  }

  // For same-origin assets: stale cache fallback.
  if (url.origin === self.location.origin) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;

        try {
          const fresh = await fetch(request);
          if (fresh && fresh.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, fresh.clone());
          }
          return fresh;
        } catch (error) {
          return cached || Response.error();
        }
      })()
    );
  }
});

self.addEventListener("notificationclick", event => {
  event.notification.close();

  const data = event.notification.data || {};
  const targetUrl = data.url || "./ace-mind.html";

  event.waitUntil(
    (async () => {
      const allClients = await clients.matchAll({
        type: "window",
        includeUncontrolled: true
      });

      for (const client of allClients) {
        try {
          const clientUrl = new URL(client.url);
          const target = new URL(targetUrl, self.location.href);

          if (
            clientUrl.origin === target.origin &&
            clientUrl.pathname.endsWith("/ace-mind.html")
          ) {
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
  // Reserved for future Scholar / Attention Garden calibration.
  // No network call. No tracking.
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
      cache: CACHE_NAME,
      canonical: "./ace-mind.html"
    });
  }
});
