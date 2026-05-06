import { useState } from "react";
import { useParams, Link } from "react-router";
import {
  IconArrowLeft,
  IconExternalLink,
  IconCircleFilled,
  IconPlus,
  IconTrash,
  IconWorld,
} from "@tabler/icons-react";
import { useSetPageTitle } from "@/components/layout/HeaderActions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useCompetitors,
  useSignals,
  useCreateWatchConfig,
  useToggleWatchConfig,
  useDeleteWatchConfig,
  type Competitor,
  type WatchConfig,
  type Signal,
} from "@/hooks/use-api";
import { agentNativePath } from "@agent-native/core/client";
import { useQuery } from "@tanstack/react-query";
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

const typeLabel: Record<string, string> = {
  pricing_change: "Pricing",
  content_change: "Content",
  github_release: "GitHub",
  hiring_surge: "Hiring",
  manual: "Manual",
  webpage: "Webpage",
  pricing: "Pricing",
  github_releases: "GitHub",
  hiring: "Hiring",
  rss: "RSS",
};

const typeBadgeColor: Record<string, string> = {
  webpage: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  pricing: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  github_releases: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
  hiring: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  rss: "bg-teal-500/10 text-teal-700 dark:text-teal-400",
};

export function meta() {
  return [{ title: "Lighthouse — Competitor" }];
}

