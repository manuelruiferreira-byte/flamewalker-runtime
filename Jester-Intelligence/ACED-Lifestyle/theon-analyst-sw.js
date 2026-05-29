const THEON_ANALYST_CACHE = "theon-analyst-cache-v0-1";
const THEON_ANALYST_CACHE_PREFIX = "theon-analyst-cache-";

const THEON_ANALYST_ASSETS = [
  "./theon-analyst.html",
  "./theon-analyst-manifest.json",
  "./shared/assets/logos/theon-analyst.png",
  "./shared/assets/logos/theon-analyst-192.png",
  "./shared/assets/logos/theon-analyst-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(THEON_ANALYST_CACHE).then(cache => cache.addAll(THEON_ANALYST_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key.startsWith(THEON_ANALYST_CACHE_PREFIX))
          .filter(key => key !== THEON_ANALYST_CACHE)
          .map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  const isTheonAsset = THEON_ANALYST_ASSETS.some(asset => {
    return url.pathname.endsWith(asset.replace("./", ""));
  });

  if (!isTheonAsset && event.request.mode !== "navigate") return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).catch(() => {
        if (event.request.mode === "navigate") {
          return caches.match("./theon-analyst.html");
        }
      });
    })
  );
});
