import { pgTable, text, boolean, integer } from "drizzle-orm/pg-core";

export const domainAuthorities = pgTable("domain_authorities", {
  id:            text("id").primaryKey(),
  domain:        text("domain").notNull(),
  subDomain:     text("sub_domain"),
  name:          text("name").notNull(),
  shortName:     text("short_name").notNull(),
  jurisdiction:  text("jurisdiction").notNull(),
  url:           text("url").notNull(),
  tier:          text("tier").notNull(),
  sourceType:    text("source_type").notNull(),
  description:   text("description").notNull(),
  active:        boolean("active").notNull().default(true),
  sortOrder:     integer("sort_order").notNull().default(0),
});

export const dataSources = pgTable("data_sources", {
  id:               text("id").primaryKey(),
  domain:           text("domain").notNull(),
  name:             text("name").notNull(),
  shortName:        text("short_name").notNull(),
  endpointUrl:      text("endpoint_url").notNull(),
  updateFrequency:  text("update_frequency").notNull(),
  authRequired:     boolean("auth_required").notNull().default(false),
  dataType:         text("data_type").notNull(),
  description:      text("description").notNull(),
  active:           boolean("active").notNull().default(true),
  notes:            text("notes"),
});
