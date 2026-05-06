import {
  IconSpy,
  IconRadar,
  IconBell,
  IconFileText,
  IconPlus,
  IconSettings,
  IconCode,
  IconRobot,
  IconWorldWww,
  IconCurrencyDollar,
  IconBrandGithub,
  IconUsers,
  IconRss,
  IconArrowRight,
  IconTerminal2,
  IconPuzzle,
  IconBrain,
  IconEye,
  IconFilter,
  IconChartBar,
} from "@tabler/icons-react";
import { useSetPageTitle } from "@/components/layout/HeaderActions";
import { Link } from "react-router";

export function meta() {
  return [
    { title: "Lighthouse — About" },
    { name: "description", content: "Learn about Lighthouse features and how to use them" },
  ];
}

function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`space-y-4 ${className}`}>{children}</section>;
}

function SectionTitle({ icon: Icon, children }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2.5 text-base font-semibold text-foreground">
      <Icon className="h-5 w-5 text-primary" />
      {children}
    </h2>
  );
}

function FeatureCard({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="text-sm text-muted-foreground leading-relaxed">{children}</div>
    </div>
  );
}

function StepCard({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0 mt-0.5">
        {number}
      </div>
      <div className="space-y-1 min-w-0">
        <h4 className="text-sm font-semibold">{title}</h4>
        <p className="text-sm text-muted-foreground leading-relaxed">{children}</p>
      </div>
    </div>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <code className="inline-block rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">
      {children}
    </code>
  );
}

function ActionRow({ name, description }: { name: string; description: string }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <code className="shrink-0 rounded bg-muted px-2 py-0.5 text-xs font-mono text-foreground mt-0.5">{name}</code>
      <span className="text-sm text-muted-foreground">{description}</span>
    </div>
  );
}

