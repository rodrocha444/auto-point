import { createClient } from "@libsql/client/web";
import webpush from "web-push";

interface Env {
  TURSO_DATABASE_URL: string;
  TURSO_AUTH_TOKEN: string;
  VAPID_PUBLIC_KEY: string;
  VAPID_PRIVATE_KEY: string;
  VAPID_SUBJECT?: string;
}

interface PushSubscriptionRow {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  target_notify_at: string | null;
  notified: number;
}

async function processScheduledNotifications(
  env: Env,
): Promise<{ sent: number; failed: number }> {
  const rawUrl = env.TURSO_DATABASE_URL;
  if (!rawUrl || !env.TURSO_AUTH_TOKEN || !env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) {
    console.error("Variáveis de ambiente ausentes no Worker.");
    return { sent: 0, failed: 0 };
  }

  const url = rawUrl.startsWith("turso://")
    ? rawUrl.replace(/^turso:\/\//, "libsql://")
    : rawUrl;

  const client = createClient({
    url,
    authToken: env.TURSO_AUTH_TOKEN,
  });

  webpush.setVapidDetails(
    env.VAPID_SUBJECT || "mailto:contato@autopoint.local",
    env.VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY,
  );

  const now = new Date().toISOString();

  // Seleciona inscrições com meta de 8h atingida e ainda não notificadas
  const result = await client.execute({
    sql: `
      SELECT id, endpoint, p256dh, auth, target_notify_at, notified
      FROM push_subscriptions
      WHERE target_notify_at IS NOT NULL
        AND target_notify_at <= ?
        AND (notified = 0 OR notified IS NULL)
    `,
    args: [now],
  });

  let sent = 0;
  let failed = 0;

  for (const row of result.rows) {
    const sub = row as unknown as PushSubscriptionRow;
    const pushConfig = {
      endpoint: sub.endpoint,
      keys: {
        auth: sub.auth,
        p256dh: sub.p256dh,
      },
    };

    const payload = JSON.stringify({
      title: "Auto Point - 8 Horas Concluídas! ⏰",
      body: "Você atingiu a meta diária de 8 horas de trabalho.",
      data: { url: "/" },
    });

    try {
      await webpush.sendNotification(pushConfig, payload);
      sent++;

      await client.execute({
        sql: `UPDATE push_subscriptions SET notified = 1, updated_at = ? WHERE id = ?`,
        args: [new Date().toISOString(), sub.id],
      });
    } catch (error: any) {
      failed++;
      console.error(`Erro ao enviar push para subscription ${sub.id}:`, error);

      // Se a subscrição foi desativada no dispositivo ou expirou (404 / 410)
      if (error?.statusCode === 404 || error?.statusCode === 410) {
        await client.execute({
          sql: `DELETE FROM push_subscriptions WHERE id = ?`,
          args: [sub.id],
        });
      }
    }
  }

  return { sent, failed };
}

export default {
  // Disparado a cada minuto pelo Cloudflare Cron Trigger
  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(processScheduledNotifications(env));
  },

  // Endpoint HTTP para testes e status
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
