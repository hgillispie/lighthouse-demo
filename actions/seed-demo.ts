import { defineAction } from "@agent-native/core";
import { getRequestUserEmail } from "@agent-native/core/server";
import { z } from "zod";
import { query, exec, cuid, nowUnix } from "../server/db/queries.js";

const COMPETITORS = [
  {
    name: "Lovable",
    slug: "lovable",
    website_url: "https://lovable.dev",
    pricing_url: "https://lovable.dev/pricing",
    github_repo: "lovable-dev/gptengineer.app",
    hiring_url: "https://lovable.dev/careers",
  },
  {
    name: "v0",
    slug: "v0",
    website_url: "https://v0.app",
    pricing_url: "https://v0.app/pricing",
    github_repo: "vercel/ai",
    hiring_url: "https://vercel.com/careers",
  },
  {
    name: "Replit",
    slug: "replit",
    website_url: "https://replit.com",
    pricing_url: "https://replit.com/pricing",
    github_repo: "replit/extensions",
    hiring_url: "https://replit.com/site/careers",
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
    competitorSlug: "replit",
    title:
      "Replit raises $250M at $3B valuation — signals major agent and infrastructure push",
    type: "content_change",
    severity: "high",
    daysAgo: 28,
    summary:
      "Replit secured a $250M funding round at a $3B valuation, signaling aggressive expansion into AI agent capabilities and developer infrastructure.",
  },
  {
    competitorSlug: "lovable",
    title:
      "Business plan adds Security Centre and SSO — targeting enterprise buyers at $50/mo",
    type: "pricing_change",
    severity: "high",
    daysAgo: 22,
    summary:
      "Lovable introduced a Business plan at $50/mo featuring Security Centre and SSO, clearly targeting enterprise adoption.",
  },
  {
    competitorSlug: "v0",
    title:
      "v0 ships full VS Code-style editor, Git integration, and PR workflows in major Feb update",
    type: "content_change",
    severity: "high",
    daysAgo: 20,
    summary:
      "v0 launched a full VS Code-style editor with Git integration and pull request workflows, significantly enhancing the developer experience.",
  },
  {
    competitorSlug: "replit",
    title:
      "Replit Pro replaces Teams — $100/mo flat for 15 builders, Core drops to $20/mo",
    type: "pricing_change",
    severity: "high",
    daysAgo: 14,
    summary:
      "Replit restructured pricing: Pro plan at $100/mo covers 15 builders, and Core plan dropped to $20/mo, simplifying the offering.",
  },
  {
    competitorSlug: "lovable",
    title:
      "Lovable Cloud launched — integrated hosting, PostgreSQL, and auth now bundled with plans",
    type: "content_change",
    severity: "high",
    daysAgo: 12,
    summary:
      "Lovable launched Lovable Cloud, bundling integrated hosting, PostgreSQL databases, and authentication into all plans.",
  },
  {
    competitorSlug: "v0",
    title:
      "v0 agentic mode now autonomously plans, searches web, and debugs across multi-file projects",
    type: "content_change",
    severity: "high",
    daysAgo: 8,
    summary:
      "v0 released an agentic mode that autonomously plans, searches the web, and debugs across multi-file projects.",
  },
  {
    competitorSlug: "replit",
    title:
      "Agent 3 launched — autonomous sessions up to 200 min with Economy/Power/Turbo modes",
    type: "content_change",
    severity: "high",
    daysAgo: 6,
    summary:
      "Replit launched Agent 3 with autonomous sessions lasting up to 200 minutes and three performance tiers.",
  },
  {
    competitorSlug: "lovable",
    title:
      "Lovable hiring 15 engineers across AI infra and full-stack generation roles",
    type: "hiring_surge",
    severity: "medium",
    daysAgo: 4,
    summary:
      "Lovable posted 15 engineering positions focused on AI infrastructure and full-stack generation, indicating rapid team growth.",
  },
  {
    competitorSlug: "v0",
    title:
      "Figma import now available on Premium plan — design-to-code now one step",
    type: "content_change",
    severity: "medium",
    daysAgo: 2,
    summary:
      "v0 added Figma import on the Premium plan, enabling one-step design-to-code workflows.",
  },
];

export default defineAction({
  description:
    "Seed demo competitors, watch configs, and signals. Idempotent — skips if Lovable already exists.",
  schema: z.object({}),
  http: false,
  run: async () => {
    const email = getRequestUserEmail();
    if (!email) return "Error: Not authenticated";

    const existing = await query(
      `SELECT id FROM competitors WHERE name = 'Lovable' AND owner_email = ?`,
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
