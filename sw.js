const CACHE = "meridiano-v3";
const CORE = [
  "./",
  "./index.html",
  "./css/tokens.css",
  "./css/app.css",
  "./js/vendor/chart.umd.min.js",
  "./js/vendor/jspdf.umd.min.js",
  "./js/catalog.js",
  "./js/data.js",
  "./js/indicators.js",
  "./js/predict.js",
  "./js/portfolio.js",
  "./js/optimizer.js",
  "./js/charts.js",
  "./js/ui.js",
  "./js/app.js",
  "./manifest.webmanifest"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET") return;
  if (url.hostname.includes("finance.yahoo.com")) return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((res) => {
          if (res && (res.status === 200 || res.type === "opaque")) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
