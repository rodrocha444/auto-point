import { useState, useCallback } from "react";

export function usePushSubscription() {
  const [isSubscribing, setIsSubscribing] = useState(false);

  const subscribeToPush = useCallback(async () => {
    setIsSubscribing(true);
    try {
      if (!("Notification" in window)) {
        alert("Este navegador não suporta notificações.");
        return;
      }

      const permission = await window.Notification.requestPermission();
      if (permission === "granted") {
        new Notification("Auto Point", {
          body: "Notificações ativadas com sucesso!",
          icon: "/ap-192x192.png",
        });
      } else {
        alert("Permissão para notificações não foi concedida.");
      }
    } catch (error) {
      console.error("Erro ao solicitar permissão de notificação:", error);
    } finally {
      setIsSubscribing(false);
    }
  }, []);

  return { subscribeToPush, isSubscribing };
}
