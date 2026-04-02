// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2026 Anil Belur <askb23@gmail.com>

/**
 * Gateway WebSocket client for ZeroClaw.
 * Implements the OpenClaw Gateway protocol (connect challenge → JSON-RPC).
 *
 * Server-side only — this module uses `ws` and must NOT be imported from
 * client components.  Client components should call the Next.js API routes
 * which delegate to the helpers exported here.
 */

import type {
  GatewayConfig,
  Agent,
  AgentStatus,
  ActivityEvent,
} from "./types";

// ---------------------------------------------------------------------------
// Config helpers
// ---------------------------------------------------------------------------

export function getGatewayConfig(): GatewayConfig {
  return {
    url: process.env.GATEWAY_WS_URL || "ws://localhost:18789",
    token: process.env.GATEWAY_TOKEN || "",
  };
}

export function getGatewayHttpUrl(): string {
  const wsUrl = getGatewayConfig().url;
  return wsUrl.replace(/^ws/, "http");
}

// ---------------------------------------------------------------------------
// Low-level WebSocket helpers (server-side)
// ---------------------------------------------------------------------------

/** Shape of a gateway JSON-RPC request frame */
interface GatewayRequest {
  type: "req";
  id: string;
  method: string;
  params: Record<string, unknown>;
}

/** Shape of a gateway JSON-RPC response frame */
interface GatewayResponse {
  type: "res";
  id: string;
  ok: boolean;
  payload?: Record<string, unknown>;
  error?: { code: string; message: string };
}

/** Shape of a gateway event frame */
interface GatewayEvent {
  type: "event";
  event: string;
  payload?: Record<string, unknown>;
}

type GatewayFrame = GatewayResponse | GatewayEvent;

function randomId(): string {
  return crypto.randomUUID();
}

/**
 * Open a one-shot authenticated WebSocket connection to the gateway, execute
 * `fn`, then close.  This avoids keeping long-lived connections in API routes.
 */
