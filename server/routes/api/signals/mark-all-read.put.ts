import { defineEventHandler } from "h3";
import { requireAuth } from "../lib.js";
import { exec } from "../../../db/queries.js";

export default defineEventHandler(async (event) => {
  const email = await requireAuth(event);
  const result = await exec(
    `UPDATE signals SET is_read = 1 WHERE owner_email = ? AND is_read = 0`,
    [email],
  );
  return { marked: result.rowsAffected };
});
