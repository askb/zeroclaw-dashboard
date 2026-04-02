// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2026 Anil Belur <askb23@gmail.com>

import Header from "@/components/layout/Header";
import {
  LayoutDashboard,
  Circle,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const columns = [
  {
    id: "backlog",
    label: "Backlog",
    icon: Circle,
    color: "var(--color-text-tertiary)",
    tasks: [
      {
        id: "t1",
        title: "Configure n8n skill integration",
        agent: "Orchestrator",
        priority: "medium",
      },
      {
        id: "t2",
        title: "Configure Home Assistant skill",
        agent: "Orchestrator",
        priority: "low",
      },
    ],
  },
  {
    id: "in_progress",
    label: "In Progress",
    icon: Clock,
    color: "var(--color-warning)",
    tasks: [
      {
        id: "t3",
        title: "Build ZeroClaw Dashboard Phase 1",
        agent: "Code Architect",
        priority: "high",
      },
    ],
  },
  {
    id: "review",
    label: "In Review",
    icon: AlertCircle,
    color: "var(--color-info)",
    tasks: [],
  },
  {
    id: "done",
    label: "Done",
    icon: CheckCircle2,
    color: "var(--color-success)",
    tasks: [
      {
        id: "t4",
        title: "Security hardening — exec approvals",
        agent: "Code Architect",
        priority: "high",
      },
      {
        id: "t5",
        title: "Deploy SearXNG metasearch",
        agent: "Code Architect",
        priority: "medium",
      },
      {
        id: "t6",
        title: "Create Constitution & spec kit",
        agent: "Orchestrator",
        priority: "high",
      },
    ],
  },
];

const priorityColors: Record<string, string> = {
  high: "bg-[var(--color-error)]/20 text-[var(--color-error)]",
  medium: "bg-[var(--color-warning)]/20 text-[var(--color-warning)]",
  low: "bg-[var(--color-text-tertiary)]/20 text-[var(--color-text-secondary)]",
};

export default function TasksPage() {
  return (
    <>
      <Header
        title="Tasks"
        subtitle="Kanban board — track agent work across all projects"
      />
      <div className="flex flex-1 gap-4 overflow-x-auto p-6">
        {columns.map((col) => {
          const Icon = col.icon;
          return (
            <div
              key={col.id}
              className="flex w-72 shrink-0 flex-col rounded-lg"
            >
              {/* Column header */}
              <div className="flex items-center gap-2 px-1 pb-3">
                <Icon
                  className="h-4 w-4"
                  style={{ color: col.color }}
                />
                <span className="text-sm font-medium text-[var(--color-text-primary)]">
                  {col.label}
                </span>
                <span className="ml-auto rounded-full bg-[var(--color-bg-tertiary)] px-2 py-0.5 text-[11px] text-[var(--color-text-tertiary)]">
                  {col.tasks.length}
                </span>
              </div>

              {/* Task cards */}
              <div className="flex flex-1 flex-col gap-2">
                {col.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="cursor-pointer rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] p-3 transition-colors hover:border-[var(--color-border-default)]"
                  >
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">
                      {task.title}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-[var(--color-text-tertiary)]">
                        {task.agent}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${priorityColors[task.priority]}`}
                      >
                        {task.priority}
                      </span>
                    </div>
                  </div>
                ))}

                {col.tasks.length === 0 && (
                  <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-[var(--color-border-subtle)] py-8 text-xs text-[var(--color-text-tertiary)]">
                    No tasks
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Activity feed */}
        <div className="w-72 shrink-0 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)]">
          <div className="border-b border-[var(--color-border-subtle)] px-4 py-3">
            <h3 className="text-sm font-medium text-[var(--color-text-primary)]">
              Activity Feed
            </h3>
          </div>
          <div className="space-y-3 p-4">
            {[
              {
                time: "2m ago",
                text: "Code Architect completed security audit",
              },
              {
                time: "15m ago",
                text: "SearXNG returned 52 results from 6 engines",
              },
              { time: "1h ago", text: "Gateway started — 4 services healthy" },
              {
                time: "2h ago",
                text: "Exec approvals updated (30+ deny patterns)",
              },
            ].map((event, i) => (
              <div key={i} className="flex gap-3">
                <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent)]" />
                <div>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    {event.text}
                  </p>
                  <p className="text-[10px] text-[var(--color-text-tertiary)]">
                    {event.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
