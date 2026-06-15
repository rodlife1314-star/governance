import { pgTable, text, timestamp, boolean, real } from "drizzle-orm/pg-core";

export const sovereignAudits = pgTable("sovereign_audits", {
  id: text("id").primaryKey(),
  authority: text("authority").notNull(),
  asset: text("asset").notNull(),
  price: text("price").notNull(),
  packetId: text("packet_id").notNull(),
  operatorEmail: text("operator_email").notNull(),
  logs: text("logs").array().notNull().default([]),
  signature: text("signature").notNull(),
  createdAt: text("created_at").notNull(),
  verified: boolean("verified").notNull().default(true),
  operatorDecision: text("operator_decision").notNull().default("APPROVED"),
  divergenceState: text("divergence_state").notNull().default("ALIGNED"),
  divergenceDelta: real("divergence_delta").notNull().default(0),
});

export const languageAuthorities = pgTable("language_authorities", {
  id: text("id").primaryKey(),
  authorityName: text("authority_name").notNull(),
  jurisdiction: text("jurisdiction").notNull(),
  domain: text("domain").notNull(),
  languageLayer: text("language_layer").notNull(),
  sourceType: text("source_type").notNull(),
  definitionUrl: text("definition_url").notNull(),
  structuredCodeSystem: text("structured_code_system").notNull(),
  operatorApproved: boolean("operator_approved").notNull().default(true),
  createdAt: text("created_at").notNull(),
  definedTerm: text("defined_term"),
  meaning: text("meaning"),
});
