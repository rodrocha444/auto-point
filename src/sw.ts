/// <reference lib="webworker" />

import { precacheAndRoute } from "workbox-precaching";
declare let self: ServiceWorkerGlobalScope;
precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener("push", event => {
  console.log("[Service Worker] Notificação recebida!");

  let data = {} as { title?: string; body?: string };

  // Tenta extrair o JSON enviado pelo servidor
  if (event.data) {
    try {
      data = event.data.json(); // Faz o parse automático do JSON
    } catch (e) {
      console.error("Erro ao processar JSON da notificação", e);
      data = { title: "Nova Notificação", body: event.data.text() };
    }
  }

  const title = data?.title || "Lembrete de Ponto";
  const options = {
    body: data?.body || "Verifique o aplicativo.",
    vibrate: [200, 100, 200],
    data: {
      url: "/", // Você pode passar URLs para abrir ao clicar
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});
