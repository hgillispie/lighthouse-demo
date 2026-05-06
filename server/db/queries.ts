import { getDbExec } from "@agent-native/core/db";

const db = () => getDbExec();

export async function query<T = Record<string, unknown>>(
  sql: string,
  args: unknown[] = [],
): Promise<T[]> {
  const result = await db().execute({ sql, args });
  return result.rows as T[];
}

export async function exec(
  sql: string,
  args: unknown[] = [],
): Promise<{ rowsAffected: number }> {
  const result = await db().execute({ sql, args });
  return { rowsAffected: result.rowsAffected };
}

export function cuid(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `c${ts}${rand}`;
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function nowUnix(): number {
  return Math.floor(Date.now() / 1000);
}
