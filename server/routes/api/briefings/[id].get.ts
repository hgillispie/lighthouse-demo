import { defineEventHandler, getRouterParam } from "h3";
import { requireAuth } from "../lib.js";
import { query } from "../../../db/queries.js";

export default defineEventHandler(async (event) => {
  const email = await requireAuth(event);
  const id = getRouterParam(event, "id")!;

  const [briefing] = await query(
    `SELECT * FROM briefings WHERE id = ? AND owner_email = ?`,
    [id, email],
  );

  if (!briefing) throw new Error("Not found");
  return briefing;
});
