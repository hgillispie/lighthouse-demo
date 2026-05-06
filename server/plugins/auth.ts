import { createAuthPlugin } from "@agent-native/core/server";
import { type H3Event, getRequestHost } from "h3";
import { getDbExec } from "@agent-native/core/db";

let _cachedDevEmail: string | null = null;

async function resolveDevEmail(): Promise<string> {
  if (process.env.AGENT_USER_EMAIL) return process.env.AGENT_USER_EMAIL;
  if (_cachedDevEmail) return _cachedDevEmail;
  try {
    const { rows } = await getDbExec().execute({
      sql: `SELECT email FROM sessions WHERE email IS NOT NULL ORDER BY created_at DESC LIMIT 1`,
      args: [],
    });
    if (rows[0]?.email) {
      _cachedDevEmail = rows[0].email as string;
      return _cachedDevEmail;
    }
  } catch {}
  return "dev@localhost";
}

export default createAuthPlugin({
  async getSession(event: H3Event) {
    const host = getRequestHost(event, { xForwardedHost: false }) ?? "";
    const isLocal = host.startsWith("localhost") || host.startsWith("127.0.0.1") || host.startsWith("[::1]");
    if (isLocal) {
      const email = await resolveDevEmail();
      return { email };
    }
    return null;
  },
  marketing: {
    appName: "Lighthouse",
    tagline:
      "Competitive intelligence that watches your market 24/7 — track pricing, releases, hiring, and content changes across all your competitors.",
    features: [
      "Monitor competitor websites, pricing pages, GitHub repos, and hiring pages",
      "Auto-detect changes and surface them as actionable signals",
      "Generate daily competitive briefings powered by AI",
    ],
  },
});
