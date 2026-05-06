import { defineAction } from "@agent-native/core";
import { readAppState } from "@agent-native/core/application-state";
import { getRequestUserEmail } from "@agent-native/core/server";
import { z } from "zod";
import { query } from "../server/db/queries.js";

export default defineAction({
  description:
    "See what the user is currently looking at on screen. Returns navigation state plus relevant data for the current view.",
  schema: z.object({}),
  http: false,
  run: async () => {
    const navigation = (await readAppState("navigation")) as Record<
      string,
      unknown
    > | null;
    if (!navigation) return "No application state found. Is the app running?";

    const email = getRequestUserEmail();
    if (!email) return JSON.stringify({ navigation }, null, 2);

    const view = navigation.view as string;
    const result: Record<string, unknown> = { navigation };

    if (view === "dashboard") {
      const unreadSignals = await query(
        `SELECT s.*, c.name as competitor_name, c.slug as competitor_slug
         FROM signals s JOIN competitors c ON s.competitor_id = c.id
         WHERE s.owner_email = ? AND s.is_read = 0
         ORDER BY s.detected_at DESC LIMIT 20`,
        [email],
      );
      const competitors = await query(
        `SELECT c.id, c.name, c.slug,
           (SELECT MAX(wc.last_checked_at) FROM watch_configs wc WHERE wc.competitor_id = c.id) as last_checked,
           (SELECT COUNT(*) FROM signals s WHERE s.competitor_id = c.id AND s.detected_at > ?) as signal_count_7d
         FROM competitors c WHERE c.owner_email = ? AND c.is_active = 1`,
        [Math.floor(Date.now() / 1000) - 7 * 86400, email],
      );
      result.unreadSignals = unreadSignals;
      result.unreadCount = unreadSignals.length;
      result.competitors = competitors;
    } else if (view === "competitor") {
      const slug = navigation.competitorSlug as string;
      const [competitor] = await query(
        `SELECT * FROM competitors WHERE slug = ? AND owner_email = ? AND is_active = 1`,
        [slug, email],
      );
      if (competitor) {
        const signals_ = await query(
          `SELECT * FROM signals WHERE competitor_id = ? AND owner_email = ? ORDER BY detected_at DESC LIMIT 50`,
          [(competitor as Record<string, unknown>).id, email],
        );
        const watchConfigs = await query(
          `SELECT * FROM watch_configs WHERE competitor_id = ? AND owner_email = ?`,
          [(competitor as Record<string, unknown>).id, email],
        );
        result.competitor = competitor;
        result.signals = signals_;
        result.watchConfigs = watchConfigs;
      }
    } else if (view === "briefings") {
      const briefings_ = await query(
        `SELECT id, title, generated_at, signal_ids FROM briefings WHERE owner_email = ? ORDER BY generated_at DESC LIMIT 10`,
        [email],
      );
      result.briefings = briefings_.map((b: Record<string, unknown>) => ({
        ...b,
        signalCount: JSON.parse((b.signal_ids as string) || "[]").length,
      }));
    } else if (view === "settings") {
      const competitors = await query(
        `SELECT c.*,
           (SELECT COUNT(*) FROM watch_configs wc WHERE wc.competitor_id = c.id) as watch_config_count
         FROM competitors c WHERE c.owner_email = ? AND c.is_active = 1`,
        [email],
      );
      result.competitors = competitors;
    }

    return JSON.stringify(result, null, 2);
  },
});
