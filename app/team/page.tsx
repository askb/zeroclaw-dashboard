// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2026 Anil Belur <askb23@gmail.com>

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Header from "@/components/layout/Header";
import {
  Bot,
  Shield,
  Code,
  Search,
  Zap,
  RefreshCw,
  Users,
} from "lucide-react";
import type { Agent } from "@/lib/types";

/* ── Constants ─────────────────────────────────────────────────────────── */

const MISSION_STATEMENT =
  "To build a zero-trust AI agent orchestration platform that is secure by default, analysis-first, and accountable through transparent governance.";

const POLL_INTERVAL_MS = 30_000;

const AGENT_ICON_MAP: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  orchestrator: Zap,
  "code-architect": Code,
  "research-specialist": Search,
  security: Shield,
  main: Bot,
};

const STATUS_COLORS: Record<string, string> = {
  online: "bg-[var(--color-success)]",
  busy: "bg-[var(--color-warning)]",
  idle: "bg-[var(--color-text-tertiary)]",
  offline: "bg-[var(--color-error)]",
};

/* ── Types ─────────────────────────────────────────────────────────────── */

interface AgentsResponse {
  agents: Agent[];
  source: "live" | "mock";
}

/* ── Sub-components ────────────────────────────────────────────────────── */

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] p-5">
      <div className="flex items-start justify-between">
        <div className="h-10 w-10 rounded-lg bg-[var(--color-bg-tertiary)]" />
        <div className="h-3 w-12 rounded bg-[var(--color-bg-tertiary)]" />
      </div>
      <div className="mt-3 h-4 w-28 rounded bg-[var(--color-bg-tertiary)]" />
      <div className="mt-1 h-3 w-16 rounded bg-[var(--color-bg-tertiary)]" />
      <div className="mt-3 h-3 w-full rounded bg-[var(--color-bg-tertiary)]" />
      <div className="mt-4 flex gap-1">
        <div className="h-4 w-16 rounded-full bg-[var(--color-bg-tertiary)]" />
        <div className="h-4 w-20 rounded-full bg-[var(--color-bg-tertiary)]" />
      </div>
    </div>
  );
}

function AgentCard({ agent }: { agent: Agent }) {
  const Icon = AGENT_ICON_MAP[agent.id] ?? Bot;
  return (
    <div className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] p-5 transition-colors hover:border-[var(--color-border-default)]">
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-bg-tertiary)]">
          <Icon className="h-5 w-5 text-[var(--color-accent)]" />
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className={`h-2 w-2 rounded-full ${STATUS_COLORS[agent.status] ?? STATUS_COLORS.offline}`}
          />
          <span className="text-[10px] text-[var(--color-text-tertiary)]">
            {agent.status}
          </span>
        </div>
      </div>
      <h3 className="mt-3 text-sm font-semibold text-[var(--color-text-primary)]">
        {agent.name}
      </h3>
      <p className="text-xs text-[var(--color-text-accent)]">{agent.role}</p>
      <p className="mt-2 text-xs leading-relaxed text-[var(--color-text-secondary)]">
        {agent.description}
      </p>
      <div className="mt-3 flex flex-wrap gap-1">
        {agent.skills.map((skill) => (
          <span
            key={skill}
            className="rounded-full bg-[var(--color-bg-tertiary)] px-2 py-0.5 text-[10px] text-[var(--color-text-tertiary)]"
          >
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Page component ────────────────────────────────────────────────────── */

export default function TeamPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [source, setSource] = useState<"live" | "mock" | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchAgents = useCallback(async () => {
    try {
      const resp = await fetch("/api/agents");
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data: AgentsResponse = await resp.json();

      if (mountedRef.current) {
        setAgents(data.agents);
        setSource(data.source);
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchAgents();
    const interval = setInterval(fetchAgents, POLL_INTERVAL_MS);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchAgents]);

  // Split: orchestrator at top of hierarchy, others below
  const orchestrator = agents.find(
    (a) =>
      a.id === "orchestrator" ||
      a.name.toLowerCase().includes("orchestrator") ||
      a.role.toLowerCase() === "manager",
  );
  const childAgents = agents.filter((a) => a.id !== orchestrator?.id);

  return (
    <>
      <Header
        title="Team"
        subtitle="Agent organizational chart and status"
      />
      <div className="flex-1 overflow-auto p-6">
        {/* Mission statement */}
        <div className="mb-8 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] p-6 text-center">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
            Mission Statement
          </h2>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-[var(--color-text-secondary)]">
            {MISSION_STATEMENT}
          </p>
        </div>

        {/* Header row: roster label, source badge, refresh */}
        <div className="mb-6 flex items-center gap-3">
          <Users className="h-4 w-4 text-[var(--color-text-tertiary)]" />
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Agent Roster
          </h2>
          {!loading && (
            <span className="text-xs text-[var(--color-text-tertiary)]">
              ({agents.length} agent{agents.length !== 1 ? "s" : ""})
            </span>
          )}
          {source && (
            <span className="rounded-full bg-[var(--color-bg-tertiary)] px-2.5 py-0.5 text-[10px] font-medium text-[var(--color-text-secondary)]">
              {source === "live"
                ? `📡 Live · ${agents.length} agents`
                : "🎭 Demo"}
            </span>
          )}
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              fetchAgents();
            }}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-md border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] px-3 py-1.5 text-xs text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-border-strong)] disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3 w-3 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        {/* Loading state */}
        {loading && agents.length === 0 && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {/* Error state */}
        {error && !loading && agents.length === 0 && (
          <div className="rounded-lg border border-[var(--color-error)]/30 bg-[var(--color-error)]/10 p-4 text-sm text-[var(--color-error)]">
            Failed to load agents: {error}
          </div>
        )}

        {/* Org chart + agent cards */}
        {agents.length > 0 && (
          <>
            {/* ── Org chart (md+ screens) ────────────────────────────── */}
            {orchestrator && childAgents.length > 0 && (
              <div className="mb-8 hidden md:flex md:flex-col md:items-center">
                {/* Orchestrator card */}
                <div className="w-72">
                  <AgentCard agent={orchestrator} />
                </div>

                {/* Vertical connector down */}
                <div className="h-8 w-px bg-[var(--color-border-default)]" />

                {/* Horizontal connector bar */}
                <div
                  className="h-px bg-[var(--color-border-default)]"
                  style={{
                    width: `${Math.min(childAgents.length * 220, 880)}px`,
                  }}
                />

                {/* Child agents with vertical connectors */}
                <div
                  className="flex justify-around"
                  style={{
                    width: `${Math.min(childAgents.length * 220, 880)}px`,
                  }}
                >
                  {childAgents.map((agent) => (
                    <div
                      key={agent.id}
                      className="flex flex-col items-center"
                    >
                      <div className="h-8 w-px bg-[var(--color-border-default)]" />
                      <div className="w-52">
                        <AgentCard agent={agent} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Mobile / fallback grid ─────────────────────────────── */}
            <div
              className={
                orchestrator && childAgents.length > 0 ? "md:hidden" : ""
              }
            >
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {agents.map((agent) => (
                  <AgentCard key={agent.id} agent={agent} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
