// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2026 Anil Belur <askb23@gmail.com>

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Header from "@/components/layout/Header";
import {
  Target,
  ArrowRight,
  Sparkles,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  Clock,
} from "lucide-react";
import type { Task } from "@/lib/types";

/* ── Project group definitions with keyword matching ───────────────────── */

const PROJECT_GROUPS = [
  {
    id: "infra",
    name: "ZeroClaw Infrastructure",
    description:
      "Core platform: gateway, Caddy HTTPS, Docker, SearXNG, custom MC deployment",
    keywords: [
      "caddy",
      "proxy",
      "docker",
      "deploy",
      "searxng",
      "replace",
      "mission control",
      "crshdn",
    ],
  },
  {
    id: "dashboard",
    name: "Custom Dashboard",
    description:
      "Linear-inspired Next.js dashboard for agent management and monitoring",
    keywords: ["dashboard", "phase", "memory screen", "canvas", "office"],
  },
  {
    id: "skills",
    name: "Skill Expansion",
    description:
      "n8n automation, Home Assistant, Discord integration, coding agents",
    keywords: [
      "n8n",
      "home assistant",
      "discord",
      "coding agent",
      "claude code",
      "skill",
    ],
  },
  {
    id: "security",
    name: "Security Hardening",
    description:
      "Exec approvals, secrets isolation, constitution, governance framework",
    keywords: [
      "security",
      "exec",
      "approval",
      "constitution",
      "spec kit",
      "governance",
      "isolate",
      "secret",
    ],
  },
] as const;

/* ── Types ─────────────────────────────────────────────────────────────── */

interface ProjectData {
  id: string;
  name: string;
  description: string;
  status: "active" | "planning" | "completed";
  tasks: Task[];
  done: number;
  total: number;
  progress: number;
}

interface TasksResponse {
  tasks: Task[];
  source: "live" | "mock";
}

/* ── Helpers ───────────────────────────────────────────────────────────── */

function classifyTasks(tasks: Task[]): ProjectData[] {
  const assigned = new Set<string>();

  return PROJECT_GROUPS.map((group) => {
    const groupTasks = tasks.filter((task) => {
      if (assigned.has(task.id)) return false;
      const text = `${task.title} ${task.description ?? ""}`.toLowerCase();
      const matches = group.keywords.some((kw) => text.includes(kw));
      if (matches) assigned.add(task.id);
      return matches;
    });

    const done = groupTasks.filter((t) => t.status === "done").length;
    const total = groupTasks.length;
    const progress = total > 0 ? Math.round((done / total) * 100) : 0;

    let status: "active" | "planning" | "completed" = "planning";
    if (progress === 100 && total > 0) status = "completed";
    else if (done > 0 || groupTasks.some((t) => t.status === "in_progress"))
      status = "active";

    return {
      id: group.id,
      name: group.name,
      description: group.description,
      status,
      tasks: groupTasks,
      done,
      total,
      progress,
    };
  });
}

function generateSuggestions(tasks: Task[]): string[] {
  const pending = tasks.filter((t) => t.status !== "done");
  const suggestions: string[] = [];

  for (const task of pending) {
    if (suggestions.length >= 3) break;
    const title = task.title.toLowerCase();
    if (title.includes("discord")) {
      suggestions.push("Connect Discord channel to expand communication reach");
    } else if (title.includes("dashboard") || title.includes("phase")) {
      suggestions.push(
        `Complete "${task.title}" to advance the dashboard roadmap`,
      );
    } else if (title.includes("n8n")) {
      suggestions.push(
        "Wire n8n automation to unlock orchestrator workflow triggers",
      );
    } else if (title.includes("home assistant")) {
      suggestions.push(
        "Integrate Home Assistant for smart-home control capabilities",
      );
    } else if (title.includes("security") || title.includes("audit")) {
      suggestions.push("Run security audit to close remaining hardening gaps");
    } else if (title.includes("secret")) {
      suggestions.push(
        "Finalize secrets isolation to reach zero plaintext exposure",
      );
    }
  }

  if (suggestions.length === 0) {
    suggestions.push(
      "All tracked tasks are complete — consider adding new goals",
    );
  }

  return suggestions.slice(0, 3);
}

/* ── Sub-components ────────────────────────────────────────────────────── */

const STATUS_STYLES: Record<string, string> = {
  active: "bg-[var(--color-success)]/20 text-[var(--color-success)]",
  planning: "bg-[var(--color-warning)]/20 text-[var(--color-warning)]",
  completed: "bg-[var(--color-info)]/20 text-[var(--color-info)]",
};

