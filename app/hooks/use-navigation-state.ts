import { useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { agentNativePath } from "@agent-native/core/client";

export interface NavigationState {
  view: string;
  path?: string;
  competitorSlug?: string;
  competitorId?: string;
  briefingId?: string;
}

function resolveView(pathname: string): NavigationState {
  if (pathname.startsWith("/competitors/")) {
    const slug = pathname.split("/")[2];
    return { view: "competitor", competitorSlug: slug, path: pathname };
  }
  if (pathname.startsWith("/briefings")) return { view: "briefings", path: pathname };
  if (pathname.startsWith("/settings")) return { view: "settings", path: pathname };
  if (pathname.startsWith("/new-app")) return { view: "new-app", path: pathname };
  return { view: "dashboard", path: pathname };
}

export function useNavigationState() {
  const location = useLocation();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    const state = resolveView(location.pathname);
    fetch(agentNativePath("/_agent-native/application-state/navigation"), {
      method: "PUT",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state),
    }).catch(() => {});
  }, [location.pathname]);

  const { data: navCommand } = useQuery({
    queryKey: ["navigate-command"],
    queryFn: async () => {
      const res = await fetch(
        agentNativePath("/_agent-native/application-state/navigate"),
      );
      if (!res.ok) return null;
      const data = await res.json();
      if (data) return { ...data, _ts: Date.now() };
      return null;
    },
    refetchInterval: 2_000,
    refetchIntervalInBackground: true,
    structuralSharing: false,
  });

  useEffect(() => {
    if (!navCommand) return;
    fetch(agentNativePath("/_agent-native/application-state/navigate"), {
      method: "DELETE",
      headers: { "X-Agent-Native-CSRF": "1" },
    }).catch(() => {});

    const cmd = navCommand as NavigationState;
    const path = cmd.path || "/";
    navigate(path);
    qc.setQueryData(["navigate-command"], null);
  }, [navCommand, navigate, qc]);
}
