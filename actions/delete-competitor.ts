import { defineAction } from "@agent-native/core";
import { getRequestUserEmail } from "@agent-native/core/server";
import { z } from "zod";
import { exec } from "../server/db/queries.js";

export default defineAction({
  description: "Soft-delete a competitor by deactivating it and its watch configs.",
  schema: z.object({
    competitorId: z.string().describe("Competitor ID to delete"),
  }),
  http: false,
  run: async (args) => {
    const email = getRequestUserEmail();
    if (!email) return "Error: Not authenticated";

    await exec(
      `UPDATE competitors SET is_active = 0 WHERE id = ? AND owner_email = ?`,
      [args.competitorId, email],
    );

    await exec(
      `UPDATE watch_configs SET is_enabled = 0 WHERE competitor_id = ? AND owner_email = ?`,
      [args.competitorId, email],
    );

    return `Deactivated competitor ${args.competitorId} and its watch configs.`;
  },
});
