import { defineEventHandler, getRouterParam } from "h3";
import { requireAuth } from "../lib.js";
import { exec } from "../../../db/queries.js";

export default defineEventHandler(async (event) => {
  const email = await requireAuth(event);
  const id = getRouterParam(event, "id")!;

  await exec(
    `UPDATE competitors SET is_active = 0 WHERE id = ? AND owner_email = ?`,
    [id, email],
  );
  await exec(
    `UPDATE watch_configs SET is_enabled = 0 WHERE competitor_id = ? AND owner_email = ?`,
    [id, email],
  );

  return { ok: true };
});
