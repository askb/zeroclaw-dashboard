// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2026 Anil Belur <askb23@gmail.com>

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Header from "@/components/layout/Header";
import { ChevronLeft, ChevronRight, X, Loader2 } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CalendarEvent {
  id?: string;
  day: number;
  label: string;
  type: "cron" | "task" | "milestone";
}

interface CalendarResponse {
  month: string;
  events: CalendarEvent[];
  source: "live" | "mock";
}

const DAYS_HEADER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const TYPE_COLORS: Record<string, string> = {
  cron: "bg-blue-500/20 text-blue-400",
  task: "bg-emerald-500/20 text-emerald-400",
  milestone: "bg-purple-500/20 text-purple-400",
};

const TYPE_DOT_COLORS: Record<string, string> = {
  cron: "bg-blue-400",
  task: "bg-emerald-400",
  milestone: "bg-purple-400",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function getMonthName(month: number): string {
  return new Date(2026, month - 1, 1).toLocaleString("default", {
    month: "long",
  });
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** Returns 0=Mon .. 6=Sun for the first day of the month. */
function getStartDayOfWeek(year: number, month: number): number {
  const jsDay = new Date(year, month - 1, 1).getDay(); // 0=Sun
  return jsDay === 0 ? 6 : jsDay - 1;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<CalendarResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch(
        `/api/calendar?month=${formatMonth(year, month)}`,
      );
      if (!resp.ok) throw new Error(`${resp.status} ${resp.statusText}`);
      const json = (await resp.json()) as CalendarResponse;
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
  }, [year, month]);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchData]);

  const goToPrevMonth = () => {
    setSelectedDay(null);
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    setSelectedDay(null);
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const totalDays = getDaysInMonth(year, month);
  const startDay = getStartDayOfWeek(year, month);
  const events = data?.events ?? [];
  const isCurrentMonth =
    year === now.getFullYear() && month === now.getMonth() + 1;
  const todayDay = isCurrentMonth ? now.getDate() : -1;

  const selectedDayEvents = selectedDay
    ? events.filter((e) => e.day === selectedDay)
    : [];

  return (
    <>
      <Header
        title="Calendar"
        subtitle="Scheduled cron jobs and proactive automated tasks"
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
              {events.length} events
            </span>
          </div>
        )}

        {/* Month navigation */}
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={goToPrevMonth}
            className="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-[var(--color-bg-hover)]"
          >
            <ChevronLeft className="h-4 w-4 text-[var(--color-text-secondary)]" />
          </button>
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
            {getMonthName(month)} {year}
          </h2>
          <button
            onClick={goToNextMonth}
            className="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-[var(--color-bg-hover)]"
          >
            <ChevronRight className="h-4 w-4 text-[var(--color-text-secondary)]" />
          </button>
          {loading && (
            <Loader2 className="h-4 w-4 animate-spin text-[var(--color-text-tertiary)]" />
          )}
        </div>

        <div className="flex gap-6">
          {/* Calendar grid */}
          <div className="flex-1">
            {/* Loading skeleton */}
            {loading && !data && (
              <div className="grid grid-cols-7 gap-px rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-border-subtle)]">
                {DAYS_HEADER.map((d) => (
                  <div
                    key={d}
                    className="bg-[var(--color-bg-secondary)] px-3 py-2 text-center text-xs font-medium text-[var(--color-text-tertiary)]"
                  >
                    {d}
                  </div>
                ))}
                {Array.from({ length: 35 }).map((_, i) => (
                  <div
                    key={i}
                    className="min-h-24 animate-pulse bg-[var(--color-bg-primary)] p-2"
                  >
                    <div className="h-3 w-4 rounded bg-[var(--color-bg-tertiary)]" />
                  </div>
                ))}
              </div>
            )}

            {/* Actual calendar */}
            {(!loading || data) && (
              <div className="grid grid-cols-7 gap-px rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-border-subtle)]">
                {/* Day headers */}
                {DAYS_HEADER.map((d) => (
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
                  const isToday = day === todayDay;
                  const isSelected = day === selectedDay;
                  const dayEvents = events.filter((e) => e.day === day);

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() =>
                        setSelectedDay(day === selectedDay ? null : day)
                      }
                      className={`min-h-24 bg-[var(--color-bg-primary)] p-2 text-left transition-colors hover:bg-[var(--color-bg-secondary)] ${
                        isSelected
                          ? "ring-1 ring-inset ring-[var(--color-accent)]"
                          : ""
                      }`}
                    >
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                          isToday
                            ? "bg-[var(--color-accent)] font-semibold text-white"
                            : "text-[var(--color-text-secondary)]"
                        }`}
                      >
                        {day}
                      </span>
                      <div className="mt-1 space-y-1">
                        {dayEvents.slice(0, 2).map((ev, ei) => (
                          <div
                            key={ei}
                            className={`truncate rounded px-1.5 py-0.5 text-[10px] ${TYPE_COLORS[ev.type]}`}
                          >
                            {ev.label}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="px-1.5 text-[10px] text-[var(--color-text-tertiary)]">
                            +{dayEvents.length - 2} more
                          </div>
                        )}
                        {/* Event dots for compact view */}
                        {dayEvents.length > 0 && dayEvents.length <= 2 && (
                          <div className="flex gap-0.5 px-1">
                            {dayEvents.map((ev, ei) => (
                              <span
                                key={ei}
                                className={`h-1.5 w-1.5 rounded-full ${TYPE_DOT_COLORS[ev.type]}`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Legend */}
            <div className="mt-4 flex items-center gap-4">
              {(["cron", "task", "milestone"] as const).map((t) => (
                <div key={t} className="flex items-center gap-1.5">
                  <span
                    className={`h-2 w-2 rounded-full ${TYPE_DOT_COLORS[t]}`}
                  />
                  <span className="text-[10px] capitalize text-[var(--color-text-tertiary)]">
                    {t}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Day detail sidebar */}
          {selectedDay !== null && (
            <div className="w-72 shrink-0 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)]">
              <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] px-4 py-3">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {getMonthName(month)} {selectedDay}
                </h3>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-[var(--color-bg-hover)]"
                >
                  <X className="h-3.5 w-3.5 text-[var(--color-text-tertiary)]" />
                </button>
              </div>
              <div className="p-4">
                {selectedDayEvents.length === 0 ? (
                  <p className="text-xs text-[var(--color-text-tertiary)]">
                    No events scheduled
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedDayEvents.map((ev, i) => (
                      <div
                        key={i}
                        className={`rounded-md px-3 py-2 ${TYPE_COLORS[ev.type]}`}
                      >
                        <p className="text-xs font-medium">{ev.label}</p>
                        <p className="mt-0.5 text-[10px] capitalize opacity-70">
                          {ev.type}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Error state */}
        {error && (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            Failed to load calendar: {error}
          </div>
        )}
      </div>
    </>
  );
}
