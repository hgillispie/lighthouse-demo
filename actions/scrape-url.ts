import { defineAction } from "@agent-native/core";
import { getRequestUserEmail } from "@agent-native/core/server";
import { z } from "zod";
import { query, exec, nowUnix } from "../server/db/queries.js";
import {
  fetchWatchContent,
  hashText,
} from "../server/lib/check-utils.js";

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
      const text = await fetchWatchContent(
        args.url,
        wc.watch_type as string,
      );
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
