import { defineAction } from "@agent-native/core";
import { getRequestUserEmail } from "@agent-native/core/server";
import { z } from "zod";
import { query, exec, cuid, slugify, nowUnix } from "../server/db/queries.js";

export default defineAction({
  description:
    "Add a new competitor to track. Auto-creates watch configs for each URL provided.",
  schema: z.object({
    name: z.string().describe("Competitor name"),
    website: z.string().optional().describe("Main website URL"),
    pricing: z.string().optional().describe("Pricing page URL"),
    github: z.string().optional().describe("GitHub repo (org/repo format)"),
    hiring: z.string().optional().describe("Careers/hiring page URL"),
    description: z.string().optional().describe("Short description"),
  }),
  http: false,
  run: async (args) => {
    const email = getRequestUserEmail();
    if (!email) return "Error: Not authenticated";

    const now = nowUnix();
    const competitorId = cuid();
    const slug = slugify(args.name);

    await exec(
      `INSERT INTO competitors (id, owner_email, name, slug, website_url, pricing_url, github_repo, hiring_url, description, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      [
        competitorId,
        email,
        args.name,
        slug,
        args.website || null,
        args.pricing || null,
        args.github || null,
        args.hiring || null,
        args.description || null,
        now,
        now,
      ],
    );

    const watchConfigs: Array<{
      url: string;
      type: string;
      label: string;
    }> = [];

    if (args.website) {
      watchConfigs.push({
        url: args.website,
        type: "webpage",
        label: "Website",
      });
    }
    if (args.pricing) {
      watchConfigs.push({
        url: args.pricing,
        type: "pricing",
        label: "Pricing Page",
      });
    }
    if (args.github) {
      watchConfigs.push({
        url: `https://api.github.com/repos/${args.github}/releases/latest`,
        type: "github_releases",
        label: "GitHub Releases",
      });
    }
    if (args.hiring) {
      watchConfigs.push({
        url: args.hiring,
        type: "hiring",
        label: "Hiring Page",
      });
    }

    for (const wc of watchConfigs) {
      await exec(
        `INSERT INTO watch_configs (id, owner_email, competitor_id, watch_type, url, label, is_enabled, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
        [cuid(), email, competitorId, wc.type, wc.url, wc.label, now],
      );
    }

    const result = {
      id: competitorId,
      name: args.name,
      slug,
      watchConfigsCreated: watchConfigs.length,
    };

    console.log(JSON.stringify(result, null, 2));
    return `Created competitor "${args.name}" (${slug}) with ${watchConfigs.length} watch config(s).`;
  },
});
