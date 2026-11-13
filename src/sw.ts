/// <reference lib="webworker" />

import { precacheAndRoute } from "workbox-precaching";
declare let self: ServiceWorkerGlobalScope;

self.skipWaiting();
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

precacheAndRoute(self.__WB_MANIFEST);
