// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2026 Anil Belur <askb23@gmail.com>

import Header from "@/components/layout/Header";
import { ChevronLeft, ChevronRight } from "lucide-react";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const events = [
  { day: 2, label: "Security audit cron", type: "cron" },
  { day: 5, label: "Memory cleanup", type: "cron" },
  { day: 8, label: "Dashboard Phase 1 due", type: "task" },
  { day: 12, label: "Weekly backup", type: "cron" },
  { day: 15, label: "Dependency update scan", type: "cron" },
  { day: 19, label: "Weekly backup", type: "cron" },
  { day: 22, label: "Dashboard Phase 2 due", type: "task" },
  { day: 26, label: "Weekly backup", type: "cron" },
];

const typeColors: Record<string, string> = {
  cron: "bg-[var(--color-info)]/20 text-[var(--color-info)]",
  task: "bg-[var(--color-accent-muted)] text-[var(--color-text-accent)]",
};

export default function CalendarPage() {
  const totalDays = 30;
  const startDay = 1; // Tuesday (0=Mon)

  return (
    <>
      <Header
        title="Calendar"
        subtitle="Scheduled cron jobs and proactive automated tasks"
      />
      <div className="flex-1 overflow-auto p-6">
        {/* Month navigation */}
        <div className="mb-6 flex items-center gap-4">
          <button className="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-[var(--color-bg-hover)]">
            <ChevronLeft className="h-4 w-4 text-[var(--color-text-secondary)]" />
          </button>
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
            April 2026
          </h2>
          <button className="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-[var(--color-bg-hover)]">
            <ChevronRight className="h-4 w-4 text-[var(--color-text-secondary)]" />
          </button>
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-px rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-border-subtle)]">
          {/* Day headers */}
          {days.map((d) => (
            <div
              key={d}
              className="bg-[var(--color-bg-secondary)] px-3 py-2 text-center text-xs font-medium text-[var(--color-text-tertiary)]"
            >
              {d}
            </div>
          ))}

          {/* Empty cells before month start */}
          {Array.from({ length: startDay }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="min-h-24 bg-[var(--color-bg-primary)] p-2"
            />
          ))}

          {/* Day cells */}
          {Array.from({ length: totalDays }).map((_, i) => {
            const day = i + 1;
            const isToday = day === 2;
            const dayEvents = events.filter((e) => e.day === day);
            return (
              <div
                key={day}
                className="min-h-24 bg-[var(--color-bg-primary)] p-2 transition-colors hover:bg-[var(--color-bg-secondary)]"
              >
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                    isToday
                      ? "bg-[var(--color-accent)] text-white font-semibold"
                      : "text-[var(--color-text-secondary)]"
                  }`}
                >
                  {day}
                </span>
                <div className="mt-1 space-y-1">
                  {dayEvents.map((ev, ei) => (
                    <div
                      key={ei}
                      className={`truncate rounded px-1.5 py-0.5 text-[10px] ${typeColors[ev.type]}`}
                    >
                      {ev.label}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
