const CACHE = "drerries-v1";

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll([
      "/",
      "/index.html",
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
  if (e.request.url.includes("onrender.com/")) return;

  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
