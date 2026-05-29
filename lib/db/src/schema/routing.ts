import { pgTable, text, serial, timestamp, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const routingDecisionsTable = pgTable("routing_decisions", {
  id: serial("id").primaryKey(),
  query: text("query").notNull(),
  decision: text("decision").notNull(),
  localScore: real("local_score").notNull(),
  cloudScore: real("cloud_score").notNull(),
  reasoning: text("reasoning").notNull(),
  latencyMs: integer("latency_ms"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRoutingDecisionSchema = createInsertSchema(routingDecisionsTable).omit({ id: true, createdAt: true });
export type InsertRoutingDecision = z.infer<typeof insertRoutingDecisionSchema>;
export type RoutingDecision = typeof routingDecisionsTable.$inferSelect;
