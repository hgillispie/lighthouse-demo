import { defineAction } from "@agent-native/core";
import { z } from "zod";
import { writeAppState } from "@agent-native/core/application-state";

export default defineAction({
  description:
    "Navigate the UI to a specific view. Writes a navigate command that the UI reads and auto-deletes.",
  schema: z.object({
    view: z
      .enum(["dashboard", "competitor", "briefings", "settings"])
      .optional()
      .describe("View name"),
    competitorSlug: z.string().optional().describe("Competitor slug for competitor view"),
    briefingId: z.string().optional().describe("Briefing ID for briefings view"),
    signalId: z.string().optional().describe("Signal ID to highlight"),
    path: z.string().optional().describe("URL path to navigate to directly"),
  }),
  http: false,
  run: async (args) => {
    if (!args.view && !args.path) {
      return "Error: At least --view or --path is required.";
    }

    const nav: Record<string, string> = {};
    if (args.path) {
      nav.path = args.path;
    } else if (args.view === "competitor" && args.competitorSlug) {
      nav.path = `/competitors/${args.competitorSlug}`;
    } else if (args.view === "briefings") {
      nav.path = args.briefingId ? `/briefings?id=${args.briefingId}` : "/briefings";
    } else if (args.view === "settings") {
      nav.path = "/settings";
    } else {
      nav.path = "/";
    }
    nav.view = args.view || "dashboard";

    await writeAppState("navigate", nav);
    return `Navigating to ${nav.path}`;
  },
});
