import { defineAction } from "@agent-native/core";
import { getRequestUserEmail } from "@agent-native/core/server";
import { z } from "zod";
import { checkCompetitor } from "../server/lib/check-utils.js";

export default defineAction({
  description:
    "Check all watch configs for a competitor, scrape URLs, and create signals for changes.",
  schema: z.object({
    competitorId: z.string().describe("Competitor ID to check"),
  }),
  http: false,
  run: async (args) => {
    const email = getRequestUserEmail();
    if (!email) return "Error: Not authenticated";

    const result = await checkCompetitor(args.competitorId, email);

    if (result.errors.length > 0 && result.configsChecked === 0) {
      return `Error: ${result.errors[0]}`;
    }

    let msg = `Checked ${result.configsChecked} config(s). ${result.signalsCreated} change(s) detected.`;
    if (result.errors.length > 0) {
      msg += ` Errors: ${result.errors.join("; ")}`;
    }
    return msg;
  },
});
