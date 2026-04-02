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
  DollarSign,
  TrendingUp,
  Zap,
  Lightbulb,
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

interface DailyUsage {
  date: string;
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  totalTokens: number;
  totalCost: number;
  inputCost: number;
  outputCost: number;
  cacheReadCost: number;
  cacheWriteCost: number;
  missingCostEntries: number;
}

interface UsageData {
  days: number;
  daily: DailyUsage[];
  totals: DailyUsage;
  source: "live" | "mock" | "unavailable";
  error?: string;
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function formatCost(n: number): string {
  return `$${n.toFixed(4)}`;
}

function formatCostShort(n: number): string {
  return `$${n.toFixed(2)}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  const [data, setData] = useState<GatewayResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [usageLoading, setUsageLoading] = useState(true);
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

  const fetchUsage = useCallback(async () => {
    setUsageLoading(true);
    try {
      const resp = await fetch("/api/usage?days=30");
      const json = (await resp.json()) as UsageData;
      if (mountedRef.current) setUsageData(json);
    } catch {
      // silently ignore — UI will show skeleton / empty state
    } finally {
      if (mountedRef.current) setUsageLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsage();
    const timer = setInterval(fetchUsage, 300_000); // refresh every 5 min
    return () => clearInterval(timer);
  }, [fetchUsage]);

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

        {/* ----------------------------------------------------------------- */}
        {/* API Usage & Cost Tracking                                         */}
        {/* ----------------------------------------------------------------- */}

        {/* Usage section heading */}
        <div className="mt-8 mb-4 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-[var(--color-accent)]" />
          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
            API Usage &amp; Cost
          </h2>
          {usageData && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                usageData.source === "live"
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-amber-500/15 text-amber-400"
              }`}
            >
              {usageData.source === "live" ? "📡 Live" : "🎭 Demo"}
            </span>
          )}
        </div>

        {/* Usage loading skeleton */}
        {usageLoading && (
          <div className="grid gap-6 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] p-5"
              >
                <div className="mb-3 h-3 w-16 rounded bg-[var(--color-bg-tertiary)]" />
                <div className="h-7 w-24 rounded bg-[var(--color-bg-tertiary)]" />
              </div>
            ))}
          </div>
        )}

        {/* Usage content */}
        {!usageLoading && usageData && (
          <>
            {/* Cost Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-3">
              {/* Total cost (30 days) */}
              <div className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] p-5">
                <div className="mb-1 flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
                  <DollarSign className="h-3.5 w-3.5" />
                  Total Cost ({usageData.days}d)
                </div>
                <div className="text-2xl font-bold text-[var(--color-text-primary)]">
                  {formatCostShort(usageData.totals.totalCost)}
                </div>
                <div className="mt-1 text-[10px] text-[var(--color-text-tertiary)]">
                  Input {formatCost(usageData.totals.inputCost)} · Output{" "}
                  {formatCost(usageData.totals.outputCost)}
                </div>
              </div>

              {/* Today's cost */}
              <div className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] p-5">
                <div className="mb-1 flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Today
                </div>
                <div className="text-2xl font-bold text-[var(--color-text-primary)]">
                  {usageData.daily.length > 0
                    ? formatCostShort(usageData.daily[0].totalCost)
                    : "$0.00"}
                </div>
                <div className="mt-1 text-[10px] text-[var(--color-text-tertiary)]">
                  {usageData.daily.length > 0
                    ? `${formatTokens(usageData.daily[0].totalTokens)} tokens`
                    : "No data"}
                </div>
              </div>

              {/* Total tokens */}
              <div className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] p-5">
                <div className="mb-1 flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
                  <Zap className="h-3.5 w-3.5" />
                  Total Tokens ({usageData.days}d)
                </div>
                <div className="text-2xl font-bold text-[var(--color-text-primary)]">
                  {formatTokens(usageData.totals.totalTokens)}
                </div>
                <div className="mt-1 text-[10px] text-[var(--color-text-tertiary)]">
                  In {formatTokens(usageData.totals.input)} · Out{" "}
                  {formatTokens(usageData.totals.output)}
                </div>
              </div>
            </div>

            {/* Daily Cost Chart — last 14 days */}
            {usageData.daily.length > 0 && (() => {
              const chartDays = usageData.daily.slice(0, 14).reverse();
              const maxCost = Math.max(...chartDays.map((d) => d.totalCost), 0.01);

              return (
                <div className="mt-6 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] p-5">
                  <h3 className="mb-4 text-sm font-semibold text-[var(--color-text-primary)]">
                    Daily Cost (last 14 days)
                  </h3>
                  <div className="flex items-end gap-[3px]" style={{ height: 160 }}>
                    {chartDays.map((day) => {
                      const heightPct = Math.max((day.totalCost / maxCost) * 100, 2);
                      const label = day.date.slice(5); // MM-DD
                      return (
                        <div
                          key={day.date}
                          className="group relative flex flex-1 flex-col items-center justify-end"
                          style={{ height: "100%" }}
                        >
                          {/* Tooltip on hover */}
                          <div className="pointer-events-none absolute -top-8 z-10 hidden whitespace-nowrap rounded bg-[var(--color-bg-tertiary)] px-2 py-1 text-[10px] text-[var(--color-text-primary)] shadow-lg group-hover:block">
                            {day.date}: {formatCost(day.totalCost)}
                          </div>
                          {/* Bar */}
                          <div
                            className="w-full rounded-t bg-[var(--color-accent)] transition-all group-hover:opacity-80"
                            style={{ height: `${heightPct}%`, minHeight: 2 }}
                          />
                          {/* Date label */}
                          <span
                            className="mt-1 origin-top-left text-[8px] text-[var(--color-text-tertiary)]"
                            style={{ transform: "rotate(45deg)", whiteSpace: "nowrap" }}
                          >
                            {label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Cost Breakdown Table */}
            {usageData.daily.length > 0 && (
              <div className="mt-6 overflow-hidden rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)]">
                <div className="border-b border-[var(--color-border-subtle)] px-5 py-3">
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                    Cost Breakdown
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]">
                        <th className="px-5 py-2 text-left font-medium">Date</th>
                        <th className="px-3 py-2 text-right font-medium">Tokens</th>
                        <th className="px-3 py-2 text-right font-medium">Input Cost</th>
                        <th className="px-3 py-2 text-right font-medium">Output Cost</th>
                        <th className="px-5 py-2 text-right font-medium">Total Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border-subtle)]">
                      {usageData.daily.map((day) => (
                        <tr key={day.date} className="text-[var(--color-text-primary)]">
                          <td className="px-5 py-2 font-mono">{day.date}</td>
                          <td className="px-3 py-2 text-right">
                            {formatTokens(day.totalTokens)}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {formatCost(day.inputCost)}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {formatCost(day.outputCost)}
                          </td>
                          <td className="px-5 py-2 text-right font-semibold">
                            {formatCost(day.totalCost)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-[var(--color-border-strong)] bg-[var(--color-bg-tertiary)] font-semibold text-[var(--color-text-primary)]">
                        <td className="px-5 py-2">Total</td>
                        <td className="px-3 py-2 text-right">
                          {formatTokens(usageData.totals.totalTokens)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {formatCost(usageData.totals.inputCost)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {formatCost(usageData.totals.outputCost)}
                        </td>
                        <td className="px-5 py-2 text-right">
                          {formatCost(usageData.totals.totalCost)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Cost Tips */}
            <div className="mt-6 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] p-5">
              <div className="mb-3 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                  Cost Tips
                </h3>
              </div>
              <ul className="space-y-2 text-xs text-[var(--color-text-secondary)]">
                <li className="flex gap-2">
                  <span className="text-[var(--color-text-tertiary)]">•</span>
                  Use smaller, cheaper models (e.g. Haiku) for routine tasks like linting and formatting.
                </li>
                <li className="flex gap-2">
                  <span className="text-[var(--color-text-tertiary)]">•</span>
                  Enable prompt caching to reduce repeat input costs on long conversations.
                </li>
                <li className="flex gap-2">
                  <span className="text-[var(--color-text-tertiary)]">•</span>
                  Keep system prompts concise — large context windows drive up input token counts.
                </li>
                <li className="flex gap-2">
                  <span className="text-[var(--color-text-tertiary)]">•</span>
                  Set session token limits to prevent runaway costs from long-running agents.
                </li>
                <li className="flex gap-2">
                  <span className="text-[var(--color-text-tertiary)]">•</span>
                  Review days with unusually high usage to identify inefficient workflows.
                </li>
              </ul>
            </div>
          </>
        )}
      </div>
    </>
  );
}
