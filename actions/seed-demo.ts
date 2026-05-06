import { defineAction } from "@agent-native/core";
import { getRequestUserEmail } from "@agent-native/core/server";
import { z } from "zod";
import { query, exec, cuid, nowUnix } from "../server/db/queries.js";

const COMPETITORS = [
  {
    name: "Acme Corp",
    slug: "acme-corp",
    website_url: "https://example.com/acme",
    pricing_url: "https://example.com/acme/pricing",
    github_repo: "acme/acme-app",
    hiring_url: "https://example.com/acme/careers",
  },
  {
    name: "Initech",
    slug: "initech",
    website_url: "https://example.com/initech",
    pricing_url: "https://example.com/initech/pricing",
    github_repo: "initech/platform",
    hiring_url: "https://example.com/initech/careers",
  },
  {
    name: "Globex",
    slug: "globex",
    website_url: "https://example.com/globex",
    pricing_url: "https://example.com/globex/pricing",
    github_repo: "globex/globex-sdk",
    hiring_url: "https://example.com/globex/careers",
  },
];

function watchConfigsFor(
  competitorId: string,
  comp: (typeof COMPETITORS)[number],
) {
  const configs: Array<{
    id: string;
    competitor_id: string;
    watch_type: string;
    url: string;
    label: string;
  }> = [];

  configs.push({
    id: cuid(),
    competitor_id: competitorId,
    watch_type: "webpage",
    url: comp.website_url,
    label: "Website",
  });
  configs.push({
    id: cuid(),
    competitor_id: competitorId,
    watch_type: "pricing",
    url: comp.pricing_url,
    label: "Pricing Page",
  });
  configs.push({
    id: cuid(),
    competitor_id: competitorId,
    watch_type: "github_releases",
    url: `https://api.github.com/repos/${comp.github_repo}/releases/latest`,
    label: "GitHub Releases",
  });
  configs.push({
    id: cuid(),
    competitor_id: competitorId,
    watch_type: "hiring",
    url: comp.hiring_url,
    label: "Hiring Page",
  });

  return configs;
}

const SAMPLE_SIGNALS = [
  {
    competitorSlug: "acme-corp",
    title: "Acme Corp raises Series C — signals aggressive product expansion",
    type: "content_change",
    severity: "high" as const,
    daysAgo: 28,
    summary:
      "Acme Corp announced a major funding round, signaling expansion into new markets and accelerated product development.",
  },
  {
    competitorSlug: "initech",
    title: "Enterprise plan adds SSO and audit logs — targeting upmarket buyers",
    type: "pricing_change",
    severity: "high" as const,
    daysAgo: 22,
    summary:
      "Initech introduced an Enterprise plan with SSO and audit logs, clearly targeting larger organizations.",
  },
  {
    competitorSlug: "globex",
    title: "Globex ships v3.0 with redesigned dashboard and API overhaul",
    type: "content_change",
    severity: "high" as const,
    daysAgo: 20,
    summary:
      "Globex launched v3.0 featuring a completely redesigned dashboard and a modernized API surface.",
  },
  {
    competitorSlug: "acme-corp",
    title: "Acme Pro plan drops from $99 to $49/mo — aggressive pricing move",
    type: "pricing_change",
    severity: "high" as const,
    daysAgo: 14,
    summary:
      "Acme Corp cut their Pro plan price in half, signaling a shift toward volume-based growth.",
  },
  {
    competitorSlug: "initech",
    title: "Initech launches managed hosting — bundled infrastructure play",
    type: "content_change",
    severity: "high" as const,
    daysAgo: 12,
    summary:
      "Initech now offers managed hosting bundled with all paid plans, reducing deployment friction for customers.",
  },
  {
    competitorSlug: "globex",
    title: "Globex SDK v3.1 adds plugin system and webhook support",
    type: "github_release",
    severity: "medium" as const,
    daysAgo: 8,
    summary:
      "Globex released SDK v3.1 with an extensible plugin architecture and native webhook integration.",
  },
  {
    competitorSlug: "acme-corp",
    title: "Acme hiring 12 engineers across platform and ML teams",
    type: "hiring_surge",
    severity: "medium" as const,
    daysAgo: 6,
    summary:
      "Acme Corp posted 12 engineering roles focused on platform infrastructure and machine learning.",
  },
  {
    competitorSlug: "initech",
    title: "Initech careers page shows 8 new roles in sales and marketing",
    type: "hiring_surge",
    severity: "medium" as const,
    daysAgo: 4,
    summary:
      "Initech is scaling their go-to-market team with 8 new sales and marketing positions.",
  },
  {
    competitorSlug: "globex",
    title: "Globex blog announces open-source community edition",
    type: "content_change",
    severity: "medium" as const,
    daysAgo: 2,
    summary:
      "Globex announced a free community edition of their SDK, likely aiming to grow developer adoption.",
  },
];

export default defineAction({
  description:
    "Seed demo competitors, watch configs, and signals for exploring the app. Idempotent — skips if data already exists.",
  schema: z.object({}),
  http: false,
  run: async () => {
    const email = getRequestUserEmail();
    if (!email) return "Error: Not authenticated";

    const existing = await query(
      `SELECT id FROM competitors WHERE name = 'Acme Corp' AND owner_email = ?`,
      [email],
    );
    if (existing.length > 0) {
      return "Demo data already exists. Skipping.";
    }

    const now = nowUnix();
    const competitorIds: Record<string, string> = {};

    for (const comp of COMPETITORS) {
      const id = cuid();
      competitorIds[comp.slug] = id;

      await exec(
        `INSERT INTO competitors (id, owner_email, name, slug, website_url, pricing_url, github_repo, hiring_url, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        [
          id,
          email,
          comp.name,
          comp.slug,
          comp.website_url,
          comp.pricing_url,
          comp.github_repo,
          comp.hiring_url,
          now,
          now,
        ],
      );

      const wcs = watchConfigsFor(id, comp);
      for (const wc of wcs) {
        await exec(
          `INSERT INTO watch_configs (id, owner_email, competitor_id, watch_type, url, label, is_enabled, created_at)
           VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
          [wc.id, email, wc.competitor_id, wc.watch_type, wc.url, wc.label, now],
        );
      }
    }

    for (const sig of SAMPLE_SIGNALS) {
      const competitorId = competitorIds[sig.competitorSlug];
      if (!competitorId) continue;

      const detectedAt = now - sig.daysAgo * 86400;
      await exec(
        `INSERT INTO signals (id, owner_email, competitor_id, signal_type, title, summary, severity, is_read, detected_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`,
        [
          cuid(),
          email,
          competitorId,
          sig.type,
          sig.title,
          sig.summary,
          sig.severity,
          detectedAt,
        ],
      );
    }

    return `Seeded ${COMPETITORS.length} competitors, ${COMPETITORS.length * 4} watch configs, and ${SAMPLE_SIGNALS.length} signals.`;
  },
});
