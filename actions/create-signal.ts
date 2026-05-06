import { defineAction } from "@agent-native/core";
import { getRequestUserEmail } from "@agent-native/core/server";
import { z } from "zod";
import { exec, cuid, nowUnix } from "../server/db/queries.js";

export default defineAction({
  description:
    "Manually create a signal. Use when you discover something during browsing or research.",
  schema: z.object({
    competitorId: z.string().describe("Competitor ID"),
    title: z.string().describe("Signal title"),
    summary: z.string().optional().describe("1-2 sentence summary"),
    type: z
      .enum([
        "pricing_change",
        "content_change",
        "github_release",
        "hiring_surge",
        "manual",
      ])
      .optional()
      .describe("Signal type"),
    severity: z
      .enum(["low", "medium", "high"])
      .optional()
      .describe("Severity level"),
    url: z.string().optional().describe("Related URL"),
  }),
  http: false,
  run: async (args) => {
    const email = getRequestUserEmail();
    if (!email) return "Error: Not authenticated";

    const id = cuid();
    const now = nowUnix();

    await exec(
      `INSERT INTO signals (id, owner_email, competitor_id, signal_type, title, summary, url, severity, is_read, detected_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
      [
        id,
        email,
        args.competitorId,
        args.type || "manual",
        args.title,
        args.summary || null,
        args.url || null,
        args.severity || "medium",
        now,
      ],
    );

    return `Created signal "${args.title}" (${id})`;
  },
});
