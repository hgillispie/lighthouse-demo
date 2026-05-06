import { defineEventHandler, getRouterParam } from "h3";
import { readBody } from "@agent-native/core/server";
import { requireAuth } from "../lib.js";
import { exec, nowUnix } from "../../../db/queries.js";

export default defineEventHandler(async (event) => {
  const email = await requireAuth(event);
  const id = getRouterParam(event, "id")!;
  const body = await readBody<Record<string, unknown>>(event);

  const fields: string[] = [];
  const values: unknown[] = [];

  for (const key of ["name", "website_url", "pricing_url", "github_repo", "hiring_url", "description"]) {
    if (body[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(body[key]);
    }
  }

  if (fields.length === 0) return { ok: true };

  fields.push("updated_at = ?");
  values.push(nowUnix());
  values.push(id, email);

  await exec(
    `UPDATE competitors SET ${fields.join(", ")} WHERE id = ? AND owner_email = ?`,
    values,
  );

  return { ok: true };
});
