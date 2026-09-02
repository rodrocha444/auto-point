import { db, ensureDbReady } from "@/db";
import { pushSubscriptions, type Point } from "@/db/schema";
import { eq } from "drizzle-orm";

export type AlertType = "exact_time" | "work_duration";

export interface CustomAlert {
  id: string;
  type: AlertType;
  label: string;
  time?: string; // "HH:mm" (ex: "12:00")
  durationMinutes?: number; // minutos trabalhados (ex: 480)
  onlyIfWorking: boolean; // Só notificar se ponto estiver aberto
  enabled: boolean;
  lastNotifiedDate?: string;
}

export const DEFAULT_WORK_MINUTES = 480; // 8 horas

export function createDefaultGoalAlert(minutes: number = DEFAULT_WORK_MINUTES): CustomAlert {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const label = `Meta de ${h}h${m > 0 ? ` ${m}m` : ""}`;
  return {
    id: "goal-" + Date.now(),
    type: "work_duration",
    label,
    durationMinutes: minutes,
    onlyIfWorking: true,
    enabled: true,
  };
}

const STORAGE_KEY_ALERTS = "auto_point_daily_alerts_v3";
const STORAGE_KEY_GOAL_AUTO_CREATED = "auto_point_goal_auto_created_date";

function getTodayKey(): string {
  const now = new Date();
  return now.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

export function getCustomAlerts(): CustomAlert[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ALERTS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const today = getTodayKey();
    if (parsed && parsed.date === today && Array.isArray(parsed.alerts)) {
      return parsed.alerts;
    }
    // Se mudou o dia, reinicia a lista vazia para o novo dia
    return [];
  } catch {
    return [];
  }
}

export function saveCustomAlerts(alerts: CustomAlert[]): void {
  if (typeof window === "undefined") return;
  const today = getTodayKey();
  localStorage.setItem(STORAGE_KEY_ALERTS, JSON.stringify({ date: today, alerts }));
}

/**
 * Cria o aviso de meta automaticamente no primeiro ponto do dia, caso ainda não tenha sido criado hoje
 */
export function checkAndCreateFirstPointGoalAlert(): CustomAlert[] | null {
  if (typeof window === "undefined") return null;
  const today = getTodayKey();
  const alreadyAutoCreated = localStorage.getItem(STORAGE_KEY_GOAL_AUTO_CREATED) === today;

  if (alreadyAutoCreated) {
    return null;
  }

  localStorage.setItem(STORAGE_KEY_GOAL_AUTO_CREATED, today);
  const currentAlerts = getCustomAlerts();

  // Se já existir um aviso de meta manual, não duplica
  const hasGoalAlert = currentAlerts.some((a) => a.type === "work_duration");
  if (hasGoalAlert) {
    return currentAlerts;
  }

  const newGoalAlert = createDefaultGoalAlert();
  const updatedAlerts = [newGoalAlert, ...currentAlerts];
  saveCustomAlerts(updatedAlerts);
  return updatedAlerts;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export async function getPushSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  const registration = await navigator.serviceWorker.ready;
  return await registration.pushManager.getSubscription();
}

export async function subscribeToPush(alerts: CustomAlert[] = getCustomAlerts()): Promise<PushSubscription | null> {
  if (!isPushSupported()) {
    throw new Error("Push Notifications não são suportadas neste navegador.");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Permissão para notificações foi negada.");
  }

  const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) {
    throw new Error("VITE_VAPID_PUBLIC_KEY não está configurada no ambiente.");
  }

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey).buffer as ArrayBuffer,
    });
  }

  await saveSubscriptionToDb(subscription, alerts);
  return subscription;
}

export async function unsubscribeFromPush(): Promise<boolean> {
  if (!isPushSupported()) return false;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    await ensureDbReady();
    await db
      .delete(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, subscription.endpoint));
    return await subscription.unsubscribe();
  }

  return false;
}

export async function saveSubscriptionToDb(
  subscription: PushSubscription,
  alerts: CustomAlert[] = getCustomAlerts(),
  targetNotifyAt: string | null = null,
): Promise<void> {
  await ensureDbReady();
  const raw = subscription.toJSON();
  const endpoint = raw.endpoint;
  const p256dh = raw.keys?.p256dh;
  const auth = raw.keys?.auth;

  if (!endpoint || !p256dh || !auth) return;

  const existing = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, endpoint))
    .limit(1);

  const now = new Date().toISOString();
  const alertsJson = JSON.stringify(alerts);

  if (existing.length > 0) {
    await db
      .update(pushSubscriptions)
      .set({
        p256dh,
        auth,
        alerts: alertsJson,
        targetNotifyAt,
        notified: false,
        updatedAt: now,
      })
      .where(eq(pushSubscriptions.endpoint, endpoint));
  } else {
    const id =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : endpoint.slice(-32);

    await db.insert(pushSubscriptions).values({
      id,
      endpoint,
      p256dh,
      auth,
      alerts: alertsJson,
      targetNotifyAt,
      notified: false,
      updatedAt: now,
    });
  }
}

/**
 * Calcula quando o usuário completará uma meta de minutos de trabalho no dia atual.
 */
export function calculateTargetWorkTime(
  points: Point[],
  targetMinutes: number,
): string | null {
  if (!points || points.length === 0) return null;

  const isWorking = points.length % 2 === 1;
  if (!isWorking) return null;

  const targetMs = targetMinutes * 60 * 1000;

  let totalClosedMs = 0;
  for (let i = 0; i < points.length - 1; i += 2) {
    const entrada = new Date(points[i].timestamp).getTime();
    const saida = new Date(points[i + 1].timestamp).getTime();
    totalClosedMs += saida - entrada;
  }

  const remainingMs = targetMs - totalClosedMs;
  if (remainingMs <= 0) {
    return new Date().toISOString();
  }

  const currentEntryTimestamp = new Date(
    points[points.length - 1].timestamp,
  ).getTime();

  const targetCompletionDate = new Date(currentEntryTimestamp + remainingMs);

  if (targetCompletionDate.getTime() <= Date.now()) {
    return new Date().toISOString();
  }

  return targetCompletionDate.toISOString();
}

/**
 * Sincroniza a lista de avisos com o Turso/Push Subscriptions
 */
export async function syncPushSchedule(
  todayPoints?: Point[],
  alerts: CustomAlert[] = getCustomAlerts(),
): Promise<void> {
  if (!isPushSupported()) return;

  const subscription = await getPushSubscription();
  if (!subscription) return;

  let nextTargetIso: string | null = null;
  const isWorking = Boolean(todayPoints && todayPoints.length % 2 === 1);

  if (isWorking && todayPoints) {
    const activeDurations = alerts.filter(
      (a) => a.enabled && a.type === "work_duration" && a.durationMinutes,
    );
    if (activeDurations.length > 0) {
      const minDuration = Math.min(...activeDurations.map((a) => a.durationMinutes!));
      nextTargetIso = calculateTargetWorkTime(todayPoints, minDuration);
    }
  }

  await saveSubscriptionToDb(subscription, alerts, nextTargetIso);
}
