import { defineEventHandler } from "h3";
import { readBody } from "@agent-native/core/server";
import { requireAuth } from "../lib.js";
import { exec, cuid, slugify, nowUnix } from "../../../db/queries.js";
import { checkCompetitor } from "../../../lib/check-utils.js";

export default defineEventHandler(async (event) => {
  const email = await requireAuth(event);
  const body = await readBody<{
    name: string;
    websiteUrl?: string;
    pricingUrl?: string;
    githubRepo?: string;
    hiringUrl?: string;
    customWatchConfigs?: Array<{
      label: string;
      url: string;
      watchType: string;
    }>;
  }>(event);

  const id = cuid();
  const slug = slugify(body.name);
  const now = nowUnix();

  await exec(
    `INSERT INTO competitors (id, owner_email, name, slug, website_url, pricing_url, github_repo, hiring_url, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    [id, email, body.name, slug, body.websiteUrl || null, body.pricingUrl || null, body.githubRepo || null, body.hiringUrl || null, now, now],
  );

  const watchConfigs: Array<{ type: string; url: string; label: string }> = [];
  if (body.websiteUrl) watchConfigs.push({ type: "webpage", url: body.websiteUrl, label: "Website" });
  if (body.pricingUrl) watchConfigs.push({ type: "pricing", url: body.pricingUrl, label: "Pricing Page" });
  if (body.githubRepo) watchConfigs.push({ type: "github_releases", url: `https://api.github.com/repos/${body.githubRepo}/releases/latest`, label: "GitHub Releases" });
  if (body.hiringUrl) watchConfigs.push({ type: "hiring", url: body.hiringUrl, label: "Hiring Page" });

  // Append any custom watch configs from the form
  if (body.customWatchConfigs) {
    for (const custom of body.customWatchConfigs) {
      if (custom.url?.trim() && custom.label?.trim() && custom.watchType) {
        watchConfigs.push({
          type: custom.watchType,
          url: custom.url.trim(),
          label: custom.label.trim(),
        });
      }
    }
  }

  for (const wc of watchConfigs) {
    await exec(
      `INSERT INTO watch_configs (id, owner_email, competitor_id, watch_type, url, label, is_enabled, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
      [cuid(), email, id, wc.type, wc.url, wc.label, now],
    );
  }

  // Fire-and-forget: run initial check so signals appear immediately.
  // Don't await — let the UI navigate to the competitor page while this runs.
  if (watchConfigs.length > 0) {
    checkCompetitor(id, email, { createBaselineSignal: true }).catch((err) =>
      console.error(`[initial-check] ${body.name}:`, err),
    );
  }

  return { id, name: body.name, slug, watchConfigsCreated: watchConfigs.length };
});
