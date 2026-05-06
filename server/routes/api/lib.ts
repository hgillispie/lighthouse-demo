import { type H3Event, createError } from "h3";
import { getSession } from "@agent-native/core/server";

export async function requireAuth(event: H3Event): Promise<string> {
  const session = await getSession(event);
  if (!session?.email) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }
  return session.email;
}
