import { defineEventHandler } from "h3";
import { readBody } from "@agent-native/core/server";
import { requireAuth } from "./lib.js";
import { query, exec, cuid, nowUnix } from "../../db/queries.js";

export default defineEventHandler(async (event) => {
  const email = await requireAuth(event);
  const body = (await readBody(event).catch(() => ({}))) as { hours?: number };
  const hours = body.hours || 24;
  const now = nowUnix();
  const cutoff = now - hours * 3600;

  const signals_ = await query(
    `SELECT s.*, c.name as competitor_name FROM signals s JOIN competitors c ON s.competitor_id = c.id WHERE s.owner_email = ? AND s.detected_at >= ? ORDER BY s.severity DESC, s.detected_at DESC`,
    [email, cutoff],
  );

  if (signals_.length === 0) return { briefingId: null, message: "No signals to brief." };

  const byCompetitor: Record<string, Array<Record<string, unknown>>> = {};
  const bySeverity: Record<string, Array<Record<string, unknown>>> = { high: [], medium: [], low: [] };

  for (const signal of signals_) {
    const s = signal as Record<string, unknown>;
    const name = s.competitor_name as string;
    if (!byCompetitor[name]) byCompetitor[name] = [];
    byCompetitor[name].push(s);
    const sev = (s.severity as string) || "medium";
    if (!bySeverity[sev]) bySeverity[sev] = [];
    bySeverity[sev].push(s);
  }

  const date = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  let md = `# Competitive Intelligence Briefing\n**${date}** | ${signals_.length} signal(s) in the last ${hours} hours\n\n`;
  md += `## Summary\nDetected **${signals_.length} signals** across **${Object.keys(byCompetitor).length} competitor(s)**: ${Object.keys(byCompetitor).join(", ")}.\n\n`;

  if (bySeverity.high.length > 0) {
    md += `## High Priority\n`;
    for (const s of bySeverity.high) md += `- **${s.competitor_name}**: ${s.title}${s.summary ? ` — ${s.summary}` : ""}\n`;
    md += `\n`;
  }
  if (bySeverity.medium.length > 0) {
    md += `## Medium Priority\n`;
    for (const s of bySeverity.medium) md += `- **${s.competitor_name}**: ${s.title}${s.summary ? ` — ${s.summary}` : ""}\n`;
    md += `\n`;
  }
  if (bySeverity.low.length > 0) {
    md += `## Low / FYI\n`;
    for (const s of bySeverity.low) md += `- **${s.competitor_name}**: ${s.title}${s.summary ? ` — ${s.summary}` : ""}\n`;
    md += `\n`;
  }
  md += `## What to Watch\n`;
  for (const [name, sigs] of Object.entries(byCompetitor)) {
    md += `- **${name}**: ${sigs.length} signal(s) — ${[...new Set(sigs.map((s) => s.signal_type))].join(", ")}\n`;
  }

  const briefingId = cuid();
  await exec(
    `INSERT INTO briefings (id, owner_email, title, content, signal_ids, period_start, period_end, generated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [briefingId, email, `Briefing — ${date}`, md, JSON.stringify(signals_.map((s) => (s as Record<string, unknown>).id)), cutoff, now, now],
  );

  return { briefingId };
});
