// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2026 Anil Belur <askb23@gmail.com>

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Header from "@/components/layout/Header";
import {
  Shield,
  Cpu,
  HardDrive,
  Wifi,
  Bell,
  RefreshCw,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GatewayAgent {
  id: string;
  isDefault: boolean;
  heartbeatEnabled: boolean;
  heartbeatEvery: string;
  sessionCount: number;
}

interface GatewaySession {
  key: string;
  kind: string;
  displayName: string;
  updatedAt: number;
  status: string;
  model: string;
  totalTokens: number;
  percentUsed: number;
}

interface GatewayResponse {
  ok: boolean;
  status: string;
  agentCount: number;
  sessionCount: number;
  agents: GatewayAgent[];
  sessions: GatewaySession[];
  channels: Record<string, { configured: boolean; running: boolean }>;
  error?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  const [data, setData] = useState<GatewayResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const resp = await fetch("/api/gateway");
      const json = (await resp.json()) as GatewayResponse;
      if (mountedRef.current) {
        setData(json);
        setError(resp.ok ? null : json.error ?? "Gateway error");
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    const timer = setInterval(() => fetchData(), 30_000);
    return () => {
      mountedRef.current = false;
      clearInterval(timer);
    };
  }, [fetchData]);

  const isConnected = data?.ok === true;
  const isDown = !isConnected && !loading;

  // Build status icon helper
  const StatusIcon = ({
    ok,
    size = 3.5,
  }: {
    ok: boolean;
    size?: number;
  }) =>
    ok ? (
      <CheckCircle
        className={`text-[var(--color-success)]`}
        style={{ width: `${size * 4}px`, height: `${size * 4}px` }}
      />
    ) : (
      <XCircle
        className={`text-[var(--color-error)]`}
        style={{ width: `${size * 4}px`, height: `${size * 4}px` }}
      />
    );

  // Derive services list from gateway data
  const services: { label: string; status: string; ok: boolean }[] = [];
  if (data) {
    services.push({
      label: "Gateway",
      status: isConnected ? "Healthy" : "Disconnected",
      ok: isConnected,
    });
    services.push({
      label: "Dashboard",
      status: "Healthy",
      ok: true,
    });
    // Add channels as services
    if (data.channels) {
      for (const [name, ch] of Object.entries(data.channels)) {
        services.push({
          label: name.charAt(0).toUpperCase() + name.slice(1),
          status: ch.running ? "Running" : ch.configured ? "Stopped" : "N/A",
          ok: ch.running,
        });
      }
    }
  }

  return (
    <>
      <Header title="Settings" subtitle="System configuration and status" />
      <div className="flex-1 overflow-auto p-6">
        {/* Source badge + refresh */}
        <div className="mb-4 flex items-center gap-2">
          {data && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                isConnected
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-red-500/15 text-red-400"
              }`}
            >
              {isConnected ? "📡 Live" : "🎭 Demo"}
            </span>
          )}
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="ml-auto flex h-7 items-center gap-1.5 rounded-md border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] px-2.5 text-[11px] text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-border-strong)] disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="grid gap-6 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)]"
              >
                <div className="border-b border-[var(--color-border-subtle)] px-5 py-3">
                  <div className="h-4 w-24 rounded bg-[var(--color-bg-tertiary)]" />
                </div>
                <div className="space-y-3 p-5">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div
                      key={j}
                      className="flex items-center justify-between"
                    >
                      <div className="h-3 w-28 rounded bg-[var(--color-bg-tertiary)]" />
                      <div className="h-3 w-20 rounded bg-[var(--color-bg-tertiary)]" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Main content */}
        {!loading && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Gateway section */}
            <div className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)]">
              <div className="flex items-center gap-2 border-b border-[var(--color-border-subtle)] px-5 py-3">
                <Wifi className="h-4 w-4 text-[var(--color-accent)]" />
                <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                  Gateway
                </h2>
                <span
                  className={`ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    isConnected
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-red-500/15 text-red-400"
                  }`}
                >
                  {isConnected ? "Connected" : "Disconnected"}
                </span>
              </div>
              <div className="divide-y divide-[var(--color-border-subtle)]">
                <div className="flex items-center justify-between px-5 py-2.5">
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    Status
                  </span>
                  <span className="text-xs font-medium text-[var(--color-text-primary)]">
                    {data?.status ?? "unknown"}
                  </span>
                </div>
                <div className="flex items-center justify-between px-5 py-2.5">
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    Agents
                  </span>
                  <span className="text-xs font-medium text-[var(--color-text-primary)]">
                    {data?.agentCount ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between px-5 py-2.5">
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    Sessions
                  </span>
                  <span className="text-xs font-medium text-[var(--color-text-primary)]">
                    {data?.sessionCount ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between px-5 py-2.5">
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    Gateway URL
                  </span>
                  <span className="font-mono text-xs text-[var(--color-text-primary)]">
                    ws://gateway:18789
                  </span>
                </div>
              </div>
            </div>

            {/* Security section */}
            <div className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)]">
              <div className="flex items-center gap-2 border-b border-[var(--color-border-subtle)] px-5 py-3">
                <Shield className="h-4 w-4 text-[var(--color-accent)]" />
                <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                  Security
                </h2>
              </div>
              <div className="divide-y divide-[var(--color-border-subtle)]">
                <div className="flex items-center justify-between px-5 py-2.5">
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    Exec Approvals
                  </span>
                  <span className="text-xs font-medium text-[var(--color-text-primary)]">
                    30+ deny patterns
                  </span>
                </div>
                <div className="flex items-center justify-between px-5 py-2.5">
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    Secrets Audit
                  </span>
                  <span className="text-xs font-medium text-[var(--color-text-primary)]">
                    Clean (0 plaintext)
                  </span>
                </div>
                <div className="flex items-center justify-between px-5 py-2.5">
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    HTTPS (Caddy)
                  </span>
                  <span className="text-xs font-medium text-[var(--color-text-primary)]">
                    Active on :8443
                  </span>
                </div>
                <div className="flex items-center justify-between px-5 py-2.5">
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    Auth Mode
                  </span>
                  <span className="text-xs font-medium text-[var(--color-text-primary)]">
                    Token
                  </span>
                </div>
              </div>
            </div>

            {/* Services section */}
            <div className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)]">
              <div className="flex items-center gap-2 border-b border-[var(--color-border-subtle)] px-5 py-3">
                <Cpu className="h-4 w-4 text-[var(--color-accent)]" />
                <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                  Services
                </h2>
              </div>
              <div className="divide-y divide-[var(--color-border-subtle)]">
                {services.length > 0 ? (
                  services.map((svc) => (
                    <div
                      key={svc.label}
                      className="flex items-center justify-between px-5 py-2.5"
                    >
                      <span className="text-xs text-[var(--color-text-secondary)]">
                        {svc.label}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <StatusIcon ok={svc.ok} />
                        <span
                          className={`text-xs font-medium ${
                            svc.ok
                              ? "text-[var(--color-success)]"
                              : "text-[var(--color-error)]"
                          }`}
                        >
                          {svc.status}
                        </span>
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="px-5 py-3 text-xs text-[var(--color-text-tertiary)]">
                    No service data available
                  </div>
                )}
              </div>
            </div>

            {/* Resources section */}
            <div className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)]">
              <div className="flex items-center gap-2 border-b border-[var(--color-border-subtle)] px-5 py-3">
                <HardDrive className="h-4 w-4 text-[var(--color-accent)]" />
                <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                  Resources
                </h2>
              </div>
              <div className="divide-y divide-[var(--color-border-subtle)]">
                <div className="flex items-center justify-between px-5 py-2.5">
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    Gateway Memory
                  </span>
                  <span className="text-xs font-medium text-[var(--color-text-primary)]">
                    4G limit
                  </span>
                </div>
                <div className="flex items-center justify-between px-5 py-2.5">
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    Dashboard Memory
                  </span>
                  <span className="text-xs font-medium text-[var(--color-text-primary)]">
                    512M limit
                  </span>
                </div>
                <div className="flex items-center justify-between px-5 py-2.5">
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    Redis Memory
                  </span>
                  <span className="text-xs font-medium text-[var(--color-text-primary)]">
                    256M limit
                  </span>
                </div>
                <div className="flex items-center justify-between px-5 py-2.5">
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    SearXNG Memory
                  </span>
                  <span className="text-xs font-medium text-[var(--color-text-primary)]">
                    256M limit
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notifications placeholder */}
        {!loading && (
          <div className="mt-6 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] p-5">
            <div className="mb-3 flex items-center gap-2">
              <Bell className="h-4 w-4 text-[var(--color-accent)]" />
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Notifications
              </h2>
            </div>
            <p className="text-xs text-[var(--color-text-tertiary)]">
              Notification preferences will be configurable in a future update.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
