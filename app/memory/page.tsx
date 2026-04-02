// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2026 Anil Belur <askb23@gmail.com>

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Header from "@/components/layout/Header";
import { Search, Brain, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import type { MemoryEntry } from "@/lib/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MemoryResponse {
  entries: MemoryEntry[];
  source: "live" | "mock";
}

type EntryType = "all" | "decision" | "action" | "context" | "error";

const TYPE_FILTERS: EntryType[] = ["all", "decision", "action", "context", "error"];

const TYPE_COLORS: Record<string, string> = {
  decision: "bg-purple-500/15 text-purple-400",
  action: "bg-blue-500/15 text-blue-400",
  context: "bg-emerald-500/15 text-emerald-400",
  error: "bg-red-500/15 text-red-400",
};

const TYPE_FILTER_COLORS: Record<string, string> = {
  all: "bg-[var(--color-accent)] text-white",
  decision: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  action: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  context: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  error: "bg-red-500/20 text-red-400 border-red-500/30",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MemoryPage() {
  const [data, setData] = useState<MemoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<EntryType>("all");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      const resp = await fetch("/api/memory");
      if (!resp.ok) throw new Error(`${resp.status} ${resp.statusText}`);
      const json = (await resp.json()) as MemoryResponse;
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
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    const timer = setInterval(fetchData, 60_000);
    return () => {
      mountedRef.current = false;
      clearInterval(timer);
    };
  }, [fetchData]);

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Filter entries by search + type
  const entries = data?.entries ?? [];
  const filtered = entries.filter((e) => {
    if (typeFilter !== "all" && e.type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        e.title.toLowerCase().includes(q) ||
        e.content.toLowerCase().includes(q) ||
        e.agent.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Group by date (newest first)
  const grouped = filtered.reduce<Record<string, MemoryEntry[]>>((acc, e) => {
    (acc[e.date] ??= []).push(e);
    return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <>
      <Header
        title="Memory"
        subtitle="Searchable journal of agent long-term and short-term memory"
      />
      <div className="flex-1 overflow-auto p-6">
        {/* Source badge */}
        {data && (
          <div className="mb-4 flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                data.source === "live"
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-yellow-500/15 text-yellow-400"
              }`}
            >
              {data.source === "live" ? "📡 Live" : "🎭 Demo"}
            </span>
            <span className="text-[10px] text-[var(--color-text-tertiary)]">
              {filtered.length} entries
            </span>
          </div>
        )}

        {/* Search + type filters */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search memory entries..."
              className="h-9 w-full rounded-md border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] pl-10 pr-4 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-accent)] focus:outline-none"
            />
          </div>
        </div>
        <div className="mb-6 flex flex-wrap gap-2">
          {TYPE_FILTERS.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`rounded-full border px-3 py-1 text-[11px] font-medium capitalize transition-colors ${
                typeFilter === t
                  ? TYPE_FILTER_COLORS[t]
                  : "border-[var(--color-border-default)] text-[var(--color-text-tertiary)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-secondary)]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] p-4"
              >
                <div className="flex gap-4">
                  <div className="h-4 w-4 rounded bg-[var(--color-bg-tertiary)]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-2/3 rounded bg-[var(--color-bg-tertiary)]" />
                    <div className="h-3 w-full rounded bg-[var(--color-bg-tertiary)]" />
                    <div className="h-2 w-1/3 rounded bg-[var(--color-bg-tertiary)]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            Failed to load memory entries: {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Brain className="mb-3 h-10 w-10 text-[var(--color-text-tertiary)]" />
            <p className="text-sm text-[var(--color-text-secondary)]">
              No memory entries found
            </p>
            <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
              {search || typeFilter !== "all"
                ? "Try adjusting your search or filter"
                : "Entries will appear as agents record decisions and actions"}
            </p>
          </div>
        )}

        {/* Timeline grouped by date */}
        {!loading && (
          <div className="space-y-8">
            {sortedDates.map((date) => (
              <div key={date}>
                <h2 className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">
                  {date}
                </h2>
                <div className="space-y-2">
                  {grouped[date].map((entry) => {
                    const isExpanded = expandedIds.has(entry.id);
                    return (
                      <button
                        key={entry.id}
                        type="button"
                        onClick={() => toggleExpanded(entry.id)}
                        className="flex w-full cursor-pointer gap-4 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] p-4 text-left transition-colors hover:border-[var(--color-border-default)]"
                      >
                        <div className="flex flex-col items-center">
                          <Brain className="h-4 w-4 text-[var(--color-text-tertiary)]" />
                          <div className="mt-2 h-full w-px bg-[var(--color-border-subtle)]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {isExpanded ? (
                              <ChevronDown className="h-3 w-3 shrink-0 text-[var(--color-text-tertiary)]" />
                            ) : (
                              <ChevronRight className="h-3 w-3 shrink-0 text-[var(--color-text-tertiary)]" />
                            )}
                            <span className="text-xs font-medium text-[var(--color-text-primary)]">
                              {entry.title}
                            </span>
                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] ${TYPE_COLORS[entry.type]}`}
                            >
                              {entry.type}
                            </span>
                          </div>
                          <p
                            className={`mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)] ${
                              isExpanded ? "" : "line-clamp-2"
                            }`}
                          >
                            {entry.content}
                          </p>
                          <div className="mt-2 flex items-center gap-3 text-[10px] text-[var(--color-text-tertiary)]">
                            <span>{entry.time}</span>
                            <span>·</span>
                            <span>{entry.agent}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
