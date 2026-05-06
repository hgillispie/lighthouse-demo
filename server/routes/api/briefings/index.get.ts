import { defineEventHandler, getQuery } from "h3";
import { requireAuth } from "../lib.js";
import { query } from "../../../db/queries.js";

export default defineEventHandler(async (event) => {
  const email = await requireAuth(event);
  const qs = getQuery(event) as Record<string, string>;
  const limit = parseInt(qs.limit || "20", 10);
  const offset = parseInt(qs.offset || "0", 10);

  return query(
    `SELECT * FROM briefings WHERE owner_email = ? ORDER BY generated_at DESC LIMIT ? OFFSET ?`,
    [email, limit, offset],
  );
});
