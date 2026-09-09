const CACHE = "lokaal-b16-v5";

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll([
      "/",
      "/index.html",
      "/app.html",
      "/app.css",
      "/app.js",
      "/config.js",
      "/manifest.json",
      "/icon-192.png",
      "/icon-512.png",
    ]))
  );
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  if (e.request.url.includes("/socket.io/")) return;

  /* Alles wat niet van deze site zelf komt, laten we met rust. Dat is precies
     wat we nodig hebben als de pagina's op Cloudflare Pages staan en de API
     ergens anders: die API-verzoeken mogen nooit uit de cache komen. */
  let zelfde = false;
  try { zelfde = new URL(e.request.url).origin === location.origin; } catch (err) { /* rare URL, overslaan */ }
  if (!zelfde) return;

  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
