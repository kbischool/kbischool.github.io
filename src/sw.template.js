/* KBI Schools service worker. Generated at build time; do not edit the copy in dist/. */
'use strict';
const VERSION = '__VERSION__';
const BASE = '__BASE__';
const PRECACHE = 'kbi-precache-' + VERSION;
const RUNTIME = 'kbi-runtime-v1';
const URLS = __PRECACHE__;
const OFFLINE = BASE + 'offline.html';

self.addEventListener('install', (event) => {
  /* No skipWaiting here: the page shows an "update ready" toast and asks first. */
  event.waitUntil(
    caches.open(PRECACHE).then((cache) =>
      Promise.all(URLS.map((url) => cache.add(new Request(url, { cache: 'reload' }))))
    )
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('kbi-') && k !== PRECACHE && k !== RUNTIME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function fromCache(request) {
  return caches.match(request, { ignoreSearch: true });
}

function networkFirst(request) {
  return new Promise((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      fromCache(request).then((hit) => { if (hit && !settled) { settled = true; resolve(hit); } });
    }, 4000);
    fetch(request).then((res) => {
      clearTimeout(timer);
      if (res.ok) { const copy = res.clone(); caches.open(RUNTIME).then((c) => c.put(request, copy)); }
      if (!settled) { settled = true; resolve(res); }
    }).catch(() => {
      clearTimeout(timer);
      fromCache(request).then((hit) => hit || caches.match(OFFLINE)).then((res) => { if (!settled) { settled = true; resolve(res || Response.error()); } });
    });
  });
}

function cacheFirst(request) {
  return fromCache(request).then((hit) => hit || fetch(request).then((res) => {
    if (res.ok) { const copy = res.clone(); caches.open(RUNTIME).then((c) => c.put(request, copy)); }
    return res;
  }));
}

function staleWhileRevalidate(request) {
  return fromCache(request).then((hit) => {
    const fresh = fetch(request).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(RUNTIME).then((c) => c.put(request, copy)); }
      return res;
    }).catch(() => hit);
    return hit || fresh;
  });
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') { event.respondWith(networkFirst(request)); return; }
  if (['style', 'script', 'font', 'image', 'manifest'].includes(request.destination)) { event.respondWith(cacheFirst(request)); return; }
  event.respondWith(staleWhileRevalidate(request));
});
