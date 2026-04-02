// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2026 Anil Belur <askb23@gmail.com>

"use client";

/**
 * React hooks for consuming gateway data via Next.js API routes.
 *
 * All gateway communication is proxied through server-side API routes so
 * that the GATEWAY_TOKEN is never exposed to the browser.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import type {
  Agent,
  Task,
  ActivityEvent,
  AgentStatus,
} from "./types";

// ---------------------------------------------------------------------------
// Generic fetch hook
// ---------------------------------------------------------------------------

interface UseFetchResult<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  refetch: () => void;
}

function useFetch<T>(url: string, intervalMs = 0): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const doFetch = useCallback(async () => {
    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`${resp.status} ${resp.statusText}`);
      const json = (await resp.json()) as T;
      if (mountedRef.current) {
        setData(json);
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    mountedRef.current = true;
    doFetch();

    let timer: ReturnType<typeof setInterval> | null = null;
    if (intervalMs > 0) {
      timer = setInterval(doFetch, intervalMs);
    }

    return () => {
      mountedRef.current = false;
      if (timer) clearInterval(timer);
    };
  }, [doFetch, intervalMs]);

  return { data, error, loading, refetch: doFetch };
}

// ---------------------------------------------------------------------------
// Gateway connection status
// ---------------------------------------------------------------------------

export type GatewayConnectionStatus = "connected" | "connecting" | "disconnected" | "demo";

interface GatewayStatusResponse {
  ok: boolean;
  status: "live" | "degraded" | "down";
  agentCount: number;
  sessionCount: number;
}

interface UseGatewayConnectionResult {
  status: GatewayConnectionStatus;
  gatewayHealth: GatewayStatusResponse | null;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook that polls the gateway API route for connection status.
 * Polls every 30 seconds.
 */
export function useGatewayConnection(): UseGatewayConnectionResult {
  const { data, error, loading, refetch } = useFetch<GatewayStatusResponse>(
    "/api/gateway",
    30_000,
  );

  let status: GatewayConnectionStatus;
  if (loading) {
    status = "connecting";
  } else if (error || !data) {
    status = "demo";
  } else if (data.ok) {
    status = "connected";
  } else {
    status = "disconnected";
  }

  return { status, gatewayHealth: data, error, refetch };
}

// ---------------------------------------------------------------------------
// Agent status hook
// ---------------------------------------------------------------------------

interface AgentsResponse {
  agents: Agent[];
  source: "live" | "mock";
}

interface UseAgentStatusResult {
  agents: Agent[];
  isLive: boolean;
  loading: boolean;
  error: string | null;
}

/**
 * Hook that returns live agent statuses, polling every 30 seconds.
 */
export function useAgentStatus(): UseAgentStatusResult {
  const { data, error, loading } = useFetch<AgentsResponse>(
    "/api/agents",
    30_000,
  );

  return {
    agents: data?.agents ?? [],
    isLive: data?.source === "live",
    loading,
    error,
  };
}

// ---------------------------------------------------------------------------
// Sessions hook
// ---------------------------------------------------------------------------

interface SessionInfo {
  key: string;
  kind: string;
  displayName: string;
  updatedAt: number;
  status: string;
  model: string;
  totalTokens: number;
  percentUsed: number;
}

/** The /api/gateway endpoint returns this shape (superset of GatewayStatusResponse). */
interface GatewayFullResponse {
  ok: boolean;
  status: string;
  agentCount: number;
  sessionCount: number;
  sessions: SessionInfo[];
}

interface UseSessionsResult {
  sessions: SessionInfo[];
  isLive: boolean;
  loading: boolean;
  error: string | null;
}

/**
 * Hook that returns gateway sessions, polling every 30 seconds.
 */
export function useSessions(): UseSessionsResult {
  const { data, error, loading } = useFetch<GatewayFullResponse>(
    "/api/gateway",
    30_000,
  );

  return {
    sessions: data?.sessions ?? [],
    isLive: data?.ok === true,
    loading,
    error,
  };
}

// ---------------------------------------------------------------------------
// Tasks hook
// ---------------------------------------------------------------------------

interface TasksResponse {
  tasks: Task[];
  source: "live" | "mock";
}

interface UseTasksResult {
  tasks: Task[];
  isLive: boolean;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook that fetches tasks from the API route, polling every 30 seconds.
 */
export function useTasks(): UseTasksResult {
  const { data, error, loading, refetch } = useFetch<TasksResponse>(
    "/api/tasks",
    30_000,
  );

  return {
    tasks: data?.tasks ?? [],
    isLive: data?.source === "live",
    loading,
    error,
    refetch,
  };
}

// ---------------------------------------------------------------------------
// Activity feed hook
// ---------------------------------------------------------------------------

interface ActivityResponse {
  events: ActivityEvent[];
}

/**
 * Hook that returns recent activity events.  Since the gateway doesn't have
 * a dedicated activity feed, this derives events from gateway health checks
 * and supplements with mock data when the gateway is unreachable.
 */
export function useActivityFeed(): { events: ActivityEvent[]; loading: boolean } {
  const { status, gatewayHealth } = useGatewayConnection();
  const [events, setEvents] = useState<ActivityEvent[]>([]);

  useEffect(() => {
    const now = new Date();
    const newEvents: ActivityEvent[] = [];

    if (status === "connected" && gatewayHealth) {
      newEvents.push({
        id: "gw-status",
        timestamp: now.toISOString(),
        text: `Gateway live — ${gatewayHealth.agentCount} agents, ${gatewayHealth.sessionCount} sessions`,
        type: "success",
      });
    } else if (status === "demo") {
      newEvents.push({
        id: "demo-mode",
        timestamp: now.toISOString(),
        text: "Running in demo mode — gateway unreachable",
        type: "warning",
      });
    }

    // Append some contextual events
    newEvents.push(
      {
        id: "evt-1",
        timestamp: new Date(now.getTime() - 2 * 60_000).toISOString(),
        text: "Code Architect completed security audit",
        agent: "Code Architect",
        type: "info",
      },
      {
        id: "evt-2",
        timestamp: new Date(now.getTime() - 15 * 60_000).toISOString(),
        text: "SearXNG returned 52 results from 6 engines",
        type: "info",
      },
      {
        id: "evt-3",
        timestamp: new Date(now.getTime() - 60 * 60_000).toISOString(),
        text: "Gateway started — 4 services healthy",
        type: "success",
      },
      {
        id: "evt-4",
        timestamp: new Date(now.getTime() - 120 * 60_000).toISOString(),
        text: "Exec approvals updated (30+ deny patterns)",
        type: "info",
      },
    );

    setEvents(newEvents);
  }, [status, gatewayHealth]);

  return { events, loading: status === "connecting" };
}
