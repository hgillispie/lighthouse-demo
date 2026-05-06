import { defineEventHandler } from "h3";
import { readBody } from "@agent-native/core/server";
import { requireAuth } from "../lib.js";
import { exec, cuid, nowUnix } from "../../../db/queries.js";

export default defineEventHandler(async (event) => {
  const email = await requireAuth(event);
  const body = await readBody<{
    competitorId: string;
    watchType: string;
    url: string;
    label: string;
    checkIntervalHours?: number;
  }>(event);

  const id = cuid();
  await exec(
    `INSERT INTO watch_configs (id, owner_email, competitor_id, watch_type, url, label, check_interval_hours, is_enabled, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
    [id, email, body.competitorId, body.watchType, body.url, body.label, body.checkIntervalHours || 4, nowUnix()],
  );

  return { id };
});
