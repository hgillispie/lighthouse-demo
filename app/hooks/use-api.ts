import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { agentNativePath } from "@agent-native/core/client";

function apiUrl(path: string): string {
  return agentNativePath(path);
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(apiUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json() as Promise<T>;
}

export interface Competitor {
  id: string;
  name: string;
  slug: string;
  website_url: string | null;
  pricing_url: string | null;
  github_repo: string | null;
  hiring_url: string | null;
  description: string | null;
  logo_url: string | null;
  is_active: number;
  created_at: number;
  updated_at: number;
}

export interface WatchConfig {
  id: string;
  competitor_id: string;
  watch_type: string;
  url: string;
  label: string;
  last_content_hash: string | null;
  last_content_snippet: string | null;
  last_checked_at: number | null;
  check_interval_hours: number;
  is_enabled: number;
  created_at: number;
}

export interface Signal {
  id: string;
  competitor_id: string;
  watch_config_id: string | null;
  signal_type: string;
  title: string;
  summary: string | null;
  raw_diff: string | null;
  url: string | null;
  severity: string;
  is_read: number;
  detected_at: number;
  competitor_name?: string;
  competitor_slug?: string;
}

export interface Briefing {
  id: string;
  title: string;
  content: string;
  signal_ids: string;
  period_start: number;
  period_end: number;
  generated_at: number;
}

export function useCompetitors() {
  return useQuery<Competitor[]>({
    queryKey: ["competitors"],
    queryFn: () => apiFetch("/api/competitors"),
    refetchInterval: 5_000,
  });
}

export function useCompetitor(id: string) {
  return useQuery<Competitor & { watchConfigs: WatchConfig[] }>({
    queryKey: ["competitor", id],
    queryFn: () => apiFetch(`/api/competitors/${id}`),
    enabled: !!id,
    refetchInterval: 5_000,
  });
}

export function useSignals(params?: Record<string, string>) {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return useQuery<Signal[]>({
    queryKey: ["signals", params],
    queryFn: () => apiFetch(`/api/signals${qs}`),
    refetchInterval: 5_000,
  });
}

export function useBriefings() {
  return useQuery<Briefing[]>({
    queryKey: ["briefings"],
    queryFn: () => apiFetch("/api/briefings"),
    refetchInterval: 10_000,
  });
}

export function useBriefing(id: string | null) {
  return useQuery<Briefing>({
    queryKey: ["briefing", id],
    queryFn: () => apiFetch(`/api/briefings/${id}`),
    enabled: !!id,
  });
}

export function useCreateCompetitor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      websiteUrl?: string;
      pricingUrl?: string;
      githubRepo?: string;
      hiringUrl?: string;
      customWatchConfigs?: Array<{
        label: string;
        url: string;
        watchType: string;
      }>;
    }) => apiFetch("/api/competitors", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["competitors"] }),
  });
}

export function useRunSweep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<{ signalsCreated: number }>("/api/sweep", { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["signals"] });
      qc.invalidateQueries({ queryKey: ["competitors"] });
    },
  });
}

export function useGenerateBriefing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<{ briefingId: string | null }>("/api/generate-briefing", { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["briefings"] }),
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch("/api/signals/mark-all-read", { method: "PUT" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["signals"] }),
  });
}

export function useMarkSignalRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (signalId: string) =>
      apiFetch(`/api/signals/${signalId}/read`, { method: "PUT" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["signals"] }),
  });
}

export function useDeleteCompetitor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/competitors/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["competitors"] }),
  });
}

export function useCreateWatchConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      competitorId: string;
      watchType: string;
      url: string;
      label: string;
    }) => apiFetch("/api/watch-configs", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["competitor"] });
      qc.invalidateQueries({ queryKey: ["competitors"] });
    },
  });
}

export function useToggleWatchConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      apiFetch(`/api/watch-configs/${id}`, {
        method: "PUT",
        body: JSON.stringify({ is_enabled: enabled }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["competitor"] }),
  });
}

export function useDeleteWatchConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/watch-configs/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["competitor"] }),
  });
}
