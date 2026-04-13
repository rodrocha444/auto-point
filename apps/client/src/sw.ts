/// <reference lib="webworker" />

import { precacheAndRoute } from "workbox-precaching";
declare let self: ServiceWorkerGlobalScope;
precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener("push", event => {
  console.log("[Service Worker] Notificação recebida do NestJS!");

  const title = "Nova Notificação";
  const options = {
    body: "Você tem uma nova mensagem.",
    vibrate: [200, 100, 200], // Faz o celular vibrar
  };
  event.waitUntil(self.registration.showNotification(title, options));
});