export default function AboutPage() {
  useSetPageTitle("About");

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        {/* Hero */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <IconSpy className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Lighthouse</h1>
              <p className="text-sm text-muted-foreground">Competitive intelligence that watches your market 24/7</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Lighthouse monitors your competitors across websites, pricing pages, GitHub repos, and hiring boards.
            When something changes, it surfaces the change as a signal and generates AI-powered briefings
            so you always know what your competition is up to.
          </p>
        </div>

        {/* Core Features */}
        <Section>
          <SectionTitle icon={IconEye}>Core Features</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FeatureCard icon={IconWorldWww} title="Website Monitoring">
              Track any competitor webpage for content changes. Lighthouse hashes page content and
              alerts you when something is different.
            </FeatureCard>
            <FeatureCard icon={IconCurrencyDollar} title="Pricing Tracking">
              Monitor pricing pages to catch plan changes, new tiers, or price adjustments
              before your customers do.
            </FeatureCard>
            <FeatureCard icon={IconBrandGithub} title="GitHub Releases">
              Watch GitHub repos for new releases. Get notified about version bumps,
              changelogs, and feature launches.
            </FeatureCard>
            <FeatureCard icon={IconUsers} title="Hiring Signals">
              Track careers pages to detect hiring surges. A competitor hiring 15 engineers
              often signals a big product push.
            </FeatureCard>
            <FeatureCard icon={IconRss} title="RSS Feeds">
              Subscribe to competitor blogs and news feeds. Content changes are tracked
              and surfaced as signals.
            </FeatureCard>
            <FeatureCard icon={IconFileText} title="AI Briefings">
              Generate daily or on-demand competitive intelligence briefings. Signals are grouped by
              priority, competitor, and type into an actionable summary.
            </FeatureCard>
          </div>
        </Section>

        {/* How to Use */}
        <Section>
          <SectionTitle icon={IconArrowRight}>Getting Started</SectionTitle>
          <div className="space-y-4">
            <StepCard number={1} title="Add a competitor">
              Go to the <Link to="/" className="text-primary hover:underline">Dashboard</Link> and
              click <strong>Add</strong>. Enter the competitor name and any URLs you want to
              monitor (website, pricing page, GitHub repo, hiring page). Watch configs are
              created automatically for each URL.
            </StepCard>
            <StepCard number={2} title="Run a sweep">
              Click <strong>Sweep</strong> to check all competitors at once. Lighthouse visits each
              monitored URL, detects content changes via hash comparison, and creates signals for
              anything new.
            </StepCard>
            <StepCard number={3} title="Review signals">
              Signals appear in the Dashboard feed, sorted by recency. Each signal has a severity
              (high, medium, low) and a type (pricing, content, GitHub, hiring). Click a signal
              to expand its details and see the raw diff.
            </StepCard>
            <StepCard number={4} title="Generate a briefing">
              Click <strong>Briefing</strong> to generate an AI-powered summary of recent signals.
              Briefings group changes by priority and competitor, highlighting what matters most.
              View past briefings on the <Link to="/briefings" className="text-primary hover:underline">Briefings</Link> page.
            </StepCard>
            <StepCard number={5} title="Manage watch configs">
              Click any competitor on the Dashboard to view their detail page. The
              <strong> Watch Configs</strong> tab lets you add, toggle, or remove individual monitored URLs.
            </StepCard>
          </div>
        </Section>

        {/* Signal Types */}
        <Section>
          <SectionTitle icon={IconBell}>Signal Types &amp; Severity</SectionTitle>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-2 font-medium">Type</th>
                  <th className="text-left px-4 py-2 font-medium">Source</th>
                  <th className="text-left px-4 py-2 font-medium hidden sm:table-cell">Example</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="px-4 py-2 font-medium">Pricing Change</td>
                  <td className="px-4 py-2 text-muted-foreground">Pricing pages</td>
                  <td className="px-4 py-2 text-muted-foreground hidden sm:table-cell">Plan price drops from $50 to $20/mo</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-medium">Content Change</td>
                  <td className="px-4 py-2 text-muted-foreground">Webpages, blogs</td>
                  <td className="px-4 py-2 text-muted-foreground hidden sm:table-cell">New feature announced on landing page</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-medium">GitHub Release</td>
                  <td className="px-4 py-2 text-muted-foreground">GitHub repos</td>
                  <td className="px-4 py-2 text-muted-foreground hidden sm:table-cell">v2.0.0 shipped with breaking changes</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-medium">Hiring Surge</td>
                  <td className="px-4 py-2 text-muted-foreground">Careers pages</td>
                  <td className="px-4 py-2 text-muted-foreground hidden sm:table-cell">15 new engineering roles posted</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted-foreground">
            Severity levels: <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500 inline-block" /> High</span> for
            pricing and major changes, <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500 inline-block" /> Medium</span> for
            notable updates, and <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" /> Low</span> for
            minor content shifts.
          </p>
        </Section>

        {/* Dashboard Filters */}
        <Section>
          <SectionTitle icon={IconFilter}>Filtering &amp; Navigation</SectionTitle>
          <div className="text-sm text-muted-foreground space-y-3 leading-relaxed">
            <p>
              The Dashboard signal feed supports multiple filters that combine together:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-1">
              <li><strong>Competitor pills</strong> &mdash; Click a competitor name to show only their signals. Click again to reset.</li>
              <li><strong>Type filter</strong> &mdash; Filter by signal type (Pricing, Content, GitHub, Hiring).</li>
              <li><strong>Severity filter</strong> &mdash; Filter by severity level (High, Medium, Low).</li>
              <li><strong>Mark All Read</strong> &mdash; Dismiss all unread signals at once.</li>
            </ul>
            <p>
              Click any signal to expand it and see the full summary and raw diff. Click a competitor
              name in the <Link to="/settings" className="text-primary hover:underline">Settings</Link> page to jump to their detail view.
            </p>
          </div>
        </Section>

        {/* Agent Chat */}
        <Section>
          <SectionTitle icon={IconRobot}>AI Agent Chat</SectionTitle>
          <div className="text-sm text-muted-foreground space-y-3 leading-relaxed">
            <p>
              The agent sidebar (right panel) is your AI-powered assistant. It can see what you're
              looking at and perform any action in the app. Try asking it:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                "What's new from our competitors?",
                "Add a competitor called Bolt",
                "Generate a briefing for the last 48 hours",
                "Check Lovable for updates",
                "Search for pricing signals this week",
                "What should I be worried about?",
              ].map((suggestion) => (
                <div key={suggestion} className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
                  <IconArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="text-xs">{suggestion}</span>
                </div>
              ))}
            </div>
            <p>
              The agent can also navigate the UI, add competitors, run sweeps, generate briefings,
              and search through signals &mdash; anything you can do in the UI, it can do via conversation.
            </p>
          </div>
        </Section>

        {/* Agent Actions (CLI) */}
        <Section>
          <SectionTitle icon={IconTerminal2}>Agent Actions (CLI)</SectionTitle>
          <div className="text-sm text-muted-foreground space-y-3 leading-relaxed">
            <p>
              Every operation in Lighthouse is backed by an agent action that can be run from the CLI.
              Actions are located in the <CodeBlock>actions/</CodeBlock> directory:
            </p>
            <div className="rounded-lg border border-border divide-y divide-border">
              <ActionRow name="add-competitor" description="Add a new competitor with optional URLs (website, pricing, GitHub, hiring). Auto-creates watch configs." />
              <ActionRow name="check-competitor" description="Check all watch configs for a single competitor. Scrapes URLs and creates signals for detected changes." />
              <ActionRow name="check-all-competitors" description="Full sweep across every active competitor. Runs checks in parallel with rate limiting." />
              <ActionRow name="generate-briefing" description="Generate an AI briefing from recent signals. Supports --hours flag (default 24)." />
              <ActionRow name="create-signal" description="Manually create a signal with custom title, type, severity, and URL." />
              <ActionRow name="search-signals" description="Search signals by query string, with optional competitor and date filters." />
              <ActionRow name="mark-read" description="Mark one or all signals as read." />
              <ActionRow name="scrape-url" description="Scrape a single URL and detect changes against the stored content hash." />
              <ActionRow name="delete-competitor" description="Soft-delete a competitor (deactivates monitoring, preserves signals)." />
              <ActionRow name="seed-demo" description="Populate demo data with sample competitors (Lovable, v0, Replit) and signals." />
              <ActionRow name="navigate" description="Navigate the UI to a specific view (dashboard, competitor, briefings, settings)." />
              <ActionRow name="view-screen" description="Get a snapshot of the current UI state and visible data." />
            </div>
            <p>
              Run any action via: <CodeBlock>cd templates/starter && pnpm action &lt;name&gt; [args]</CodeBlock>
            </p>
          </div>
        </Section>

        {/* Extending */}
        <Section>
          <SectionTitle icon={IconPuzzle}>Extending Lighthouse</SectionTitle>
          <div className="text-sm text-muted-foreground space-y-4 leading-relaxed">
            <p>
              Lighthouse is built on the <strong>@agent-native/core</strong> framework. The agent and UI
              share state through a SQL database, making it straightforward to add new features.
            </p>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Add new watch types</h4>
              <p>
                Create a new watch type by adding a case to the check-competitor action's scrape logic.
                The <CodeBlock>watch_configs</CodeBlock> table supports a <CodeBlock>watch_type</CodeBlock> field
                that can be any string. Add your scraping logic, and signals will flow through the existing UI.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Add notification channels</h4>
              <p>
                Set the <CodeBlock>SLACK_WEBHOOK_URL</CodeBlock> env var to post signals to Slack.
                You can extend this pattern with email, Discord, or any webhook-based service by
                adding a notification step to the check-competitor action.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Schedule automated sweeps</h4>
              <p>
                Use the agent's scheduling capabilities to run <CodeBlock>check-all-competitors</CodeBlock> on
                a cron schedule. This turns Lighthouse into a fully automated monitoring system that
                generates briefings without manual intervention.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Custom signal analysis</h4>
              <p>
                The <CodeBlock>generate-briefing</CodeBlock> action uses AI to analyze signals. You can
                customize the prompt or add new analysis actions that compare signals across time
                periods, identify trends, or generate competitive strategy recommendations.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Add new pages &amp; skills</h4>
              <p>
                To add a new feature, follow the checklist in <CodeBlock>CLAUDE.md</CodeBlock>:
                add route files under <CodeBlock>app/routes/</CodeBlock>, create corresponding agent
                actions, write a skill doc in <CodeBlock>.agents/skills/</CodeBlock>, and update
                the navigation state tracking.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Use a scraping proxy</h4>
              <p>
                Set <CodeBlock>SCRAPE_PROXY_URL</CodeBlock> to route all scraping through a proxy
                service. This helps avoid rate limiting and IP blocks when monitoring many competitors.
              </p>
            </div>
          </div>
        </Section>

        {/* Environment */}
        <Section>
          <SectionTitle icon={IconSettings}>Environment Variables</SectionTitle>
          <div className="rounded-lg border border-border divide-y divide-border">
            <div className="flex items-start gap-3 px-4 py-3">
              <code className="shrink-0 rounded bg-muted px-2 py-0.5 text-xs font-mono mt-0.5">DATABASE_URL</code>
              <div>
                <span className="text-sm text-muted-foreground">SQLite database path.</span>
                <span className="ml-1.5 text-xs text-red-500 font-medium">Required</span>
              </div>
            </div>
            <div className="flex items-start gap-3 px-4 py-3">
              <code className="shrink-0 rounded bg-muted px-2 py-0.5 text-xs font-mono mt-0.5">ANTHROPIC_API_KEY</code>
              <div>
                <span className="text-sm text-muted-foreground">API key for AI briefing generation.</span>
                <span className="ml-1.5 text-xs text-red-500 font-medium">Required</span>
              </div>
            </div>
            <div className="flex items-start gap-3 px-4 py-3">
              <code className="shrink-0 rounded bg-muted px-2 py-0.5 text-xs font-mono mt-0.5">SLACK_WEBHOOK_URL</code>
              <div>
                <span className="text-sm text-muted-foreground">Post signals to a Slack channel.</span>
                <span className="ml-1.5 text-xs text-muted-foreground/60 font-medium">Optional</span>
              </div>
            </div>
            <div className="flex items-start gap-3 px-4 py-3">
              <code className="shrink-0 rounded bg-muted px-2 py-0.5 text-xs font-mono mt-0.5">SCRAPE_PROXY_URL</code>
              <div>
                <span className="text-sm text-muted-foreground">Proxy for outbound scraping requests.</span>
                <span className="ml-1.5 text-xs text-muted-foreground/60 font-medium">Optional</span>
              </div>
            </div>
            <div className="flex items-start gap-3 px-4 py-3">
              <code className="shrink-0 rounded bg-muted px-2 py-0.5 text-xs font-mono mt-0.5">SEED_DEMO_DATA</code>
              <div>
                <span className="text-sm text-muted-foreground">Set to "true" to auto-seed demo competitors on startup.</span>
                <span className="ml-1.5 text-xs text-muted-foreground/60 font-medium">Optional</span>
              </div>
            </div>
          </div>
        </Section>

        {/* Data Model */}
        <Section>
          <SectionTitle icon={IconChartBar}>Data Model</SectionTitle>
          <div className="text-sm text-muted-foreground space-y-3 leading-relaxed">
            <p>Lighthouse stores data across four core tables:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-lg border border-border p-3 space-y-1">
                <h4 className="text-sm font-semibold text-foreground">competitors</h4>
                <p className="text-xs">Companies being tracked. Fields include name, slug, website/pricing/GitHub/hiring URLs, and active status.</p>
              </div>
              <div className="rounded-lg border border-border p-3 space-y-1">
                <h4 className="text-sm font-semibold text-foreground">watch_configs</h4>
                <p className="text-xs">Individual URLs to monitor per competitor. Each has a type, URL, content hash, check interval, and enabled toggle.</p>
              </div>
              <div className="rounded-lg border border-border p-3 space-y-1">
                <h4 className="text-sm font-semibold text-foreground">signals</h4>
                <p className="text-xs">Detected changes. Each signal has a type, severity, title, summary, optional raw diff, and read status.</p>
              </div>
              <div className="rounded-lg border border-border p-3 space-y-1">
                <h4 className="text-sm font-semibold text-foreground">briefings</h4>
                <p className="text-xs">AI-generated reports. Contain markdown content, the signal IDs they cover, and the time period analyzed.</p>
              </div>
            </div>
            <p>
              All data is scoped by <CodeBlock>owner_email</CodeBlock> for multi-tenant isolation.
              Use <CodeBlock>db-query</CodeBlock> and <CodeBlock>db-exec</CodeBlock> actions for direct SQL access.
            </p>
          </div>
        </Section>

        {/* Footer spacer */}
        <div className="h-8" />
      </div>
    </div>
  );
}
