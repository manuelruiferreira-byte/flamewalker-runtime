const THEON_ANALYST_CACHE = "theon-analyst-cache-v0-9-5";
const THEON_ANALYST_CACHE_PREFIX = "theon-analyst-cache-";

const THEON_ANALYST_ASSETS = [
  "./theon-analyst.html",
  "./theon-analyst-manifest.json",
  "./shared/assets/logos/theon-analyst.png",
  "./shared/assets/logos/theon-analyst-192.png",
  "./shared/assets/logos/theon-analyst-512.png"
];

self.addEventListener("install", event => {
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys
        .filter(key => key.startsWith(THEON_ANALYST_CACHE_PREFIX))
        .filter(key => key !== THEON_ANALYST_CACHE)
        .map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  const isTheonAsset = THEON_ANALYST_ASSETS.some(asset => url.pathname.endsWith(asset.replace("./", "")));
  const isHtml = event.request.mode === "navigate" || url.pathname.endsWith("/theon-analyst.html");

  if (!isTheonAsset && !isHtml) return;

  event.respondWith(
    fetch(event.request, { cache: "no-store" }).then(response => {
      const copy = response.clone();
      caches.open(THEON_ANALYST_CACHE).then(cache => cache.put(event.request, copy)).catch(() => {});
      return response;
    }).catch(() => caches.match(event.request).then(cached => cached || caches.match("./theon-analyst.html")))
  );
});