export default function CompetitorDetailPage() {
  const { slug } = useParams();
  const { data: competitors = [] } = useCompetitors();
  const competitor = competitors.find((c) => c.slug === slug);

  useSetPageTitle(
    <div className="flex items-center gap-2">
      <Link to="/" className="text-muted-foreground hover:text-foreground">
        <IconArrowLeft className="h-4 w-4" />
      </Link>
      <span className="text-lg font-semibold">{competitor?.name || slug}</span>
      {competitor?.website_url && (
        <a
          href={competitor.website_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground"
        >
          <IconExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </div>,
  );

  const competitorId = competitor?.id;

  const { data: detailData } = useQuery<Competitor & { watchConfigs: WatchConfig[] }>({
    queryKey: ["competitor-detail", competitorId],
    queryFn: async () => {
      const res = await fetch(agentNativePath(`/api/competitors/${competitorId}`));
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    enabled: !!competitorId,
    refetchInterval: 5_000,
  });

  const { data: signals = [] } = useSignals(
    competitorId ? { competitorId } : undefined,
  );

  const watchConfigs = detailData?.watchConfigs || [];

  if (!competitor) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner className="h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <Tabs defaultValue="signals" className="flex flex-col h-full">
        <div className="border-b border-border px-4 shrink-0">
          <TabsList className="bg-transparent h-10 p-0 gap-4">
            <TabsTrigger
              value="signals"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-2"
            >
              Signals ({signals.length})
            </TabsTrigger>
            <TabsTrigger
              value="watch-configs"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-2"
            >
              Watch Configs ({watchConfigs.length})
            </TabsTrigger>
            <TabsTrigger
              value="info"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-2"
            >
              Info
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="signals" className="flex-1 overflow-y-auto mt-0">
          <SignalsTab signals={signals} />
        </TabsContent>

        <TabsContent value="watch-configs" className="flex-1 overflow-y-auto mt-0">
          <WatchConfigsTab watchConfigs={watchConfigs} competitorId={competitor.id} />
        </TabsContent>

        <TabsContent value="info" className="flex-1 overflow-y-auto mt-0">
          <InfoTab competitor={competitor} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SignalsTab({ signals }: { signals: Signal[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (signals.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
        No signals yet. Run a sweep to check for changes.
      </div>
    );
  }

  return (
    <div>
      {signals.map((signal) => (
        <div
          key={signal.id}
          className="border-b border-border px-4 py-3 cursor-pointer hover:bg-accent/30 transition-colors"
          onClick={() => setExpanded(expanded === signal.id ? null : signal.id)}
        >
          <div className="flex items-start gap-3">
            <IconCircleFilled className={`h-2.5 w-2.5 mt-1.5 shrink-0 ${severityColor[signal.severity] || severityColor.medium}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{signal.title}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                <span>{typeLabel[signal.signal_type] || signal.signal_type}</span>
                <span>&middot;</span>
                <span>{timeAgo(signal.detected_at)}</span>
                {signal.url && (
                  <a href={signal.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="hover:text-foreground">
                    <IconExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              {expanded === signal.id && signal.summary && (
                <p className="text-sm text-muted-foreground mt-2">{signal.summary}</p>
              )}
              {expanded === signal.id && signal.raw_diff && (
                <pre className="text-xs bg-muted p-3 rounded-md mt-2 overflow-x-auto whitespace-pre-wrap font-mono">
                  {signal.raw_diff}
                </pre>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function WatchConfigsTab({ watchConfigs, competitorId }: { watchConfigs: WatchConfig[]; competitorId: string }) {
  const [showAdd, setShowAdd] = useState(false);
  const createWc = useCreateWatchConfig();
  const toggleWc = useToggleWatchConfig();
  const deleteWc = useDeleteWatchConfig();

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createWc.mutate(
      {
        competitorId,
        watchType: fd.get("watchType") as string,
        url: fd.get("url") as string,
        label: fd.get("label") as string,
      },
      {
        onSuccess: () => {
          toast.success("Watch config added");
          setShowAdd(false);
        },
      },
    );
  }

  return (
    <div className="p-3 sm:p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Monitored URLs</h3>
        <Button variant="outline" size="sm" onClick={() => setShowAdd(!showAdd)}>
          <IconPlus className="h-3.5 w-3.5" />
          Add URL
        </Button>
      </div>

      {showAdd && (
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleAdd} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Label</Label>
                  <Input name="label" required placeholder="e.g. Blog" className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">URL</Label>
                  <Input name="url" required placeholder="https://..." className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Type</Label>
                  <select name="watchType" className="flex h-8 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="webpage">Webpage</option>
                    <option value="pricing">Pricing</option>
                    <option value="github_releases">GitHub Releases</option>
                    <option value="hiring">Hiring</option>
                    <option value="rss">RSS</option>
                  </select>
                </div>
              </div>
              <Button type="submit" size="sm" disabled={createWc.isPending}>
                {createWc.isPending ? <Spinner className="h-3 w-3" /> : "Add"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {watchConfigs.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-10">No watch configs yet.</p>
      ) : (
        <div className="border rounded-lg divide-y divide-border">
          {watchConfigs.map((wc) => (
            <div key={wc.id} className="flex items-center gap-3 px-3 sm:px-4 py-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{wc.label}</span>
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 shrink-0 ${typeBadgeColor[wc.watch_type] || ""}`}>
                    {typeLabel[wc.watch_type] || wc.watch_type}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <a href={wc.url} target="_blank" rel="noopener noreferrer" className="hover:text-foreground truncate">
                    {wc.url}
                  </a>
                  {wc.last_checked_at && (
                    <>
                      <span>&middot;</span>
                      <span>Checked {timeAgo(wc.last_checked_at)}</span>
                    </>
                  )}
                </div>
              </div>
              <Switch
                checked={!!wc.is_enabled}
                onCheckedChange={(checked) => toggleWc.mutate({ id: wc.id, enabled: checked })}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => deleteWc.mutate(wc.id, { onSuccess: () => toast.success("Deleted") })}
              >
                <IconTrash className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InfoTab({ competitor }: { competitor: Competitor }) {
  return (
    <div className="p-3 sm:p-4 space-y-4">
      <div>
        <Label className="text-xs text-muted-foreground">Name</Label>
        <p className="text-sm font-medium">{competitor.name}</p>
      </div>
      {competitor.description && (
        <div>
          <Label className="text-xs text-muted-foreground">Description</Label>
          <p className="text-sm">{competitor.description}</p>
        </div>
      )}
      {competitor.website_url && (
        <div>
          <Label className="text-xs text-muted-foreground">Website</Label>
          <a href={competitor.website_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
            {competitor.website_url} <IconExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
      {competitor.pricing_url && (
        <div>
          <Label className="text-xs text-muted-foreground">Pricing Page</Label>
          <a href={competitor.pricing_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
            {competitor.pricing_url} <IconExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
      {competitor.github_repo && (
        <div>
          <Label className="text-xs text-muted-foreground">GitHub Repo</Label>
          <a href={`https://github.com/${competitor.github_repo}`} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
            {competitor.github_repo} <IconExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
      {competitor.hiring_url && (
        <div>
          <Label className="text-xs text-muted-foreground">Hiring Page</Label>
          <a href={competitor.hiring_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
            {competitor.hiring_url} <IconExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
      <div className="text-xs text-muted-foreground pt-2 border-t border-border">
        Added {new Date(competitor.created_at * 1000).toLocaleDateString()}
      </div>
    </div>
  );
}
