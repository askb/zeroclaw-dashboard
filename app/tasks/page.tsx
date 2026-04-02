// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2026 Anil Belur <askb23@gmail.com>

"use client";

import Header from "@/components/layout/Header";
import {
  Circle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Wifi,
  WifiOff,
  Loader2,
} from "lucide-react";
import { useTasks, useGatewayConnection, useActivityFeed } from "@/lib/hooks";
import { timeAgo } from "@/lib/utils";
import type { Task } from "@/lib/types";

// Column definitions
const columnDefs = [
  {
    id: "backlog" as const,
    label: "Backlog",
    icon: Circle,
    color: "var(--color-text-tertiary)",
  },
  {
    id: "in_progress" as const,
    label: "In Progress",
    icon: Clock,
    color: "var(--color-warning)",
  },
  {
    id: "review" as const,
    label: "In Review",
    icon: AlertCircle,
    color: "var(--color-info)",
  },
  {
    id: "done" as const,
    label: "Done",
    icon: CheckCircle2,
    color: "var(--color-success)",
  },
];

const priorityColors: Record<string, string> = {
  high: "bg-[var(--color-error)]/20 text-[var(--color-error)]",
  medium: "bg-[var(--color-warning)]/20 text-[var(--color-warning)]",
  low: "bg-[var(--color-text-tertiary)]/20 text-[var(--color-text-secondary)]",
};

function ConnectionIndicator({
  status,
}: {
  status: "connected" | "connecting" | "disconnected" | "demo";
}) {
  const config = {
    connected: {
      icon: Wifi,
      label: "Live",
      className: "text-[var(--color-success)]",
    },
    connecting: {
      icon: Loader2,
      label: "Connecting…",
      className: "text-[var(--color-warning)] animate-spin",
    },
    disconnected: {
      icon: WifiOff,
      label: "Offline",
      className: "text-[var(--color-error)]",
    },
    demo: {
      icon: WifiOff,
      label: "Demo Mode",
      className: "text-[var(--color-text-tertiary)]",
    },
  }[status];

  const Icon = config.icon;

  return (
    <div className="flex items-center gap-1.5">
      <Icon className={`h-3.5 w-3.5 ${config.className}`} />
      <span className="text-[10px] font-medium text-[var(--color-text-tertiary)]">
        {config.label}
      </span>
    </div>
  );
}

export default function TasksPage() {
  const { tasks, isLive, loading } = useTasks();
  const { status } = useGatewayConnection();
  const { events } = useActivityFeed();

  // Group tasks into columns
  const columns = columnDefs.map((col) => ({
    ...col,
    tasks: tasks.filter((t: Task) => t.status === col.id),
  }));

  return (
    <>
      <Header
        title="Tasks"
        subtitle="Kanban board — track agent work across all projects"
      />

      {/* Status bar */}
      <div className="flex items-center gap-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] px-6 py-1.5">
        <ConnectionIndicator status={status} />
        {!isLive && status !== "connecting" && (
          <span className="rounded-full bg-[var(--color-warning)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--color-warning)]">
            Demo Data
          </span>
        )}
        {loading && (
          <Loader2 className="h-3 w-3 animate-spin text-[var(--color-text-tertiary)]" />
        )}
      </div>

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
                {col.tasks.map((task: Task) => (
                  <div
                    key={task.id}
                    className="cursor-pointer rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] p-3 transition-colors hover:border-[var(--color-border-default)]"
                  >
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">
                      {task.title}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-[var(--color-text-tertiary)]">
                        {task.agent ?? "Unassigned"}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${priorityColors[task.priority] ?? ""}`}
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
            {events.map((event) => (
              <div key={event.id} className="flex gap-3">
                <div
                  className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                    event.type === "success"
                      ? "bg-[var(--color-success)]"
                      : event.type === "warning"
                        ? "bg-[var(--color-warning)]"
                        : event.type === "error"
                          ? "bg-[var(--color-error)]"
                          : "bg-[var(--color-accent)]"
                  }`}
                />
                <div>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    {event.text}
                  </p>
                  <p className="text-[10px] text-[var(--color-text-tertiary)]">
                    {timeAgo(new Date(event.timestamp))}
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
