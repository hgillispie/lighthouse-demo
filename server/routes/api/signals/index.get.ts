import { defineEventHandler, getQuery } from "h3";
import { requireAuth } from "../lib.js";
import { query } from "../../../db/queries.js";

export default defineEventHandler(async (event) => {
  const email = await requireAuth(event);
  const qs = getQuery(event) as Record<string, string>;

  let sql = `SELECT s.*, c.name as competitor_name, c.slug as competitor_slug
             FROM signals s JOIN competitors c ON s.competitor_id = c.id
             WHERE s.owner_email = ?`;
  const params: unknown[] = [email];

  if (qs.competitorId) {
    sql += ` AND s.competitor_id = ?`;
    params.push(qs.competitorId);
  }
  if (qs.unread === "true") {
    sql += ` AND s.is_read = 0`;
  }
  if (qs.type) {
    sql += ` AND s.signal_type = ?`;
    params.push(qs.type);
  }
  if (qs.severity) {
    sql += ` AND s.severity = ?`;
    params.push(qs.severity);
  }

  sql += ` ORDER BY s.detected_at DESC`;

  const limit = parseInt(qs.limit || "50", 10);
  const offset = parseInt(qs.offset || "0", 10);
  sql += ` LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  return query(sql, params);
});
