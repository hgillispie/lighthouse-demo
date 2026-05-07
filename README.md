# Lighthouse

Competitive intelligence that runs 24/7. Lighthouse monitors competitor websites, pricing pages, GitHub releases, and hiring boards — detecting changes automatically and surfacing them as actionable signals in a live feed with AI-generated briefings.

Built on [@agent-native/core](https://www.agent-native.com).

## Quickstart

```bash

pnpm install && pnpm dev
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Database connection string (auto-configured in dev) |
| `LLM_API_KEY` | Yes | API key for the AI agent (configure via the Setup tab) |
| `SEED_DEMO_DATA` | No | Set to `true` to auto-seed sample competitors on first boot |
| `SLACK_WEBHOOK_URL` | No | Slack incoming webhook for alert delivery |
| `SCRAPE_PROXY_URL` | No | Proxy URL for scraping (useful for avoiding rate limits) |

## Adding Competitors

**Via the UI:**
Click **Add** on the Dashboard and fill in the competitor name and URLs. Watch configs and an initial scan are created automatically.

**Via CLI:**
```bash
pnpm action add-competitor --name "Acme" --website "https://acme.com" --pricing "https://acme.com/pricing" --github "acme/acme-repo" --hiring "https://acme.com/careers"
```

**Via agent chat:**
> "Add a competitor called Acme — their website is acme.com"

The agent will look up missing URLs and create watch configs for each.

## How Sweeps Work

- **Schedule**: Every 4 hours via the recurring job in `.agents/jobs/competitor-sweep.md`
- **What it does**: Fetches each watched URL, strips HTML to plain text, computes a SHA-256 hash, and compares to the last known hash
- **Rate limiting**: 1.5-second delay between URL fetches to avoid triggering rate limits
- **On change**: Creates a signal with auto-inferred type and severity
- **On error**: Logs the error to the watch config's `last_content_snippet` field without creating a false-positive signal

Trigger a manual sweep anytime via the **Sweep** button on the dashboard or `pnpm action check-all-competitors`.

## Customizing Watch Intervals

Each watch config has a `check_interval_hours` field (default: 4). Change it via:
- The Watch Configs tab on a competitor's detail page
- Asking the agent: "Change the check interval for Acme's pricing page to 1 hour"

## Extending

- **New watch types**: Add scraping logic for new source types (RSS, social media, SEC filings)
- **Notification channels**: Wire `SLACK_WEBHOOK_URL` for Slack alerts, or add email/Discord/webhook
- **Custom analysis**: Customize the briefing prompt or add trend-detection actions
- **New pages & skills**: Follow the checklist in `AGENTS.md` to add routes, actions, and agent skills

See the [About page](/about) in the running app for full documentation.
