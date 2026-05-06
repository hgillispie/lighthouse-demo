import { defineAction } from "@agent-native/core";
import { getRequestUserEmail } from "@agent-native/core/server";
import { z } from "zod";
import { exec } from "../server/db/queries.js";

export default defineAction({
  description: "Mark one signal or all signals as read.",
  schema: z.object({
    signalId: z.string().optional().describe("Signal ID to mark read"),
    all: z
      .boolean()
      .optional()
      .describe("Mark all signals as read"),
  }),
  http: false,
  run: async (args) => {
    const email = getRequestUserEmail();
    if (!email) return "Error: Not authenticated";

    if (args.all) {
      const result = await exec(
        `UPDATE signals SET is_read = 1 WHERE owner_email = ? AND is_read = 0`,
        [email],
      );
      return `Marked ${result.rowsAffected} signal(s) as read.`;
    }

    if (args.signalId) {
      await exec(
        `UPDATE signals SET is_read = 1 WHERE id = ? AND owner_email = ?`,
        [args.signalId, email],
      );
      return `Marked signal ${args.signalId} as read.`;
    }

    return "Error: Provide --signalId or --all";
  },
});
