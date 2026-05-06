import { defineEventHandler, getQuery } from "h3";
import { requireAuth } from "../lib.js";
import { query } from "../../../db/queries.js";

export default defineEventHandler(async (event) => {
  const email = await requireAuth(event);
  const qs = getQuery(event) as Record<string, string>;

  let sql = `SELECT * FROM watch_configs WHERE owner_email = ?`;
  const params: unknown[] = [email];

  if (qs.competitorId) {
    sql += ` AND competitor_id = ?`;
    params.push(qs.competitorId);
  }

  sql += ` ORDER BY created_at DESC`;
  return query(sql, params);
});