async function withGatewayConnection<T>(
  fn: (helpers: {
    request: (method: string, params?: Record<string, unknown>) => Promise<Record<string, unknown>>;
    waitEvent: (eventName: string, timeoutMs?: number) => Promise<Record<string, unknown>>;
  }) => Promise<T>,
): Promise<T> {
  const { url, token } = getGatewayConfig();

  // Dynamic import — `ws` is a Node-only package.
  const { default: WebSocket } = await import("ws");

  return new Promise<T>((resolve, reject) => {
    const ws = new WebSocket(url);
    const pending = new Map<string, { resolve: (v: Record<string, unknown>) => void; reject: (e: Error) => void }>();
    const eventWaiters = new Map<string, { resolve: (v: Record<string, unknown>) => void; timer: ReturnType<typeof setTimeout> }>();
    let connected = false;
    let closed = false;

    const cleanup = () => {
      closed = true;
      for (const [, p] of pending) p.reject(new Error("connection closed"));
      pending.clear();
      for (const [, w] of eventWaiters) {
        clearTimeout(w.timer);
        w.resolve({});
      }
      eventWaiters.clear();
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };

    const send = (frame: GatewayRequest) => {
      ws.send(JSON.stringify(frame));
    };

    const request = (method: string, params: Record<string, unknown> = {}): Promise<Record<string, unknown>> => {
      return new Promise((res, rej) => {
        const id = randomId();
        const timer = setTimeout(() => {
          pending.delete(id);
          rej(new Error(`gateway request timeout for ${method}`));
        }, 15_000);
        pending.set(id, {
          resolve: (v) => { clearTimeout(timer); res(v); },
          reject: (e) => { clearTimeout(timer); rej(e); },
        });
        send({ type: "req", id, method, params });
      });
    };

    const waitEvent = (eventName: string, timeoutMs = 10_000): Promise<Record<string, unknown>> => {
      return new Promise((res) => {
        const timer = setTimeout(() => {
          eventWaiters.delete(eventName);
          res({});
        }, timeoutMs);
        eventWaiters.set(eventName, { resolve: res, timer });
      });
    };

    ws.on("error", (err) => {
      if (!connected) reject(err);
      cleanup();
    });

    ws.on("close", () => {
      if (!connected) reject(new Error("gateway connection closed before handshake"));
      cleanup();
    });

    ws.on("message", async (raw) => {
      let frame: GatewayFrame;
      try {
        frame = JSON.parse(String(raw)) as GatewayFrame;
      } catch {
        return;
      }

      // Handle connect challenge
      if (frame.type === "event" && (frame as GatewayEvent).event === "connect.challenge") {
        const nonce = (frame as GatewayEvent).payload?.nonce as string | undefined;
        if (!nonce) {
          reject(new Error("gateway connect challenge missing nonce"));
          cleanup();
          return;
        }

        try {
          await request("connect", {
            minProtocol: 3,
            maxProtocol: 3,
            client: {
              id: "openclaw-control-ui",
              displayName: "ZeroClaw Dashboard",
              version: "0.1.0",
              platform: "linux",
              mode: "ui",
            },
            caps: [],
            auth: { token },
            role: "operator",
            scopes: ["operator.admin"],
          });
          connected = true;

          // Run caller's function
          try {
            const result = await fn({ request, waitEvent });
            resolve(result);
          } catch (err) {
            reject(err instanceof Error ? err : new Error(String(err)));
          } finally {
            cleanup();
          }
        } catch (err) {
          reject(err instanceof Error ? err : new Error(String(err)));
          cleanup();
        }
        return;
      }

      // Handle RPC responses
      if (frame.type === "res") {
        const res = frame as GatewayResponse;
        const p = pending.get(res.id);
        if (p) {
          pending.delete(res.id);
          if (res.ok) {
            p.resolve(res.payload ?? {});
          } else {
            p.reject(new Error(res.error?.message ?? "unknown gateway error"));
          }
        }
        return;
      }

      // Handle events
      if (frame.type === "event") {
        const evt = frame as GatewayEvent;
        const w = eventWaiters.get(evt.event);
        if (w) {
          eventWaiters.delete(evt.event);
          clearTimeout(w.timer);
          w.resolve(evt.payload ?? {});
        }
      }
    });

    // Global timeout for the entire operation
    setTimeout(() => {
      if (!closed) {
        reject(new Error("gateway operation timed out"));
        cleanup();
      }
    }, 30_000);
  });
}

// ---------------------------------------------------------------------------
// High-level server-side helpers (used by API routes)
// ---------------------------------------------------------------------------

export interface GatewayHealthResult {
  ok: boolean;
  status: "live" | "degraded" | "down";
  agents: GatewayAgentInfo[];
  sessions: GatewaySessionInfo[];
  channels: Record<string, { configured: boolean; running: boolean }>;
}

export interface GatewayAgentInfo {
  id: string;
  isDefault: boolean;
  heartbeatEnabled: boolean;
  heartbeatEvery: string;
  sessionCount: number;
}

export interface GatewaySessionInfo {
  key: string;
  kind: string;
  displayName: string;
  updatedAt: number;
  status: string;
  model: string;
  totalTokens: number;
  percentUsed: number;
}

/**
 * Fetch health + status from the gateway (server-side).
 * Falls back to a simple HTTP /health probe when WS fails.
 */
