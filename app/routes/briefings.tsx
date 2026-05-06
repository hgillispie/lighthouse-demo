import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { IconFileText, IconPlus } from "@tabler/icons-react";
import { useSetPageTitle } from "@/components/layout/HeaderActions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useBriefings, useBriefing, useGenerateBriefing } from "@/hooks/use-api";
import { toast } from "sonner";

export function meta() {
  return [{ title: "Lighthouse — Briefings" }];
}

export default function BriefingsPage() {
  useSetPageTitle("Briefings");
  const { data: briefings = [], isLoading } = useBriefings();
  const genBriefing = useGenerateBriefing();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get("id");

  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedId) {
      setActiveId(selectedId);
    } else if (briefings.length > 0 && !activeId) {
      setActiveId(briefings[0].id);
    }
  }, [selectedId, briefings, activeId]);

  const { data: activeBriefing } = useBriefing(activeId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner className="h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  if (briefings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6">
        <IconFileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <h2 className="text-lg font-semibold mb-1">No briefings yet</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Generate a briefing to get a summary of recent competitive signals.
        </p>
        <Button
          onClick={() =>
            genBriefing.mutate(undefined, {
              onSuccess: (data) => {
                if (data.briefingId) {
                  toast.success("Briefing generated");
                  setActiveId(data.briefingId);
                } else {
                  toast.info("No signals to brief");
                }
              },
            })
          }
          disabled={genBriefing.isPending}
        >
          {genBriefing.isPending ? <Spinner className="h-4 w-4" /> : <IconPlus className="h-4 w-4" />}
          Generate Now
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden h-full">
      {/* Header with generate button */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <h3 className="text-sm font-semibold">Briefings</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            genBriefing.mutate(undefined, {
              onSuccess: (data) => {
                if (data.briefingId) {
                  toast.success("Briefing generated");
                  setActiveId(data.briefingId);
                } else {
                  toast.info("No signals to brief");
                }
              },
            })
          }
          disabled={genBriefing.isPending}
        >
          {genBriefing.isPending ? <Spinner className="h-3 w-3" /> : <IconPlus className="h-3.5 w-3.5" />}
          Generate
        </Button>
      </div>

      {/* Briefing selector - horizontal on narrow, sidebar on wide */}
      <div className="flex flex-1 overflow-hidden">
        {/* List sidebar - hidden on narrow, visible on md+ */}
        <div className="hidden md:flex md:w-56 lg:w-64 border-r border-border overflow-y-auto shrink-0 flex-col">
          {briefings.map((b) => {
            const signalCount = JSON.parse(b.signal_ids || "[]").length;
            const isActive = activeId === b.id;
            return (
              <button
                key={b.id}
                onClick={() => setActiveId(b.id)}
                className={`w-full text-left px-4 py-3 border-b border-border transition-colors ${
                  isActive ? "bg-accent" : "hover:bg-accent/30"
                }`}
              >
                <p className="text-sm font-medium truncate">{b.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {new Date(b.generated_at * 1000).toLocaleDateString()}
                  </span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                    {signalCount} signals
                  </Badge>
                </div>
              </button>
            );
          })}
        </div>

        {/* Horizontal tab list - visible on narrow, hidden on md+ */}
        <div className="md:hidden flex items-center gap-1 px-3 py-2 border-b border-border overflow-x-auto shrink-0 scrollbar-none">
          {briefings.map((b) => {
            const isActive = activeId === b.id;
            return (
              <button
                key={b.id}
                onClick={() => setActiveId(b.id)}
                className={`text-xs px-3 py-1.5 rounded-full border whitespace-nowrap transition-colors shrink-0 ${
                  isActive ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"
                }`}
              >
                {b.title.length > 30 ? b.title.slice(0, 30) + "..." : b.title}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeBriefing ? (
            <div className="max-w-3xl prose prose-sm dark:prose-invert prose-headings:font-semibold prose-h1:text-xl prose-h2:text-lg">
              <BriefingContent content={activeBriefing.content} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              Select a briefing to view
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BriefingContent({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("# ")) {
      elements.push(<h1 key={i}>{line.slice(2)}</h1>);
    } else if (line.startsWith("## ")) {
      elements.push(<h2 key={i}>{line.slice(3)}</h2>);
    } else if (line.startsWith("- **")) {
      elements.push(
        <li key={i} dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/—/g, "&mdash;") }} />,
      );
    } else if (line.startsWith("- ")) {
      elements.push(<li key={i}>{line.slice(2)}</li>);
    } else if (line.startsWith("**") && line.endsWith("**")) {
      elements.push(<p key={i}><strong>{line.slice(2, -2)}</strong></p>);
    } else if (line.trim() === "") {
      elements.push(<br key={i} />);
    } else {
      elements.push(
        <p key={i} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />,
      );
    }
  }

  return <>{elements}</>;
}
