import { useState, useEffect, useCallback } from "react";
import {
  getPushSubscription,
  getWorkTargetMinutes,
  isPushSupported,
  setWorkTargetMinutes,
  subscribeToPush,
  syncPushSchedule,
  unsubscribeFromPush,
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
  const [targetMinutes, setTargetMinutesState] = useState<number>(getWorkTargetMinutes);
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

  const updateTargetMinutes = useCallback(
    (minutes: number) => {
      setWorkTargetMinutes(minutes);
      setTargetMinutesState(minutes);
      if (isSubscribed && todayPoints) {
        syncPushSchedule(todayPoints, minutes).catch(console.warn);
      }
    },
    [isSubscribed, todayPoints],
  );

  // Sincroniza sempre que os pontos do dia ou a meta mudarem
  useEffect(() => {
    if (isSubscribed && todayPoints) {
      syncPushSchedule(todayPoints, targetMinutes).catch((err) => {
        console.warn("Falha ao sincronizar horário do push:", err);
      });
    }
  }, [isSubscribed, todayPoints, targetMinutes]);

  const enablePush = useCallback(async () => {
    try {
      setIsLoading(true);
      const sub = await subscribeToPush();
      setIsSubscribed(Boolean(sub));
      setPermission(Notification.permission as PushPermissionStatus);
      if (todayPoints) {
        await syncPushSchedule(todayPoints);
      }
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
  }, [todayPoints]);

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
    targetMinutes,
    updateTargetMinutes,
    enablePush,
    disablePush,
  };
}
