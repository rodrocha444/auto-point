/// <reference lib="webworker" />

import { precacheAndRoute } from "workbox-precaching";
declare let self: ServiceWorkerGlobalScope;
precacheAndRoute(self.__WB_MANIFEST);

// Escutar notificações push
self.addEventListener("push", event => {
  const data = event.data?.json() ?? {};

  event.waitUntil(
    self.registration.showNotification(data.title || "Nova Notificação", {
      body: data.body || "Você tem uma nova atualização.",
    }),
  );
});
