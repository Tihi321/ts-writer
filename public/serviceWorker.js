// Service Worker for PWA functionality
const CACHE_NAME = "tswriter-v1";
const urlsToCache = ["/", "/static/js/bundle.js", "/static/css/main.css", "/manifest.json"];

self.addEventListener("install", (event: any) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)));
});

self.addEventListener("fetch", (event: any) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      return response || fetch(event.request);
    })
  );
});

// Handle PWA installation
self.addEventListener("beforeinstallprompt", (event: any) => {
  // Prevent the mini-infobar from appearing on mobile
  event.preventDefault();
  // Store the event so it can be triggered later
  (self as any).deferredPrompt = event;
});

export {};
