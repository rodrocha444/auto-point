import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const points = sqliteTable("points", {
  id: text("id").primaryKey(),
  timestamp: text("timestamp").notNull(),
});

export const pushSubscriptions = sqliteTable("push_subscriptions", {
  id: text("id").primaryKey(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  alerts: text("alerts"),
  targetNotifyAt: text("target_notify_at"),
  notified: integer("notified", { mode: "boolean" }).default(false),
  updatedAt: text("updated_at").notNull(),
});

export type Point = typeof points.$inferSelect;
export type NewPoint = typeof points.$inferInsert;
export type PushSubscriptionRecord = typeof pushSubscriptions.$inferSelect;
export type NewPushSubscriptionRecord = typeof pushSubscriptions.$inferInsert;
