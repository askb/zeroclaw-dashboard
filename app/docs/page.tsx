// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2026 Anil Belur <askb23@gmail.com>

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Header from "@/components/layout/Header";
import {
  FileText,
  Search,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  Loader2,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DocFile {
  path: string;
  title: string;
  category: string;
  updatedAt: string;
  lines: number;
  content?: string;
}

interface DocsResponse {
  docs: DocFile[];
  source: "live" | "mock";
}

const CATEGORIES = ["All", "Governance", "Architecture", "Agents", "Operations"];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DocsPage() {
  const [data, setData] = useState<DocsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      const resp = await fetch("/api/docs");
      if (!resp.ok) throw new Error(`${resp.status} ${resp.statusText}`);
      const json = (await resp.json()) as DocsResponse;
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
    return () => {
      mountedRef.current = false;
    };
  }, [fetchData]);

  const toggleExpanded = (path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  // Filter docs
  const docs = data?.docs ?? [];
  const filtered = docs.filter((d) => {
    if (activeCategory !== "All" && d.category !== activeCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        d.title.toLowerCase().includes(q) ||
        d.path.toLowerCase().includes(q) ||
        (d.content?.toLowerCase().includes(q) ?? false)
      );
    }
    return true;
  });

  // Group by category
  const grouped = filtered.reduce<Record<string, DocFile[]>>((acc, d) => {
    (acc[d.category] ??= []).push(d);
    return acc;
  }, {});
  const sortedCategories = Object.keys(grouped).sort();

  return (
    <>
      <Header
        title="Docs"
        subtitle="Centralized repository for architecture, governance, and plans"
      />
      <div className="flex-1 overflow-auto p-6">
        {/* Source badge + count */}
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
              {filtered.length} of {docs.length} docs
            </span>
          </div>
        )}

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documentation..."
            className="h-9 w-full rounded-md border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] pl-10 pr-4 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-accent)] focus:outline-none"
          />
        </div>

        {/* Category tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-colors ${
                activeCategory === cat
                  ? "border-[var(--color-accent)] bg-[var(--color-accent-muted)] text-[var(--color-text-accent)]"
                  : "border-[var(--color-border-default)] text-[var(--color-text-tertiary)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-secondary)]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-32 animate-pulse rounded bg-[var(--color-bg-tertiary)]" />
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 2 }).map((_, j) => (
                    <div
                      key={j}
                      className="animate-pulse rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] p-4"
                    >
                      <div className="space-y-2">
                        <div className="h-3 w-3/4 rounded bg-[var(--color-bg-tertiary)]" />
                        <div className="h-2 w-full rounded bg-[var(--color-bg-tertiary)]" />
                        <div className="h-2 w-1/2 rounded bg-[var(--color-bg-tertiary)]" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            Failed to load docs: {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="mb-3 h-10 w-10 text-[var(--color-text-tertiary)]" />
            <p className="text-sm text-[var(--color-text-secondary)]">
              No documentation found
            </p>
            <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
              {search || activeCategory !== "All"
                ? "Try adjusting your search or category filter"
                : "Documentation files will appear when available"}
            </p>
          </div>
        )}

        {/* Doc categories */}
        {!loading && (
          <div className="space-y-6">
            {sortedCategories.map((cat) => (
              <div key={cat}>
                <div className="mb-3 flex items-center gap-2">
                  <FolderOpen className="h-4 w-4 text-[var(--color-text-tertiary)]" />
                  <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                    {cat}
                  </h2>
                  <span className="text-xs text-[var(--color-text-tertiary)]">
                    ({grouped[cat].length})
                  </span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {grouped[cat].map((doc) => {
                    const isExpanded = expandedPaths.has(doc.path);
                    return (
                      <div
                        key={doc.path}
                        className="cursor-pointer rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] transition-colors hover:border-[var(--color-border-default)]"
                      >
                        <button
                          type="button"
                          onClick={() => toggleExpanded(doc.path)}
                          className="flex w-full items-start gap-2 p-4 text-left"
                        >
                          <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-accent)]" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronDown className="h-3 w-3 shrink-0 text-[var(--color-text-tertiary)]" />
                              ) : (
                                <ChevronRight className="h-3 w-3 shrink-0 text-[var(--color-text-tertiary)]" />
                              )}
                              <h3 className="text-sm font-medium text-[var(--color-text-primary)]">
                                {doc.title}
                              </h3>
                            </div>
                            <p className="mt-1 font-mono text-[10px] text-[var(--color-text-tertiary)]">
                              {doc.path}
                            </p>
                            <div className="mt-2 flex items-center gap-3 text-[10px] text-[var(--color-text-tertiary)]">
                              <span className="rounded-full bg-[var(--color-accent-muted)] px-1.5 py-0.5 text-[var(--color-text-accent)]">
                                {doc.category}
                              </span>
                              <span>{doc.updatedAt}</span>
                              <span>·</span>
                              <span>{doc.lines} lines</span>
                            </div>
                          </div>
                        </button>
                        {isExpanded && (
                          <div className="border-t border-[var(--color-border-subtle)] px-4 py-3">
                            {doc.content ? (
                              <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-[var(--color-text-secondary)]">
                                {doc.content}
                              </pre>
                            ) : (
                              <p className="text-xs italic text-[var(--color-text-tertiary)]">
                                Content preview not available
                              </p>
                            )}
                          </div>
                        )}
                      </div>
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
