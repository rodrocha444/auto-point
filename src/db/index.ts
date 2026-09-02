import { createClient } from "@libsql/client/web";
import { drizzle } from "drizzle-orm/libsql/web";
import * as schema from "./schema";

const rawUrl = import.meta.env.VITE_TURSO_DATABASE_URL || "http://127.0.0.1:8080";
const url = rawUrl.startsWith("turso://")
  ? rawUrl.replace(/^turso:\/\//, "libsql://")
  : rawUrl;

const authToken = import.meta.env.VITE_TURSO_AUTH_TOKEN;

export const client = createClient({
  url,
  authToken: authToken || undefined,
});

export const db = drizzle({ client, schema });

let initPromise: Promise<void> | null = null;

export async function ensureDbReady() {
  if (!initPromise) {
    initPromise = (async () => {
      try {
        await client.execute(`
          CREATE TABLE IF NOT EXISTS points (
            id TEXT PRIMARY KEY,
            timestamp TEXT NOT NULL
          );
          CREATE TABLE IF NOT EXISTS push_subscriptions (
            id TEXT PRIMARY KEY,
            endpoint TEXT NOT NULL,
            p256dh TEXT NOT NULL,
            auth TEXT NOT NULL,
            target_notify_at TEXT,
            notified INTEGER DEFAULT 0,
            updated_at TEXT NOT NULL
          );
        `);
      } catch (error) {
        console.warn("Auto-initialization of tables skipped or failed:", error);
      }
    })();
  }
  return initPromise;
}
