import { defineEventHandler, getRouterParam } from "h3";
import { requireAuth } from "../lib.js";
import { exec } from "../../../db/queries.js";

export default defineEventHandler(async (event) => {
  const email = await requireAuth(event);
  const id = getRouterParam(event, "id")!;

  await exec(`DELETE FROM watch_configs WHERE id = ? AND owner_email = ?`, [id, email]);
  return { ok: true };
});
