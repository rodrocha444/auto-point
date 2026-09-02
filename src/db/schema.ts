import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const points = sqliteTable("points", {
  id: text("id").primaryKey(),
  timestamp: text("timestamp").notNull(),
});

export type Point = typeof points.$inferSelect;
export type NewPoint = typeof points.$inferInsert;
