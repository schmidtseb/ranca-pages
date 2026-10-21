const CACHE = "ranca-v2";
const PRECACHE_URLS = [
  ".",
  "manifest.json",
  "favicon.png",
  "icons/icon-180x180.png",
  "icons/icon-192x192.png",
  "icons/icon-512x512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE_URLS)),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ),
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const isAsset = url.pathname.match(/\.(png|ico)$/);
  const isHtml =
    url.pathname === url.pathname.replace(/\/[^/]*$/, "/") ||
    url.pathname.endsWith(".html");

  if (isAsset) {
    // Cache-first, but a miss must also POPULATE the cache — otherwise
    // every asset (card art, icons) is fetched through on every load and
    // never actually available offline after the first visit.
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          return res;
        });
      }),
    );
  } else if (isHtml) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          return res;
        })
        .catch(() => caches.match(event.request)),
    );
  }
});
