import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const doctrineRulesTable = pgTable("doctrine_rules", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  priority: integer("priority").notNull().default(0),
  scope: text("scope").notNull().default("local"),
  action: text("action").notNull(),
  conditions: text("conditions"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDoctrineRuleSchema = createInsertSchema(doctrineRulesTable).omit({ id: true, createdAt: true });
export type InsertDoctrineRule = z.infer<typeof insertDoctrineRuleSchema>;
export type DoctrineRule = typeof doctrineRulesTable.$inferSelect;
