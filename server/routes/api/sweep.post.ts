import { defineEventHandler } from "h3";
import { requireAuth } from "./lib.js";
import { query, exec, cuid, nowUnix } from "../../db/queries.js";
import crypto from "crypto";

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function hashText(text: string): string {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function inferSignalType(watchType: string): string {
  const map: Record<string, string> = { pricing: "pricing_change", github_releases: "github_release", hiring: "hiring_surge", webpage: "content_change", rss: "content_change" };
  return map[watchType] || "content_change";
}

function inferSeverity(watchType: string): string {
  const map: Record<string, string> = { pricing: "high", github_releases: "medium", hiring: "medium", webpage: "low", rss: "low" };
  return map[watchType] || "medium";
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export default defineEventHandler(async (event) => {
  const email = await requireAuth(event);

  const competitors = await query(
    `SELECT * FROM competitors WHERE owner_email = ? AND is_active = 1`,
    [email],
  );

  let signalsCreated = 0;
  let configsChecked = 0;

  for (const competitor of competitors) {
    const comp = competitor as Record<string, unknown>;
    const configs = await query(
      `SELECT * FROM watch_configs WHERE competitor_id = ? AND owner_email = ? AND is_enabled = 1`,
      [comp.id, email],
    );

    for (const config of configs) {
      const wc = config as Record<string, unknown>;
      const now = nowUnix();

      try {
        let text: string;
        if (wc.watch_type === "github_releases") {
          const res = await fetch(wc.url as string, {
            headers: { "User-Agent": "Lighthouse-Bot/1.0", Accept: "application/vnd.github.v3+json" },
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const release = (await res.json()) as Record<string, unknown>;
          text = `${release.tag_name} ${release.name} ${release.body || ""}`;
        } else {
          const res = await fetch(wc.url as string, { headers: { "User-Agent": "Lighthouse-Bot/1.0" } });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          text = stripHtml(await res.text());
        }

        const hash = hashText(text);
        const snippet = text.slice(0, 500);
        const previousHash = wc.last_content_hash as string | null;

        await exec(`UPDATE watch_configs SET last_content_hash = ?, last_content_snippet = ?, last_checked_at = ? WHERE id = ?`, [hash, snippet, now, wc.id]);

        if (previousHash && hash !== previousHash) {
          signalsCreated++;
          await exec(
            `INSERT INTO signals (id, owner_email, competitor_id, watch_config_id, signal_type, title, summary, url, severity, is_read, detected_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
            [cuid(), email, comp.id, wc.id, inferSignalType(wc.watch_type as string), `${wc.label} content changed for ${comp.name}`, `Change detected on ${wc.label} for ${comp.name}.`, wc.url, inferSeverity(wc.watch_type as string), now],
          );
        }
        configsChecked++;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        await exec(`UPDATE watch_configs SET last_content_snippet = ?, last_checked_at = ? WHERE id = ?`, [`[ERROR: ${msg}]`, now, wc.id]);
        configsChecked++;
      }

      await sleep(1500);
    }
  }

  return { signalsCreated, configsChecked, competitorsChecked: competitors.length };
});
