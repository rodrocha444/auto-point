import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const rawUrl = process.env.VITE_TURSO_DATABASE_URL || "file:local.db";
const url = rawUrl.startsWith("turso://")
  ? rawUrl.replace(/^turso:\/\//, "libsql://")
  : rawUrl;

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "turso",
  dbCredentials: {
    url,
    authToken: process.env.VITE_TURSO_AUTH_TOKEN,
  },
});
