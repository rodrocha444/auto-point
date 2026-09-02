import { useState, useEffect, useCallback } from "react";
import {
  checkAndCreateFirstPointGoalAlert,
  getCustomAlerts,
  getPushSubscription,
  isPushSupported,
  saveCustomAlerts,
  subscribeToPush,
  syncPushSchedule,
  unsubscribeFromPush,
  type CustomAlert,
} from "@/services/pushService";
import type { Point } from "@/db/schema";

export type PushPermissionStatus =
  | "unsupported"
  | "default"
  | "granted"
  | "denied";

export function usePushNotifications(todayPoints?: Point[]) {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<PushPermissionStatus>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [alerts, setAlerts] = useState<CustomAlert[]>(getCustomAlerts);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const supported = isPushSupported();
    setIsSupported(supported);

    if (!supported) {
      setPermission("unsupported");
      return;
    }

    if (typeof Notification !== "undefined") {
      setPermission(Notification.permission as PushPermissionStatus);
    }

    getPushSubscription()
      .then((sub) => {
        setIsSubscribed(Boolean(sub));
      })
      .catch((err) => {
        console.warn("Erro ao checar Push Subscription:", err);
      });
  }, []);

  // Auto-criação da meta no primeiro ponto do dia (apenas se for o primeiro ponto registrado)
  useEffect(() => {
    if (todayPoints && todayPoints.length >= 1) {
      const updated = checkAndCreateFirstPointGoalAlert();
      if (updated) {
        setAlerts(updated);
        if (isSubscribed) {
          syncPushSchedule(todayPoints, updated).catch(console.warn);
        }
      }
    }
  }, [todayPoints, isSubscribed]);

  const saveAndSyncAlerts = useCallback(
    (newAlerts: CustomAlert[]) => {
      setAlerts(newAlerts);
      saveCustomAlerts(newAlerts);
      if (isSubscribed) {
        syncPushSchedule(todayPoints, newAlerts).catch(console.warn);
      }
    },
    [isSubscribed, todayPoints],
  );

  const addAlert = useCallback(
    (newAlertData: Omit<CustomAlert, "id">) => {
      const id = "alert-" + Date.now();
      const updated = [...alerts, { ...newAlertData, id }];
      saveAndSyncAlerts(updated);
    },
    [alerts, saveAndSyncAlerts],
  );

  const removeAlert = useCallback(
    (id: string) => {
      const updated = alerts.filter((a) => a.id !== id);
      saveAndSyncAlerts(updated);
    },
    [alerts, saveAndSyncAlerts],
  );

  const toggleAlert = useCallback(
    (id: string) => {
      const updated = alerts.map((a) =>
        a.id === id ? { ...a, enabled: !a.enabled } : a,
      );
      saveAndSyncAlerts(updated);
    },
    [alerts, saveAndSyncAlerts],
  );

  const updateAlert = useCallback(
    (updatedAlert: CustomAlert) => {
      const updated = alerts.map((a) =>
        a.id === updatedAlert.id ? updatedAlert : a,
      );
      saveAndSyncAlerts(updated);
    },
    [alerts, saveAndSyncAlerts],
  );

  // Sincroniza sempre que os pontos do dia ou o status de subscrição mudarem
  useEffect(() => {
    if (isSubscribed) {
      syncPushSchedule(todayPoints, alerts).catch((err) => {
        console.warn("Falha ao sincronizar push:", err);
      });
    }
  }, [isSubscribed, todayPoints, alerts]);

  const enablePush = useCallback(async () => {
    try {
      setIsLoading(true);
      const sub = await subscribeToPush(alerts);
      setIsSubscribed(Boolean(sub));
      setPermission(Notification.permission as PushPermissionStatus);
      await syncPushSchedule(todayPoints, alerts);
      return true;
    } catch (error) {
      console.error("Falha ao habilitar notificações push:", error);
      if (typeof Notification !== "undefined") {
        setPermission(Notification.permission as PushPermissionStatus);
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [todayPoints, alerts]);

  const disablePush = useCallback(async () => {
    try {
      setIsLoading(true);
      const success = await unsubscribeFromPush();
      if (success) {
        setIsSubscribed(false);
      }
      return success;
    } catch (error) {
      console.error("Falha ao desabilitar notificações push:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    alerts,
    addAlert,
    removeAlert,
    toggleAlert,
    updateAlert,
    saveAndSyncAlerts,
    enablePush,
    disablePush,
  };
}
