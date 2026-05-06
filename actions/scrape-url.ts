import { defineAction } from "@agent-native/core";
import { getRequestUserEmail } from "@agent-native/core/server";
import { z } from "zod";
import crypto from "crypto";
import { query, exec, nowUnix } from "../server/db/queries.js";

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function hashText(text: string): string {
  return crypto.createHash("sha256").update(text).digest("hex");
}

export default defineAction({
  description:
    "Scrape a URL and compare content hash to detect changes. Returns whether content changed.",
  schema: z.object({
    url: z.string().describe("URL to scrape"),
    watchConfigId: z.string().describe("Watch config ID to update"),
  }),
  http: false,
  run: async (args) => {
    const email = getRequestUserEmail();
    if (!email) return "Error: Not authenticated";

    const [config] = await query(
      `SELECT * FROM watch_configs WHERE id = ? AND owner_email = ?`,
      [args.watchConfigId, email],
    );
    if (!config)
      return JSON.stringify({ changed: false, error: true, message: "Watch config not found" });

    const wc = config as Record<string, unknown>;
    const now = nowUnix();

    try {
      let text: string;
      let fetchUrl = args.url;

      if (wc.watch_type === "github_releases") {
        const res = await fetch(fetchUrl, {
          headers: {
            "User-Agent": "Lighthouse-Bot/1.0",
            Accept: "application/vnd.github.v3+json",
          },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const release = (await res.json()) as Record<string, unknown>;
        text = `${release.tag_name} ${release.name} ${release.body || ""}`;
      } else {
        const res = await fetch(fetchUrl, {
          headers: { "User-Agent": "Lighthouse-Bot/1.0" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const html = await res.text();
        text = stripHtml(html);
      }

      const hash = hashText(text);
      const snippet = text.slice(0, 500);
      const previousHash = wc.last_content_hash as string | null;
      const previousSnippet = wc.last_content_snippet as string | null;

      await exec(
        `UPDATE watch_configs SET last_content_hash = ?, last_content_snippet = ?, last_checked_at = ? WHERE id = ?`,
        [hash, snippet, now, args.watchConfigId],
      );

      if (previousHash && hash !== previousHash) {
        return JSON.stringify({
          changed: true,
          hash,
          snippet,
          previousSnippet,
        });
      }

      return JSON.stringify({ changed: false, hash });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      await exec(
        `UPDATE watch_configs SET last_content_snippet = ?, last_checked_at = ? WHERE id = ?`,
        [`[ERROR: ${msg}]`, now, args.watchConfigId],
      );
      return JSON.stringify({ changed: false, error: true, message: msg });
    }
  },
});
