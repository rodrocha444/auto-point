import { db, ensureDbReady } from "@/db";
import { pushSubscriptions, type Point } from "@/db/schema";
import { eq } from "drizzle-orm";

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

export async function subscribeToPush(): Promise<PushSubscription | null> {
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

  await saveSubscriptionToDb(subscription);
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

  if (existing.length > 0) {
    await db
      .update(pushSubscriptions)
      .set({
        p256dh,
        auth,
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
      targetNotifyAt,
      notified: false,
      updatedAt: now,
    });
  }
}

const DEFAULT_TARGET_MINUTES = 8 * 60; // 480 min (8 horas)
const STORAGE_KEY_WORK_TARGET = "auto_point_work_target_minutes";

export function getWorkTargetMinutes(): number {
  if (typeof window === "undefined") return DEFAULT_TARGET_MINUTES;
  const stored = localStorage.getItem(STORAGE_KEY_WORK_TARGET);
  if (!stored) return DEFAULT_TARGET_MINUTES;
  const parsed = parseInt(stored, 10);
  return Number.isNaN(parsed) || parsed <= 0 ? DEFAULT_TARGET_MINUTES : parsed;
}

export function setWorkTargetMinutes(minutes: number): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY_WORK_TARGET, String(minutes));
}

/**
 * Calcula quando o usuário completará a meta de horas de trabalho no dia atual.
 * Retorna ISO string do momento futuro, ou null se não estiver trabalhando ou já completou.
 */
export function calculateTargetWorkTime(
  points: Point[],
  targetMinutes: number = getWorkTargetMinutes(),
): string | null {
  if (!points || points.length === 0) return null;

  // Se o número de batidas for par, usuário está pausado/fora do trabalho
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
    // Já atingiu a meta
    return null;
  }

  const currentEntryTimestamp = new Date(
    points[points.length - 1].timestamp,
  ).getTime();

  const targetCompletionDate = new Date(currentEntryTimestamp + remainingMs);

  // Se a data calculada já passou no relógio atual
  if (targetCompletionDate.getTime() <= Date.now()) {
    return null;
  }

  return targetCompletionDate.toISOString();
}

/**
 * Sincroniza o agendamento de notificação com base nos pontos de hoje e meta
 */
export async function syncPushSchedule(
  todayPoints: Point[],
  targetMinutes: number = getWorkTargetMinutes(),
): Promise<void> {
  if (!isPushSupported()) return;

  const subscription = await getPushSubscription();
  if (!subscription) return;

  const targetNotifyAt = calculateTargetWorkTime(todayPoints, targetMinutes);
  await saveSubscriptionToDb(subscription, targetNotifyAt);
}
