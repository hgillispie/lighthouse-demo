import { defineAction } from "@agent-native/core";
import { getRequestUserEmail } from "@agent-native/core/server";
import { z } from "zod";
import { query } from "../server/db/queries.js";
import { checkCompetitor } from "../server/lib/check-utils.js";

export default defineAction({
  description:
    "Run a full competitive intelligence sweep across all active competitors.",
  schema: z.object({}),
  http: false,
  run: async () => {
    const email = getRequestUserEmail();
    if (!email) return "Error: Not authenticated";

    const startTime = Date.now();
    const competitors = await query(
      `SELECT * FROM competitors WHERE owner_email = ? AND is_active = 1`,
      [email],
    );

    let totalChecked = 0;
    let totalChanged = 0;

    for (const competitor of competitors) {
      const comp = competitor as Record<string, unknown>;
      const result = await checkCompetitor(comp.id as string, email);
      totalChecked += result.configsChecked;
      totalChanged += result.signalsCreated;
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    return `Full sweep complete. ${competitors.length} competitor(s), ${totalChecked} config(s) checked, ${totalChanged} change(s) detected. Took ${elapsed}s.`;
  },
});
