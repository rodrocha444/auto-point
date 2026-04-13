import { useState, useCallback } from "react";

export function useNotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      return window.Notification.permission;
    }
    return "default";
  });

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      alert("Seu navegador não suporta notificações.");
      return null;
    }

    try {
      const result = await window.Notification.requestPermission();
      setPermission(result);
      console.log("Status da permissão:", result);

      return result;
    } catch (error) {
      console.error("Erro ao solicitar permissão de notificação:", error);
      return null;
    }
  }, []);

  return { permission, requestPermission };
}
