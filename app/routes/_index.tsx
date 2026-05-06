import { useState } from "react";
import { useNavigate } from "react-router";
import {
  IconRadar,
  IconFileText,
  IconExternalLink,
  IconCheck,
  IconPlus,
  IconCircleFilled,
} from "@tabler/icons-react";
import { useSetPageTitle } from "@/components/layout/HeaderActions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  useCompetitors,
  useSignals,
  useRunSweep,
  useGenerateBriefing,
  useMarkAllRead,
  useCreateCompetitor,
  type Signal,
} from "@/hooks/use-api";
import { toast } from "sonner";

function timeAgo(unix: number): string {
  const seconds = Math.floor(Date.now() / 1000 - unix);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

const severityColor: Record<string, string> = {
  high: "text-red-500",
  medium: "text-amber-500",
  low: "text-emerald-500",
};

const severityBg: Record<string, string> = {
  high: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  medium: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  low: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
};

const typeLabel: Record<string, string> = {
  pricing_change: "Pricing",
  content_change: "Content",
  github_release: "GitHub",
  hiring_surge: "Hiring",
  manual: "Manual",
};

function SignalCard({ signal, expanded, onToggle }: { signal: Signal; expanded: boolean; onToggle: () => void }) {
  return (
    <div
      className="group border-b border-border last:border-0 px-4 py-3 cursor-pointer hover:bg-accent/30 transition-colors"
      onClick={onToggle}
    >
      <div className="flex items-start gap-3">
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold uppercase">
          {(signal.competitor_name || "?")[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <IconCircleFilled className={`h-2.5 w-2.5 shrink-0 ${severityColor[signal.severity] || severityColor.medium}`} />
            <span className="text-sm font-medium truncate">{signal.title}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{signal.competitor_name}</span>
            <span>&middot;</span>
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${severityBg[signal.severity] || ""}`}>
              {typeLabel[signal.signal_type] || signal.signal_type}
            </Badge>
            <span>&middot;</span>
            <span>{timeAgo(signal.detected_at)}</span>
            {signal.url && (
              <a
                href={signal.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="hover:text-foreground"
              >
                <IconExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          {signal.summary && !expanded && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{signal.summary}</p>
          )}
        </div>
      </div>
      {expanded && (
        <div className="mt-3 ml-11 space-y-2">
          {signal.summary && <p className="text-sm text-muted-foreground">{signal.summary}</p>}
          {signal.raw_diff && (
            <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto whitespace-pre-wrap font-mono">
              {signal.raw_diff}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
      <svg
        viewBox="0 0 64 80"
        className="h-20 w-16 text-muted-foreground/40 mb-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="22" y="16" width="20" height="52" rx="2" />
        <rect x="18" y="48" width="28" height="20" rx="2" />
        <line x1="32" y1="10" x2="32" y2="16" />
        <circle cx="32" cy="6" r="4" />
        <line x1="32" y1="2" x2="48" y2="2" strokeWidth="3" />
        <line x1="32" y1="6" x2="52" y2="0" strokeWidth="2" opacity="0.5" />
        <line x1="32" y1="6" x2="50" y2="8" strokeWidth="2" opacity="0.3" />
      </svg>
      <h2 className="text-xl font-semibold mb-2">Start tracking your competitors</h2>
      <p className="text-sm text-muted-foreground max-w-md mb-6">
        Lighthouse monitors websites, pricing pages, GitHub releases, and hiring boards.
        Add a competitor to begin.
      </p>
      <Button onClick={onAdd}>
        <IconPlus className="h-4 w-4" />
        Add Your First Competitor
      </Button>
    </div>
  );
}

function AddCompetitorDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createCompetitor = useCreateCompetitor();
  const navigate = useNavigate();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createCompetitor.mutate(
      {
        name: fd.get("name") as string,
        websiteUrl: (fd.get("websiteUrl") as string) || undefined,
        pricingUrl: (fd.get("pricingUrl") as string) || undefined,
        githubRepo: (fd.get("githubRepo") as string) || undefined,
        hiringUrl: (fd.get("hiringUrl") as string) || undefined,
      },
      {
        onSuccess: (data: any) => {
          toast.success(`Added ${fd.get("name")}`);
          onClose();
          navigate(`/competitors/${data.slug}`);
        },
        onError: () => toast.error("Failed to create competitor"),
      },
    );
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Add Competitor</SheetTitle>
          <SheetDescription>Track a new competitor's online presence.</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4 px-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input id="name" name="name" required placeholder="e.g. Acme" />
          </div>
          <div>
            <Label htmlFor="websiteUrl">Website URL</Label>
            <Input id="websiteUrl" name="websiteUrl" placeholder="https://acme.com" />
          </div>
          <div>
            <Label htmlFor="pricingUrl">Pricing Page</Label>
            <Input id="pricingUrl" name="pricingUrl" placeholder="https://acme.com/pricing" />
          </div>
          <div>
            <Label htmlFor="githubRepo">GitHub Repo</Label>
            <Input id="githubRepo" name="githubRepo" placeholder="org/repo" />
          </div>
          <div>
            <Label htmlFor="hiringUrl">Hiring Page</Label>
            <Input id="hiringUrl" name="hiringUrl" placeholder="https://acme.com/careers" />
          </div>
          <Button type="submit" className="w-full" disabled={createCompetitor.isPending}>
            {createCompetitor.isPending ? <Spinner className="h-4 w-4" /> : "Add Competitor"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export function meta() {
  return [
    { title: "Lighthouse — Dashboard" },
    { name: "description", content: "Competitive intelligence dashboard" },
  ];
}

export default function DashboardPage() {
  useSetPageTitle("Dashboard");
  const { data: competitors = [], isLoading: loadingCompetitors } = useCompetitors();
  const { data: allSignals = [], isLoading: loadingSignals } = useSignals();
  const unreadSignals = allSignals.filter((s) => !s.is_read);

  const sweep = useRunSweep();
  const genBriefing = useGenerateBriefing();
  const markAllRead = useMarkAllRead();
  const navigate = useNavigate();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [expandedSignal, setExpandedSignal] = useState<string | null>(null);
  const [competitorFilter, setCompetitorFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);

  if (loadingCompetitors) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner className="h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  if (competitors.length === 0) {
    return (
      <>
        <EmptyState onAdd={() => setDrawerOpen(true)} />
        <AddCompetitorDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      </>
    );
  }

  let filteredSignals = allSignals;
  if (competitorFilter) filteredSignals = filteredSignals.filter((s) => s.competitor_id === competitorFilter);
  if (typeFilter) filteredSignals = filteredSignals.filter((s) => s.signal_type === typeFilter);
  if (severityFilter) filteredSignals = filteredSignals.filter((s) => s.severity === severityFilter);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Signal Feed */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2 mr-auto">
            <h2 className="text-sm font-semibold whitespace-nowrap">Signal Feed</h2>
            {unreadSignals.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unreadSignals.length} unread
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => sweep.mutate(undefined, {
                onSuccess: (data) => toast.success(`Sweep complete — ${data.signalsCreated} new signal(s)`),
                onError: () => toast.error("Sweep failed"),
              })}
              disabled={sweep.isPending}
            >
              {sweep.isPending ? <Spinner className="h-3.5 w-3.5" /> : <IconRadar className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">Sweep</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => genBriefing.mutate(undefined, {
                onSuccess: (data) => {
                  if (data.briefingId) {
                    toast.success("Briefing generated");
                    navigate(`/briefings?id=${data.briefingId}`);
                  } else {
                    toast.info("No signals to brief");
                  }
                },
                onError: () => toast.error("Briefing generation failed"),
              })}
              disabled={genBriefing.isPending}
            >
              {genBriefing.isPending ? <Spinner className="h-3.5 w-3.5" /> : <IconFileText className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">Briefing</span>
            </Button>
            <Button variant="outline" size="sm" className="shrink-0" onClick={() => setDrawerOpen(true)}>
              <IconPlus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Add</span>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border overflow-x-auto shrink-0 scrollbar-none">
          <button
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors shrink-0 ${!competitorFilter ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"}`}
            onClick={() => setCompetitorFilter(null)}
          >
            All
          </button>
          {competitors.map((c) => (
            <button
              key={c.id}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors whitespace-nowrap shrink-0 ${competitorFilter === c.id ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"}`}
              onClick={() => setCompetitorFilter(competitorFilter === c.id ? null : c.id)}
            >
              {c.name}
            </button>
          ))}
          <div className="w-px h-4 bg-border mx-1 shrink-0" />
          <select
            className="text-xs border border-border rounded-md px-2 py-1 bg-background shrink-0"
            value={typeFilter || ""}
            onChange={(e) => setTypeFilter(e.target.value || null)}
          >
            <option value="">All Types</option>
            <option value="pricing_change">Pricing</option>
            <option value="content_change">Content</option>
            <option value="github_release">GitHub</option>
            <option value="hiring_surge">Hiring</option>
          </select>
          <select
            className="text-xs border border-border rounded-md px-2 py-1 bg-background shrink-0"
            value={severityFilter || ""}
            onChange={(e) => setSeverityFilter(e.target.value || null)}
          >
            <option value="">All Severity</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          {unreadSignals.length > 0 && (
            <>
              <div className="flex-1" />
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-6 shrink-0"
                onClick={() => markAllRead.mutate(undefined, {
                  onSuccess: () => toast.success("All signals marked as read"),
                })}
              >
                <IconCheck className="h-3 w-3" />
                Mark All Read
              </Button>
            </>
          )}
        </div>

        {/* Signal list */}
        <div className="flex-1 overflow-y-auto">
          {filteredSignals.length === 0 ? (
            <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
              No signals found
            </div>
          ) : (
            filteredSignals.map((signal) => (
              <SignalCard
                key={signal.id}
                signal={signal}
                expanded={expandedSignal === signal.id}
                onToggle={() => setExpandedSignal(expandedSignal === signal.id ? null : signal.id)}
              />
            ))
          )}
        </div>
      </div>

      <AddCompetitorDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