function TaskStatusIcon({ status }: { status: string }) {
  switch (status) {
    case "done":
      return (
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[var(--color-success)]" />
      );
    case "in_progress":
      return (
        <Clock className="h-3.5 w-3.5 shrink-0 text-[var(--color-warning)]" />
      );
    default:
      return (
        <Circle className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-tertiary)]" />
      );
  }
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] p-5">
      <div className="flex items-start justify-between">
        <div className="h-4 w-36 rounded bg-[var(--color-bg-tertiary)]" />
        <div className="h-4 w-14 rounded-full bg-[var(--color-bg-tertiary)]" />
      </div>
      <div className="mt-3 h-3 w-full rounded bg-[var(--color-bg-tertiary)]" />
      <div className="mt-1.5 h-3 w-2/3 rounded bg-[var(--color-bg-tertiary)]" />
      <div className="mt-5">
        <div className="h-1.5 w-full rounded-full bg-[var(--color-bg-tertiary)]" />
      </div>
    </div>
  );
}

/* ── Page component ────────────────────────────────────────────────────── */

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [source, setSource] = useState<"live" | "mock" | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const mountedRef = useRef(true);

  const fetchTasks = useCallback(async () => {
    try {
      const resp = await fetch("/api/tasks");
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data: TasksResponse = await resp.json();

      if (mountedRef.current) {
        setAllTasks(data.tasks);
        setProjects(classifyTasks(data.tasks));
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
    fetchTasks();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchTasks]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const suggestions = generateSuggestions(allTasks);

  return (
    <>
      <Header
        title="Projects"
        subtitle="High-level goals with reverse prompting"
      />
      <div className="flex-1 overflow-auto p-6">
        {/* Source badge */}
        {source && (
          <div className="mb-4 flex items-center gap-2">
            <span className="rounded-full bg-[var(--color-bg-tertiary)] px-2.5 py-0.5 text-[10px] font-medium text-[var(--color-text-secondary)]">
              {source === "live" ? "📡 Live" : "🎭 Demo"}
            </span>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <>
            <div className="mb-6 h-28 animate-pulse rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)]" />
            <div className="grid gap-4 lg:grid-cols-2">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="rounded-lg border border-[var(--color-error)]/30 bg-[var(--color-error)]/10 p-4 text-sm text-[var(--color-error)]">
            Failed to load tasks: {error}
          </div>
        )}

        {/* Content */}
        {!loading && !error && (
          <>
            {/* AI Reverse Prompt card */}
            <div className="mb-6 rounded-lg border border-[var(--color-accent-muted)] bg-[var(--color-accent-muted)] p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-5 w-5 text-[var(--color-text-accent)]" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-[var(--color-text-accent)]">
                    AI Reverse Prompt — Suggested Next Actions
                  </h3>
                  <ul className="mt-2 space-y-1.5">
                    {suggestions.map((s, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)]"
                      >
                        <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-text-accent)]" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Project cards */}
            <div className="grid gap-4 lg:grid-cols-2">
              {projects.map((p) => {
                const isExpanded = expanded.has(p.id);
                return (
                  <div
                    key={p.id}
                    className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] transition-colors hover:border-[var(--color-border-default)]"
                  >
                    {/* Card header — clickable to expand */}
                    <button
                      type="button"
                      onClick={() => toggleExpand(p.id)}
                      className="flex w-full items-start justify-between p-5 text-left"
                    >
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-[var(--color-text-tertiary)]" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-[var(--color-text-tertiary)]" />
                        )}
                        <Target className="h-4 w-4 text-[var(--color-accent)]" />
                        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                          {p.name}
                        </h3>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLES[p.status]}`}
                      >
                        {p.status}
                      </span>
                    </button>

                    <div className="px-5 pb-5">
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        {p.description}
                      </p>

                      {/* Progress bar */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-[var(--color-text-tertiary)]">
                            {p.done}/{p.total} tasks
                          </span>
                          <span className="text-[var(--color-text-secondary)]">
                            {p.progress}%
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 rounded-full bg-[var(--color-bg-tertiary)]">
                          <div
                            className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-500"
                            style={{ width: `${p.progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Expanded task list */}
                      {isExpanded && p.tasks.length > 0 && (
                        <div className="mt-4 space-y-1.5 border-t border-[var(--color-border-subtle)] pt-3">
                          {p.tasks.map((task) => (
                            <div
                              key={task.id}
                              className="flex items-center gap-2 rounded px-2 py-1.5 text-xs hover:bg-[var(--color-bg-hover)]"
                            >
                              <TaskStatusIcon status={task.status} />
                              <span className="flex-1 text-[var(--color-text-primary)]">
                                {task.title}
                              </span>
                              <span className="text-[10px] text-[var(--color-text-tertiary)]">
                                {task.status.replace("_", " ")}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {isExpanded && p.tasks.length === 0 && (
                        <p className="mt-4 border-t border-[var(--color-border-subtle)] pt-3 text-xs text-[var(--color-text-tertiary)]">
                          No tasks matched this project group yet.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </>
  );
}
