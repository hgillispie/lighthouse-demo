---
name: interpret-signals
description: >-
  How to group and interpret competitive signals. Use when answering questions
  about competitor moves, trends, or strategic implications.
---

# Interpret Signals

## Signal types and what they mean

| Type | What changed | Strategic implication |
|---|---|---|
| `pricing_change` | Pricing page content differs | New plan, price adjustment, or packaging change. Always high severity. |
| `content_change` | Website/feature page content differs | New features, messaging shifts, positioning changes. |
| `github_release` | New GitHub release tag | Technical progress indicator. Check what was shipped. |
| `hiring_surge` | Careers page content changed significantly | Growth signal. What roles are they hiring for? |
| `manual` | Agent or user created manually | Context-dependent. Read the title and summary. |

## Grouping signals

When answering "what's new" or "what changed":

1. Group by competitor first.
2. Within each competitor, order by severity (high → medium → low).
3. Highlight patterns across competitors (e.g., "two competitors changed pricing this week — could signal a market-wide trend").

## The "so what" rule

Every answer about signals should include a "so what" for the user's product roadmap and positioning:

- **Pricing changes**: How does this affect your pricing positioning?
- **Feature launches**: Do you have this? Should you? How does this change the competitive landscape?
- **Hiring surges**: What capabilities are they building? Does this signal a strategic shift?
- **Content changes**: Are they repositioning? Targeting a new segment?

## Answering common questions

- **"What has X changed in the last N days?"** → `search-signals --competitorSlug x --days N`
- **"What's new?"** → `view-screen` (unread signals from dashboard)
- **"Compare X and Y"** → Search signals for both, group by type, identify patterns
- **"Should we be worried about X?"** → Aggregate recent signals, assess severity, provide strategic recommendation
