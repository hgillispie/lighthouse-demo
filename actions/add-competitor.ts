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
    github: z
      .string()
      .optional()
      .describe(
        "GitHub repo in 'org/repo' format (e.g. 'stackblitz-labs/bolt.diy'). Do NOT pass a full URL.",
      ),
    hiring: z.string().optional().describe("Careers/hiring page URL"),
    description: z.string().optional().describe("Short description"),
  }),
  http: false,
  run: async (args) => {
    const email = getRequestUserEmail();
    if (!email) return "Error: Not authenticated";

    const slug = slugify(args.name);

    // Deduplicate: check if a competitor with this slug already exists (active or inactive)
    const existing = await query<{ id: string; is_active: number }>(
      `SELECT id, is_active FROM competitors WHERE owner_email = ? AND slug = ? LIMIT 1`,
      [email, slug],
    );

    if (existing.length > 0) {
      const dupe = existing[0];
      if (dupe.is_active) {
        return `Error: A competitor named "${args.name}" (slug: ${slug}) already exists (id: ${dupe.id}). Use update-competitor or add watch configs directly instead of creating a duplicate.`;
      } else {
        // Reactivate the soft-deleted competitor instead of creating a new one
        const now = nowUnix();
        await exec(
          `UPDATE competitors SET is_active = 1, website_url = COALESCE(?, website_url), pricing_url = COALESCE(?, pricing_url), github_repo = COALESCE(?, github_repo), hiring_url = COALESCE(?, hiring_url), description = COALESCE(?, description), updated_at = ? WHERE id = ?`,
          [
            args.website || null,
            args.pricing || null,
            args.github || null,
            args.hiring || null,
            args.description || null,
            now,
            dupe.id,
          ],
        );
        return `Reactivated existing competitor "${args.name}" (id: ${dupe.id}) instead of creating a duplicate.`;
      }
    }

    // Normalize GitHub: strip full URL prefix if accidentally passed
    let githubRepo = args.github;
    if (githubRepo) {
      // Strip https://github.com/ or http://github.com/ prefix if present
      githubRepo = githubRepo
        .replace(/^https?:\/\/github\.com\//, "")
        .replace(/\/$/, "");
    }

    const now = nowUnix();
    const competitorId = cuid();

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
        githubRepo || null,
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
    if (githubRepo) {
      watchConfigs.push({
        url: `https://api.github.com/repos/${githubRepo}/releases`,
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
