import crypto from "crypto";
import { query, exec, cuid, nowUnix } from "../db/queries.js";

// ── Text utilities ──────────────────────────────────────────────

export function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function hashText(text: string): string {
  return crypto.createHash("sha256").update(text).digest("hex");
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Signal inference ────────────────────────────────────────────

const SIGNAL_TYPE_MAP: Record<string, string> = {
  pricing: "pricing_change",
  github_releases: "github_release",
  hiring: "hiring_surge",
  webpage: "content_change",
  rss: "content_change",
};

const SEVERITY_MAP: Record<string, string> = {
  pricing: "high",
  github_releases: "medium",
  hiring: "medium",
  webpage: "low",
  rss: "low",
};

export function inferSignalType(watchType: string): string {
  return SIGNAL_TYPE_MAP[watchType] || "content_change";
}

export function inferSeverity(watchType: string): string {
  return SEVERITY_MAP[watchType] || "medium";
}

// ── Fetch a single watch config URL ─────────────────────────────

export async function fetchWatchContent(
  url: string,
  watchType: string,
): Promise<string> {
  if (watchType === "github_releases") {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Lighthouse-Bot/1.0",
        Accept: "application/vnd.github.v3+json",
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const release = (await res.json()) as Record<string, unknown>;
    return `${release.tag_name} ${release.name} ${release.body || ""}`;
  }

  const res = await fetch(url, {
    headers: { "User-Agent": "Lighthouse-Bot/1.0" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return stripHtml(await res.text());
}

// ── Check a single watch config and create signal if needed ─────

interface CheckResult {
  checked: boolean;
  signalCreated: boolean;
  error?: string;
}

/**
 * Check a single watch config: fetch content, hash it, and create a signal
 * if the content changed (or if this is the first check, create a baseline signal).
 *
 * @param createBaselineSignal  When true, creates an informational signal on
 *                              first check so the user sees something immediately
 *                              after adding a competitor. Defaults to false for
 *                              backward compat with existing sweep behavior.
 */
export async function checkWatchConfig(
  wc: Record<string, unknown>,
  competitorName: string,
  email: string,
  { createBaselineSignal = false }: { createBaselineSignal?: boolean } = {},
): Promise<CheckResult> {
  const now = nowUnix();

  try {
    const text = await fetchWatchContent(
      wc.url as string,
      wc.watch_type as string,
    );
    const hash = hashText(text);
    const snippet = text.slice(0, 500);
    const previousHash = wc.last_content_hash as string | null;

    await exec(
      `UPDATE watch_configs SET last_content_hash = ?, last_content_snippet = ?, last_checked_at = ? WHERE id = ?`,
      [hash, snippet, now, wc.id],
    );

    // Change detected — always create signal
    if (previousHash && hash !== previousHash) {
      const signalType = inferSignalType(wc.watch_type as string);
      const severity = inferSeverity(wc.watch_type as string);
      await exec(
        `INSERT INTO signals (id, owner_email, competitor_id, watch_config_id, signal_type, title, summary, url, severity, is_read, detected_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
        [
          cuid(),
          email,
          wc.competitor_id,
          wc.id,
          signalType,
          `${wc.label} content changed for ${competitorName}`,
          `Change detected on ${wc.label} for ${competitorName}. Previous and current content differ.`,
          wc.url,
          severity,
          now,
        ],
      );
      return { checked: true, signalCreated: true };
    }

    // First check — optionally create a baseline signal
    if (!previousHash && createBaselineSignal) {
      const signalType = inferSignalType(wc.watch_type as string);
      await exec(
        `INSERT INTO signals (id, owner_email, competitor_id, watch_config_id, signal_type, title, summary, url, severity, is_read, detected_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
        [
          cuid(),
          email,
          wc.competitor_id,
          wc.id,
          signalType,
          `Now tracking ${competitorName}'s ${wc.label}`,
          snippet
            ? `Initial snapshot captured. Preview: ${snippet.slice(0, 200)}...`
            : `Initial snapshot captured for ${wc.label}.`,
          wc.url,
          "low",
          now,
        ],
      );
      return { checked: true, signalCreated: true };
    }

    return { checked: true, signalCreated: false };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await exec(
      `UPDATE watch_configs SET last_content_snippet = ?, last_checked_at = ? WHERE id = ?`,
      [`[ERROR: ${msg}]`, now, wc.id],
    );
    return { checked: true, signalCreated: false, error: msg };
  }
}

// ── Check all watch configs for a single competitor ─────────────

interface CheckCompetitorResult {
  configsChecked: number;
  signalsCreated: number;
  errors: string[];
}

export async function checkCompetitor(
  competitorId: string,
  email: string,
  { createBaselineSignal = false }: { createBaselineSignal?: boolean } = {},
): Promise<CheckCompetitorResult> {
  const [competitor] = await query(
    `SELECT * FROM competitors WHERE id = ? AND owner_email = ? AND is_active = 1`,
    [competitorId, email],
  );
  if (!competitor)
    return { configsChecked: 0, signalsCreated: 0, errors: ["Competitor not found"] };

  const comp = competitor as Record<string, unknown>;
  const configs = await query(
    `SELECT * FROM watch_configs WHERE competitor_id = ? AND owner_email = ? AND is_enabled = 1`,
    [competitorId, email],
  );

  let configsChecked = 0;
  let signalsCreated = 0;
  const errors: string[] = [];

  for (let i = 0; i < configs.length; i++) {
    const wc = configs[i] as Record<string, unknown>;
    const result = await checkWatchConfig(wc, comp.name as string, email, {
      createBaselineSignal,
    });

    if (result.checked) configsChecked++;
    if (result.signalCreated) signalsCreated++;
    if (result.error) errors.push(`${wc.label}: ${result.error}`);

    // Rate-limit between requests
    if (i < configs.length - 1) await sleep(1500);
  }

  return { configsChecked, signalsCreated, errors };
}
