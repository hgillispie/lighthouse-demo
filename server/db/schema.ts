import { table, text, integer } from "@agent-native/core/db/schema";

export const competitors = table("competitors", {
  id: text("id").primaryKey(),
  owner_email: text("owner_email").notNull(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  website_url: text("website_url"),
  pricing_url: text("pricing_url"),
  github_repo: text("github_repo"),
  hiring_url: text("hiring_url"),
  description: text("description"),
  logo_url: text("logo_url"),
  is_active: integer("is_active").default(1),
  created_at: integer("created_at").notNull(),
  updated_at: integer("updated_at").notNull(),
});

export const watchConfigs = table("watch_configs", {
  id: text("id").primaryKey(),
  owner_email: text("owner_email").notNull(),
  competitor_id: text("competitor_id").notNull(),
  watch_type: text("watch_type").notNull(),
  url: text("url").notNull(),
  label: text("label").notNull(),
  last_content_hash: text("last_content_hash"),
  last_content_snippet: text("last_content_snippet"),
  last_checked_at: integer("last_checked_at"),
  check_interval_hours: integer("check_interval_hours").default(4),
  is_enabled: integer("is_enabled").default(1),
  created_at: integer("created_at").notNull(),
});

export const signals = table("signals", {
  id: text("id").primaryKey(),
  owner_email: text("owner_email").notNull(),
  competitor_id: text("competitor_id").notNull(),
  watch_config_id: text("watch_config_id"),
  signal_type: text("signal_type").notNull(),
  title: text("title").notNull(),
  summary: text("summary"),
  raw_diff: text("raw_diff"),
  url: text("url"),
  severity: text("severity").default("medium"),
  is_read: integer("is_read").default(0),
  detected_at: integer("detected_at").notNull(),
});

export const briefings = table("briefings", {
  id: text("id").primaryKey(),
  owner_email: text("owner_email").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  signal_ids: text("signal_ids").notNull(),
  period_start: integer("period_start").notNull(),
  period_end: integer("period_end").notNull(),
  generated_at: integer("generated_at").notNull(),
});
