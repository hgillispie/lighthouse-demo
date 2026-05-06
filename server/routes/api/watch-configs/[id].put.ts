import { defineEventHandler, getRouterParam } from "h3";
import { readBody } from "@agent-native/core/server";
import { requireAuth } from "../lib.js";
import { exec } from "../../../db/queries.js";

export default defineEventHandler(async (event) => {
  const email = await requireAuth(event);
  const id = getRouterParam(event, "id")!;
  const body = await readBody<Record<string, unknown>>(event);

  const fields: string[] = [];
  const values: unknown[] = [];

  if (body.is_enabled !== undefined) { fields.push("is_enabled = ?"); values.push(body.is_enabled ? 1 : 0); }
  if (body.check_interval_hours !== undefined) { fields.push("check_interval_hours = ?"); values.push(body.check_interval_hours); }
  if (body.url !== undefined) { fields.push("url = ?"); values.push(body.url); }
  if (body.label !== undefined) { fields.push("label = ?"); values.push(body.label); }

  if (fields.length === 0) return { ok: true };

  values.push(id, email);
  await exec(`UPDATE watch_configs SET ${fields.join(", ")} WHERE id = ? AND owner_email = ?`, values);

  return { ok: true };
});
