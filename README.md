# Lighthouse

Competitive intelligence that runs 24/7. Lighthouse monitors competitor websites, pricing pages, GitHub releases, and hiring boards — detecting changes automatically and surfacing them as actionable signals in a live feed with AI-generated briefings.

## Quickstart

```bash
npx @agent-native/core create lighthouse --template starter --standalone
cd lighthouse
pnpm install && pnpm dev
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Database connection string (auto-configured in dev) |
| `ANTHROPIC_API_KEY` | Yes | API key for the AI agent |
| `SEED_DEMO_DATA` | No | Set to `true` to seed Lovable, v0, and Replit as demo competitors |
| `SLACK_WEBHOOK_URL` | No | Slack incoming webhook for alert delivery |
| `SCRAPE_PROXY_URL` | No | Proxy URL for scraping (useful for avoiding rate limits) |

## Adding Competitors

**Via CLI:**
```bash
pnpm action add-competitor --name "Acme" --website "https://acme.com" --pricing "https://acme.com/pricing" --github "acme/acme-repo" --hiring "https://acme.com/careers"
```

**Via agent chat:**
> "Add a competitor called Bolt — their website is bolt.new"

The agent will look up missing URLs and create watch configs for each.

## How Sweeps Work

- **Schedule**: Every 4 hours via the recurring job in `.agents/jobs/competitor-sweep.md`
- **What it does**: Fetches each watched URL, strips HTML to plain text, computes a SHA-256 hash, and compares to the last known hash
- **Rate limiting**: 1.5-second delay between URL fetches to avoid triggering rate limits
- **On change**: Creates a signal with auto-inferred type and severity
- **On error**: Logs the error to the watch config's `last_content_snippet` field without creating a false-positive signal

Trigger a manual sweep anytime via the "Run Sweep" button on the dashboard or `pnpm action check-all-competitors`.

## Customizing Watch Intervals

Each watch config has a `check_interval_hours` field (default: 4). Change it via:
- The Watch Configs tab on a competitor's detail page
- Asking the agent: "Change the check interval for Lovable's pricing page to 1 hour"

## Forking for Your Own Company

1. **Replace competitors**: Remove the demo seed data and add your own competitors via the UI or CLI
2. **Update AGENTS.md context**: Change references from "Builder's Fusion" to your product in `.agents/AGENTS.md` and the interpret-signals skill
3. **Adjust briefing framing**: Edit the "What to Watch" section template in `actions/generate-briefing.ts` to reference your competitors
4. **Configure environment**: Set `SLACK_WEBHOOK_URL` for alerts, `SCRAPE_PROXY_URL` if needed
