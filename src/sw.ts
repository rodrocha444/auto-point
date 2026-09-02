/// <reference lib="webworker" />

import { precacheAndRoute } from "workbox-precaching";
declare let self: ServiceWorkerGlobalScope;

self.skipWaiting();
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener("push", (event) => {
  let title = "Auto Point";
  let body = "";
  let data: Record<string, unknown> = { url: "/" };

  if (event.data) {
    try {
      const payload = event.data.json();
      if (payload.title !== undefined) title = payload.title;
      if (payload.body !== undefined) body = payload.body;
      if (payload.data !== undefined) data = payload.data;
    } catch {
      body = event.data.text();
    }
  }

  const notificationOptions = {
    body,
    icon: "/ap-192x192.png",
    badge: "/ap-192x192.png",
    data,
    tag: "work-hours-completed",
    renotify: true,
    vibrate: [200, 100, 200, 100, 200],
  };

  event.waitUntil(
    self.registration.showNotification(
      title,
      notificationOptions as unknown as NotificationOptions,
    ),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data?.url as string) || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      }),
  );
});
