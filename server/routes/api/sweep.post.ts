import { defineEventHandler } from "h3";
import { requireAuth } from "./lib.js";
import { query } from "../../db/queries.js";
import { checkCompetitor } from "../../lib/check-utils.js";

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
    const result = await checkCompetitor(comp.id as string, email);
    configsChecked += result.configsChecked;
    signalsCreated += result.signalsCreated;
  }

  return { signalsCreated, configsChecked, competitorsChecked: competitors.length };
});
