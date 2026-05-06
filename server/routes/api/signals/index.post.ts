import { defineEventHandler } from "h3";
import { readBody } from "@agent-native/core/server";
import { requireAuth } from "../lib.js";
import { exec, cuid, nowUnix } from "../../../db/queries.js";

export default defineEventHandler(async (event) => {
  const email = await requireAuth(event);
  const body = await readBody<{
    competitorId: string;
    title: string;
    summary?: string;
    signalType?: string;
    severity?: string;
    url?: string;
  }>(event);

  const id = cuid();
  await exec(
    `INSERT INTO signals (id, owner_email, competitor_id, signal_type, title, summary, url, severity, is_read, detected_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
    [id, email, body.competitorId, body.signalType || "manual", body.title, body.summary || null, body.url || null, body.severity || "medium", nowUnix()],
  );

  return { id };
});
