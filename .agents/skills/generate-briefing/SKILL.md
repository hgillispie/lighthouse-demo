---
name: generate-briefing
description: >-
  How to generate competitive intelligence briefings. Use when the user asks
  for a briefing, summary, or report on competitor activity.
---

# Generate Briefing

## Flow

1. Call the action: `generate-briefing --hours 24` (or customize the hours window)
2. Navigate to the briefing: `navigate --view briefings --briefingId <id>`
3. Summarize the key takeaways for the user

## The `--hours` param

- Default: 24 hours (last day)
- For weekly summaries: `--hours 168`
- For "what happened this morning": `--hours 8`

## What makes a good briefing

The generated briefing follows this structure:

1. **Summary**: headline count of signals and competitors
2. **High Priority**: pricing changes and major product launches — these demand immediate attention
3. **Medium Priority**: feature updates, hiring surges, GitHub releases
4. **Low / FYI**: minor content changes
5. **What to Watch**: per-competitor focus areas going forward

When presenting a briefing to the user, lead with the most impactful finding:
- "Competitor X restructured their pricing — this directly affects how you're positioned."
- "Competitor Y is hiring aggressively in AI infra — expect capability acceleration in 2-3 months."

## Offering Slack delivery

If `SLACK_WEBHOOK_URL` is configured, offer to send the briefing to Slack after generating it. This isn't implemented yet — flag it as a future feature.

## Recurring briefings

The morning briefing job runs at 7am weekdays. If the user asks about scheduling, point them to `.agents/jobs/morning-briefing.md`.
