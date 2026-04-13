// usePushSubscription.ts
import { useSavePushSubscriptionMutation } from "@/graphql/generated";
import { useState, useCallback } from "react";
// Importe a mutation gerada pelo seu codegen (exemplo genérico abaixo)

// Função auxiliar para converter a VAPID key base64 para Uint8Array (exigência do navegador)
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushSubscription() {
  // A mutation gerada pelo codegen
  const { mutateAsync: saveSubscriptionOnBackend } =
    useSavePushSubscriptionMutation();
  const [isSubscribing, setIsSubscribing] = useState(false);

  const subscribeToPush = useCallback(async () => {
    setIsSubscribing(true);
    try {
      // 1. Pede permissão (lembrando, tem que ser o 1º await após o clique)
      const permission = await window.Notification.requestPermission();
      if (permission !== "granted") {
        alert("Permissão negada.");
        return;
      }

      // 2. Garante que o Service Worker está pronto
      const registration = await navigator.serviceWorker.ready;

      // 3. Pega a VAPID Key do .env e converte
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

      // 4. Inscreve o navegador no serviço de Push da Apple/Google
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });

      // 5. Converte a assinatura para o formato que seu backend NestJS espera
      const subJson = subscription.toJSON();

      console.log("Subscription:", subJson);
      if (!subJson.endpoint || !subJson.keys)
        throw new Error("Falha ao gerar chaves");

      // 6. Dispara a Mutation do GraphQL Codegen
      await saveSubscriptionOnBackend({
        subscription: {
          endpoint: subJson.endpoint,
          keys: {
            p256dh: subJson.keys.p256dh,
            auth: subJson.keys.auth,
          },
        },
      });

      console.log("Inscrição salva com sucesso no NestJS!");
    } catch (error) {
      console.error("Erro no processo de inscrição:", error);
    } finally {
      setIsSubscribing(false);
    }
  }, [saveSubscriptionOnBackend]);

  return { subscribeToPush, isSubscribing };
}