export async function getGatewayHealth(): Promise<GatewayHealthResult> {
  try {
    return await withGatewayConnection(async ({ request }) => {
      const health = await request("health") as Record<string, unknown>;
      const status = await request("status") as Record<string, unknown>;

      const rawAgents = (health.agents ?? []) as Array<Record<string, unknown>>;
      const agents: GatewayAgentInfo[] = rawAgents.map((a) => ({
        id: String(a.agentId ?? ""),
        isDefault: Boolean(a.isDefault),
        heartbeatEnabled: Boolean((a.heartbeat as Record<string, unknown>)?.enabled),
        heartbeatEvery: String((a.heartbeat as Record<string, unknown>)?.every ?? ""),
        sessionCount: Number((a.sessions as Record<string, unknown>)?.count ?? 0),
      }));

      // Session info from status response
      const statusSessions = (status.sessions as Record<string, unknown>) ?? {};
      const recentSessions = ((statusSessions as Record<string, unknown>).recent ?? []) as Array<Record<string, unknown>>;
      const sessions: GatewaySessionInfo[] = recentSessions.map((s) => ({
        key: String(s.key ?? ""),
        kind: String(s.kind ?? ""),
        displayName: String(s.displayName ?? s.key ?? ""),
        updatedAt: Number(s.updatedAt ?? 0),
        status: String(s.status ?? "unknown"),
        model: String(s.model ?? ""),
        totalTokens: Number(s.totalTokens ?? 0),
        percentUsed: Number(s.percentUsed ?? 0),
      }));

      // Channel status from health
      const rawChannels = (health.channels ?? {}) as Record<string, Record<string, unknown>>;
      const channels: Record<string, { configured: boolean; running: boolean }> = {};
      for (const [name, ch] of Object.entries(rawChannels)) {
        channels[name] = {
          configured: Boolean(ch.configured),
          running: Boolean(ch.running),
        };
      }

      return {
        ok: Boolean(health.ok),
        status: health.ok ? "live" : "degraded",
        agents,
        sessions,
        channels,
      };
    });
  } catch {
    // Fallback: try simple HTTP health probe
    try {
      const httpUrl = getGatewayHttpUrl();
      const resp = await fetch(`${httpUrl}/health`, { signal: AbortSignal.timeout(5000) });
      const data = (await resp.json()) as Record<string, unknown>;
      return {
        ok: Boolean(data.ok),
        status: data.ok ? "live" : "degraded",
        agents: [],
        sessions: [],
        channels: {},
      };
    } catch {
      return { ok: false, status: "down", agents: [], sessions: [], channels: {} };
    }
  }
}

/**
 * Fetch the full session list from the gateway (server-side).
 */
export async function getGatewaySessions(): Promise<GatewaySessionInfo[]> {
  try {
    return await withGatewayConnection(async ({ request }) => {
      const result = await request("sessions.list") as Record<string, unknown>;
      const rawSessions = ((result.sessions ?? []) as Array<Record<string, unknown>>);
      return rawSessions.map((s) => ({
        key: String(s.key ?? ""),
        kind: String(s.kind ?? ""),
        displayName: String(s.displayName ?? s.key ?? ""),
        updatedAt: Number(s.updatedAt ?? 0),
        status: String(s.status ?? "unknown"),
        model: String(s.model ?? ""),
        totalTokens: Number(s.totalTokens ?? 0),
        percentUsed: Number(s.percentUsed ?? 0),
      }));
    });
  } catch {
    return [];
  }
}

/**
 * Fetch the agent list from the gateway (server-side).
 */
export async function getGatewayAgents(): Promise<Agent[]> {
  try {
    return await withGatewayConnection(async ({ request }) => {
      const result = await request("agents.list") as Record<string, unknown>;
      const defaultId = String(result.defaultId ?? "main");
      const rawAgents = (result.agents ?? []) as Array<Record<string, unknown>>;

      // Also grab health for richer agent info
      const health = await request("health") as Record<string, unknown>;
      const healthAgents = (health.agents ?? []) as Array<Record<string, unknown>>;
      const healthMap = new Map<string, Record<string, unknown>>();
      for (const ha of healthAgents) {
        healthMap.set(String(ha.agentId ?? ""), ha);
      }

      return rawAgents.map((a): Agent => {
        const id = String(a.id ?? "");
        const ha = healthMap.get(id);
        const heartbeat = ha?.heartbeat as Record<string, unknown> | undefined;
        const isDefault = id === defaultId;

        let status: AgentStatus = "offline";
        if (heartbeat?.enabled) {
          status = "idle";
        }
        if (isDefault) {
          status = "online";
        }

        return {
          id,
          name: id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          role: isDefault ? "Default Agent" : "Specialist",
          status,
          description: isDefault ? "Primary agent handling default routing" : `Specialist agent: ${id}`,
          skills: [],
        };
      });
    });
  } catch {
    return [];
  }
}
