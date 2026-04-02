/**
 * Typed API Client for the Secure OpenClaw UI
 * Following clawrule.md requirements
 */

import { GatewayStats } from "@/lib/hooks/use-dashboard-stats";
import { SessionInfo } from "@/lib/hooks/use-sessions";
import { MemoryContent, SearchResult } from "@/lib/hooks/use-memory";
import { ConnectedApp } from "@/lib/hooks/use-integrations";
import { Config } from "@/lib/hooks/use-config";
import { ScheduledJob } from "@/lib/hooks/use-scheduling";
import { MessageRequest } from "@/types/api";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export const api = {
  stats: {
    get: () => request<GatewayStats>("/api/proxy/status"),
    getDetailed: () => request<GatewayStats>("/api/proxy/stats"),
  },
  sessions: {
    list: () => request<SessionInfo[]>("/api/proxy/sessions"),
    get: (key: string) => request<unknown>(`/api/proxy/sessions/${key}`),
    sendMessage: (messageRequest: MessageRequest) => 
      request<{ response: string }>("/api/proxy/message", {
        method: "POST",
        body: JSON.stringify(messageRequest) as BodyInit,
      }),
  },
  memory: {
    getLongTerm: () => request<MemoryContent>("/api/proxy/memory/long-term"),
    getDailyFiles: () => request<string[]>("/api/proxy/memory/daily"),
    getDaily: (date: string) => request<MemoryContent>(`/api/proxy/memory/daily/${date}`),
    search: (query: string) => request<SearchResult[]>(`/api/proxy/memory/search?q=${encodeURIComponent(query)}`),
    update: (type: "long-term" | "daily", content: string, date?: string) =>
      request<{ success: boolean }>("/api/proxy/memory/update", {
        method: "POST",
        body: JSON.stringify({ type, date, content }) as BodyInit,
      }),
  },
  integrations: {
    list: () => request<ConnectedApp[]>("/api/proxy/integrations"),
    connect: (appName: string) => request<{ redirectUrl: string }>(`/api/proxy/integrations/connect/${appName}`),
  },
  config: {
    get: () => request<Config>("/api/proxy/config"),
    update: (newConfig: Partial<Config>) =>
      request<{ success: boolean; config: Config }>("/api/proxy/config/update", {
        method: "POST",
        body: JSON.stringify(newConfig) as BodyInit,
      }),
  },
  scheduling: {
    listJobs: () => request<ScheduledJob[]>("/api/proxy/scheduling/jobs"),
    cancelJob: (jobId: string) => request<{ success: boolean }>(`/api/proxy/scheduling/jobs/${jobId}`, {
      method: "DELETE",
    }),
  },
};
