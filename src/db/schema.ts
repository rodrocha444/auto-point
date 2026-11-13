import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const points = sqliteTable(
  "points",
  {
    id: text("id").primaryKey(),
    timestamp: text("timestamp").notNull(),
  },
  (table) => [index("idx_points_timestamp").on(table.timestamp)],
);

export type Point = typeof points.$inferSelect;
export type NewPoint = typeof points.$inferInsert;
