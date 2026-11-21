// Service worker for the KBI Portal: caches the app shell so it opens offline. Scope is /portal/ only.
const CACHE = "portal-shell-v4";
const SHELL = ["./", "css/tokens.css", "css/base.css", "css/app.css", "js/theme-init.js", "favicon.svg", "assets/icons/logo.webp", "manifest.webmanifest", "assets/fonts/sora-latin-wght-normal.woff2", "assets/fonts/inter-latin-wght-normal.woff2"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => Promise.all(SHELL.map((u) => c.add(new Request(u, { cache: "reload" }))))).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((n) => n !== CACHE).map((n) => caches.delete(n)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const r = e.request; if (r.method !== "GET" || new URL(r.url).origin !== location.origin) return;
  if (r.mode === "navigate") { e.respondWith(fetch(r).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(r, copy)); return res; }).catch(() => caches.match(r).then((m) => m || caches.match("./")))); return; }
  // Network first so a new release shows at once; the cache only covers offline use.
  e.respondWith(fetch(r).then((res) => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(r, copy)); } return res; }).catch(() => caches.match(r)));
});
