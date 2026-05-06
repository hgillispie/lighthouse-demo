import { defineEventHandler, getRouterParam } from "h3";
import { requireAuth } from "../lib.js";
import { query } from "../../../db/queries.js";

export default defineEventHandler(async (event) => {
  const email = await requireAuth(event);
  const id = getRouterParam(event, "id")!;

  const [competitor] = await query(
    `SELECT * FROM competitors WHERE id = ? AND owner_email = ? AND is_active = 1`,
    [id, email],
  );
  if (!competitor) {
    throw new Error("Not found");
  }

  const watchConfigs = await query(
    `SELECT * FROM watch_configs WHERE competitor_id = ? AND owner_email = ?`,
    [id, email],
  );

  return { ...(competitor as Record<string, unknown>), watchConfigs };
});
