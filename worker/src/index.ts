import { createClient } from "@libsql/client/web";
import webpush from "web-push";

interface Env {
  TURSO_DATABASE_URL: string;
  TURSO_AUTH_TOKEN: string;
  VAPID_PUBLIC_KEY: string;
  VAPID_PRIVATE_KEY: string;
  VAPID_SUBJECT?: string;
}

interface CustomAlert {
  id: string;
  type: "exact_time" | "work_duration";
  label: string;
  description?: string;
  time?: string;
  durationMinutes?: number;
  onlyIfWorking: boolean;
  enabled: boolean;
  lastNotifiedDate?: string;
}

interface PushSubscriptionRow {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  alerts: string | null;
  target_notify_at: string | null;
  notified: number;
}

function getSaoPauloInfo() {
  const now = new Date();
  const spDateStr = now.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
  const spTimeStr = now.toLocaleTimeString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const todayStartIso = new Date(`${spDateStr}T00:00:00-03:00`).toISOString();
  return { now, spDateStr, spTimeStr, todayStartIso };
}

async function processScheduledNotifications(
  env: Env,
): Promise<{ sent: number; failed: number; skipped: number }> {
  const rawUrl = env.TURSO_DATABASE_URL;
  if (!rawUrl || !env.TURSO_AUTH_TOKEN || !env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) {
    console.error("Variáveis de ambiente ausentes no Worker.");
    return { sent: 0, failed: 0, skipped: 0 };
  }

  const url = rawUrl.startsWith("turso://")
    ? rawUrl.replace(/^turso:\/\//, "libsql://")
    : rawUrl;

  const client = createClient({
    url,
    authToken: env.TURSO_AUTH_TOKEN,
  });

  webpush.setVapidDetails(
    env.VAPID_SUBJECT || "mailto:contato@autopoint.app",
    env.VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY,
  );

  const { now, spDateStr, spTimeStr, todayStartIso } = getSaoPauloInfo();

  // 1. Busca os pontos de hoje para calcular estado e tempo trabalhado
  const pointsResult = await client.execute({
    sql: `SELECT timestamp FROM points WHERE timestamp >= ? ORDER BY timestamp ASC`,
    args: [todayStartIso],
  });

  const timestamps = pointsResult.rows.map((r) => String(r.timestamp));
  const isPointOpen = timestamps.length % 2 === 1;

  let totalWorkedMinutes = 0;
  for (let i = 0; i < timestamps.length - 1; i += 2) {
    const inMs = new Date(timestamps[i]).getTime();
    const outMs = new Date(timestamps[i + 1]).getTime();
    totalWorkedMinutes += (outMs - inMs) / 60000;
  }

  if (isPointOpen && timestamps.length > 0) {
    const lastInMs = new Date(timestamps[timestamps.length - 1]).getTime();
    totalWorkedMinutes += (now.getTime() - lastInMs) / 60000;
  }

  // 2. Busca todas as inscrições ativas
  const subResult = await client.execute({
    sql: `SELECT id, endpoint, p256dh, auth, alerts, target_notify_at, notified FROM push_subscriptions`,
  });

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const row of subResult.rows) {
    const sub = row as unknown as PushSubscriptionRow;
    let alerts: CustomAlert[] = [];

    if (sub.alerts) {
      try {
        alerts = JSON.parse(sub.alerts);
      } catch {
        alerts = [];
      }
    }

    const pushConfig = {
      endpoint: sub.endpoint,
      keys: {
        auth: sub.auth,
        p256dh: sub.p256dh,
      },
    };

    let subscriptionUpdated = false;

    // Se temos a lista de avisos customizados configurada
    if (Array.isArray(alerts) && alerts.length > 0) {
      for (const alert of alerts) {
        if (!alert.enabled) continue;
        if (alert.onlyIfWorking && !isPointOpen) continue;
        if (alert.lastNotifiedDate === spDateStr) continue;

        let shouldTrigger = false;
        const pushTitle = alert.label;
        const pushBody = alert.description?.trim() ? alert.description.trim() : " ";

        if (alert.type === "exact_time" && alert.time) {
          // Dispara se o horário atual é igual ou posterior ao horário configurado hoje
          if (spTimeStr >= alert.time) {
            shouldTrigger = true;
          }
        } else if (alert.type === "work_duration" && alert.durationMinutes) {
          if (isPointOpen && totalWorkedMinutes >= alert.durationMinutes) {
            shouldTrigger = true;
          }
        }

        if (shouldTrigger) {
          try {
            await webpush.sendNotification(
              pushConfig,
              JSON.stringify({
                title: pushTitle,
                body: pushBody,
                data: { url: "/", tag: `ap-${alert.id}-${Date.now()}` },
              }),
            );
            sent++;
            alert.lastNotifiedDate = spDateStr;
            if (alert.type === "exact_time") {
              alert.enabled = false;
            }
            subscriptionUpdated = true;
          } catch (error: any) {
            failed++;
            console.error(`Erro ao enviar push (${alert.label}) para ${sub.id}:`, error);
            if (error?.statusCode === 404 || error?.statusCode === 410) {
              await client.execute({
                sql: `DELETE FROM push_subscriptions WHERE id = ?`,
                args: [sub.id],
              });
              break;
            }
          }
        }
      }

      if (subscriptionUpdated) {
        await client.execute({
          sql: `UPDATE push_subscriptions SET alerts = ?, updated_at = ? WHERE id = ?`,
          args: [JSON.stringify(alerts), new Date().toISOString(), sub.id],
        });
      }
    } else if (sub.target_notify_at && sub.target_notify_at <= now.toISOString()) {
      // Fallback legado para target_notify_at
      if (!isPointOpen) {
        skipped++;
        await client.execute({
          sql: `UPDATE push_subscriptions SET target_notify_at = NULL, notified = 1, updated_at = ? WHERE id = ?`,
          args: [new Date().toISOString(), sub.id],
        });
        continue;
      }

      try {
        await webpush.sendNotification(
          pushConfig,
          JSON.stringify({
            title: "Auto Point - Horário de Saída! ⏰",
            body: "Sua meta/horário foi atingido e o ponto continua aberto. Não esqueça de bater a saída!",
            data: { url: "/" },
          }),
        );
        sent++;
        const nextNotifyAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        await client.execute({
          sql: `UPDATE push_subscriptions SET target_notify_at = ?, notified = 0, updated_at = ? WHERE id = ?`,
          args: [nextNotifyAt, new Date().toISOString(), sub.id],
        });
      } catch (error: any) {
        failed++;
        if (error?.statusCode === 404 || error?.statusCode === 410) {
          await client.execute({
            sql: `DELETE FROM push_subscriptions WHERE id = ?`,
            args: [sub.id],
          });
        }
      }
    }
  }

  return { sent, failed, skipped };
}

export default {
  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(processScheduledNotifications(env));
  },

  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/trigger") {
      const stats = await processScheduledNotifications(env);
      return new Response(JSON.stringify({ status: "success", stats }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        service: "Auto Point Push Cron Worker",
        status: "online",
        timestamp: new Date().toISOString(),
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  },
};
