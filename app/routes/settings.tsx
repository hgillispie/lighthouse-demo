import { useState } from "react";
import { useNavigate } from "react-router";
import {
  IconTrash,
  IconPlus,
} from "@tabler/icons-react";
import { useSetPageTitle } from "@/components/layout/HeaderActions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  useCompetitors,
  useDeleteCompetitor,
  useCreateCompetitor,
  useSignals,
} from "@/hooks/use-api";
import { toast } from "sonner";

export function meta() {
  return [{ title: "Lighthouse — Settings" }];
}

function timeAgo(unix: number): string {
  const seconds = Math.floor(Date.now() / 1000 - unix);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

interface CustomRow {
  key: string;
  label: string;
  url: string;
  watchType: string;
}

const WATCH_TYPE_OPTIONS = [
  { value: "webpage", label: "Web Page" },
  { value: "pricing", label: "Pricing Page" },
  { value: "hiring", label: "Hiring Page" },
  { value: "github_releases", label: "GitHub Releases" },
  { value: "rss", label: "RSS Feed" },
];

export default function SettingsPage() {
  useSetPageTitle("Settings");
  const { data: competitors = [], isLoading } = useCompetitors();
  const { data: allSignals = [] } = useSignals();
  const deleteComp = useDeleteCompetitor();
  const createCompetitor = useCreateCompetitor();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [customRows, setCustomRows] = useState<CustomRow[]>([]);

  function addCustomRow() {
    setCustomRows((prev) => [
      ...prev,
      { key: crypto.randomUUID(), label: "", url: "", watchType: "webpage" },
    ]);
  }

  function removeCustomRow(key: string) {
    setCustomRows((prev) => prev.filter((r) => r.key !== key));
  }

  function updateCustomRow(key: string, field: keyof Omit<CustomRow, "key">, value: string) {
    setCustomRows((prev) =>
      prev.map((r) => (r.key === key ? { ...r, [field]: value } : r)),
    );
  }

  function handleDrawerClose() {
    setCustomRows([]);
    setDrawerOpen(false);
  }

  function handleAddSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const validCustom = customRows
      .filter((r) => r.url.trim() && r.label.trim())
      .map((r) => ({ label: r.label.trim(), url: r.url.trim(), watchType: r.watchType }));

    createCompetitor.mutate(
      {
        name: fd.get("name") as string,
        websiteUrl: (fd.get("websiteUrl") as string) || undefined,
        pricingUrl: (fd.get("pricingUrl") as string) || undefined,
        githubRepo: (fd.get("githubRepo") as string) || undefined,
        hiringUrl: (fd.get("hiringUrl") as string) || undefined,
        customWatchConfigs: validCustom.length > 0 ? validCustom : undefined,
      },
      {
        onSuccess: (data: any) => {
          toast.success(`Added ${fd.get("name")}`);
          handleDrawerClose();
          navigate(`/competitors/${data.slug}`);
        },
        onError: () => toast.error("Failed to create competitor"),
      },
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner className="h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Tracked Competitors</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setDrawerOpen(true)}>
            <IconPlus className="h-3.5 w-3.5" />
            Add Competitor
          </Button>
        </CardHeader>
        <CardContent>
          {competitors.length === 0 ? (
            <p className="text-sm text-muted-foreground">No competitors tracked yet.</p>
          ) : (
            <div className="border rounded-lg divide-y divide-border">
              {competitors.map((c) => {
                const compSignals = allSignals.filter((s) => s.competitor_id === c.id);
                const lastSignal = compSignals.sort((a, b) => b.detected_at - a.detected_at)[0];

                return (
                  <div key={c.id} className="flex items-center gap-3 px-3 sm:px-4 py-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold uppercase shrink-0">
                      {c.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {compSignals.length} signals
                        {lastSignal && ` · ${timeAgo(lastSignal.detected_at)}`}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0"
                      onClick={() => navigate(`/competitors/${c.slug}`)}
                    >
                      View
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                          <IconTrash className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete {c.name}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will deactivate the competitor and stop all monitoring. Existing signals will be preserved.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() =>
                              deleteComp.mutate(c.id, {
                                onSuccess: () => toast.success(`Deleted ${c.name}`),
                              })
                            }
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Competitor Drawer */}
      <Sheet open={drawerOpen} onOpenChange={(v) => !v && handleDrawerClose()}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Add Competitor</SheetTitle>
            <SheetDescription>Track a new competitor's online presence.</SheetDescription>
          </SheetHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4 mt-4 px-4">
            <div>
              <Label htmlFor="settings-name">Name *</Label>
              <Input id="settings-name" name="name" required placeholder="e.g. Acme" />
            </div>
            <div>
              <Label htmlFor="settings-websiteUrl">Website URL</Label>
              <Input id="settings-websiteUrl" name="websiteUrl" placeholder="https://acme.com" />
            </div>
            <div>
              <Label htmlFor="settings-pricingUrl">Pricing Page</Label>
              <Input id="settings-pricingUrl" name="pricingUrl" placeholder="https://acme.com/pricing" />
            </div>
            <div>
              <Label htmlFor="settings-githubRepo">GitHub Repo</Label>
              <Input id="settings-githubRepo" name="githubRepo" placeholder="org/repo" />
            </div>
            <div>
              <Label htmlFor="settings-hiringUrl">Hiring Page</Label>
              <Input id="settings-hiringUrl" name="hiringUrl" placeholder="https://acme.com/careers" />
            </div>

            {/* Custom URL rows */}
            {customRows.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-border">
                <p className="text-xs font-medium text-muted-foreground">Custom URLs</p>
                {customRows.map((row) => (
                  <div key={row.key} className="space-y-2 rounded-lg border border-border p-3 bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Input
                        value={row.label}
                        onChange={(e) => updateCustomRow(row.key, "label", e.target.value)}
                        placeholder="Label (e.g. Blog)"
                        className="flex-1 h-8 text-sm"
                      />
                      <Select
                        value={row.watchType}
                        onValueChange={(v) => updateCustomRow(row.key, "watchType", v)}
                      >
                        <SelectTrigger className="w-[130px] h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {WATCH_TYPE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeCustomRow(row.key)}
                      >
                        <IconTrash className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <Input
                      value={row.url}
                      onChange={(e) => updateCustomRow(row.key, "url", e.target.value)}
                      placeholder="https://..."
                      className="h-8 text-sm"
                    />
                  </div>
                ))}
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={addCustomRow}
            >
              <IconPlus className="h-3.5 w-3.5" />
              Add custom URL
            </Button>

            <Button type="submit" className="w-full" disabled={createCompetitor.isPending}>
              {createCompetitor.isPending ? <Spinner className="h-4 w-4" /> : "Add Competitor"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
