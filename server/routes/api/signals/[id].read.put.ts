import { defineEventHandler, getRouterParam } from "h3";
import { requireAuth } from "../lib.js";
import { exec } from "../../../db/queries.js";

export default defineEventHandler(async (event) => {
  const email = await requireAuth(event);
  const id = getRouterParam(event, "id")!;

  await exec(
    `UPDATE signals SET is_read = 1 WHERE id = ? AND owner_email = ?`,
    [id, email],
  );

  return { ok: true };
});
