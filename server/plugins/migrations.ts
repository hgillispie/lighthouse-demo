import { runMigrations, intType } from "@agent-native/core/db";

const INT = intType();

export default runMigrations(
  [
    {
      version: 1,
      sql: `CREATE TABLE IF NOT EXISTS competitors (
        id TEXT PRIMARY KEY,
        owner_email TEXT NOT NULL,
        name TEXT NOT NULL,
        slug TEXT NOT NULL,
        website_url TEXT,
        pricing_url TEXT,
        github_repo TEXT,
        hiring_url TEXT,
        description TEXT,
        logo_url TEXT,
        is_active ${INT} DEFAULT 1,
        created_at ${INT} NOT NULL,
        updated_at ${INT} NOT NULL
      )`,
    },
    {
      version: 2,
      sql: `CREATE TABLE IF NOT EXISTS watch_configs (
        id TEXT PRIMARY KEY,
        owner_email TEXT NOT NULL,
        competitor_id TEXT NOT NULL,
        watch_type TEXT NOT NULL,
        url TEXT NOT NULL,
        label TEXT NOT NULL,
        last_content_hash TEXT,
        last_content_snippet TEXT,
        last_checked_at ${INT},
        check_interval_hours ${INT} DEFAULT 4,
        is_enabled ${INT} DEFAULT 1,
        created_at ${INT} NOT NULL
      )`,
    },
    {
      version: 3,
      sql: `CREATE TABLE IF NOT EXISTS signals (
        id TEXT PRIMARY KEY,
        owner_email TEXT NOT NULL,
        competitor_id TEXT NOT NULL,
        watch_config_id TEXT,
        signal_type TEXT NOT NULL,
        title TEXT NOT NULL,
        summary TEXT,
        raw_diff TEXT,
        url TEXT,
        severity TEXT DEFAULT 'medium',
        is_read ${INT} DEFAULT 0,
        detected_at ${INT} NOT NULL
      )`,
    },
    {
      version: 4,
      sql: `CREATE TABLE IF NOT EXISTS briefings (
        id TEXT PRIMARY KEY,
        owner_email TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        signal_ids TEXT NOT NULL,
        period_start ${INT} NOT NULL,
        period_end ${INT} NOT NULL,
        generated_at ${INT} NOT NULL
      )`,
    },
  ],
  { table: "lighthouse_migrations" },
);
