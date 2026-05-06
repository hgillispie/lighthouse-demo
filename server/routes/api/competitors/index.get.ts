import { defineEventHandler } from "h3";
import { requireAuth } from "../lib.js";
import { query } from "../../../db/queries.js";

export default defineEventHandler(async (event) => {
  const email = await requireAuth(event);
  return query(
    `SELECT * FROM competitors WHERE owner_email = ? AND is_active = 1 ORDER BY name`,
    [email],
  );
});
