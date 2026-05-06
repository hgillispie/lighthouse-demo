import { useState } from "react";
import { useNavigate } from "react-router";
import {
  IconTrash,
  IconCircleCheck,
  IconCircleX,
} from "@tabler/icons-react";
import { useSetPageTitle } from "@/components/layout/HeaderActions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
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

export default function SettingsPage() {
  useSetPageTitle("Settings");
  const { data: competitors = [], isLoading } = useCompetitors();
  const { data: allSignals = [] } = useSignals();
  const deleteComp = useDeleteCompetitor();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner className="h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  const envVars = [
    { name: "DATABASE_URL", required: true, present: true },
    { name: "ANTHROPIC_API_KEY", required: true, present: true },
    { name: "SEED_DEMO_DATA", required: false, present: false },
    { name: "SLACK_WEBHOOK_URL", required: false, present: false },
    { name: "SCRAPE_PROXY_URL", required: false, present: false },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tracked Competitors</CardTitle>
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Environment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {envVars.map((v) => (
              <div key={v.name} className="flex items-center gap-3">
                {v.present ? (
                  <IconCircleCheck className="h-4 w-4 text-emerald-500" />
                ) : (
                  <IconCircleX className={`h-4 w-4 ${v.required ? "text-red-500" : "text-muted-foreground"}`} />
                )}
                <span className="text-sm font-mono">{v.name}</span>
                {!v.required && (
                  <span className="text-xs text-muted-foreground">optional</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
