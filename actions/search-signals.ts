import { defineAction } from "@agent-native/core";
import { getRequestUserEmail } from "@agent-native/core/server";
import { z } from "zod";
import { query, nowUnix } from "../server/db/queries.js";

export default defineAction({
  description:
    "Search signals by keyword, competitor, type, or time range.",
  schema: z.object({
    query: z.string().optional().describe("Search query (matches title and summary)"),
    competitorSlug: z.string().optional().describe("Filter by competitor slug"),
    days: z.number().optional().describe("Days to search back (default 30)"),
    type: z.string().optional().describe("Signal type filter"),
  }),
  http: false,
  run: async (args) => {
    const email = getRequestUserEmail();
    if (!email) return "Error: Not authenticated";

    const days = args.days || 30;
    const cutoff = nowUnix() - days * 86400;

    let sql = `SELECT s.*, c.name as competitor_name, c.slug as competitor_slug
               FROM signals s JOIN competitors c ON s.competitor_id = c.id
               WHERE s.owner_email = ? AND s.detected_at >= ?`;
    const params: unknown[] = [email, cutoff];

    if (args.query) {
      sql += ` AND (LOWER(s.title) LIKE ? OR LOWER(s.summary) LIKE ?)`;
      const q = `%${args.query.toLowerCase()}%`;
      params.push(q, q);
    }

    if (args.competitorSlug) {
      sql += ` AND c.slug = ?`;
      params.push(args.competitorSlug);
    }

    if (args.type) {
      sql += ` AND s.signal_type = ?`;
      params.push(args.type);
    }

    sql += ` ORDER BY s.detected_at DESC LIMIT 50`;

    const results = await query(sql, params);
    return JSON.stringify(results, null, 2);
  },
});
