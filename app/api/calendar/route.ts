// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2026 Anil Belur <askb23@gmail.com>

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { CalendarEvent, Task } from "@/lib/types";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parse a `YYYY-MM` month string into year and month numbers.
 * Returns the current month when the input is missing or invalid.
 */
function parseMonth(raw?: string | null): { year: number; month: number } {
  if (raw) {
    const match = raw.match(/^(\d{4})-(\d{2})$/);
    if (match) {
      return { year: Number(match[1]), month: Number(match[2]) };
    }
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

/** Zero-pad a number to 2 digits. */
function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Generate a stable id for a calendar event. */
function eventId(day: number, label: string): string {
  return `evt-${day}-${label.toLowerCase().replace(/\W+/g, "-")}`;
}

// ---------------------------------------------------------------------------
// Cron schedules (hardcoded, realistic recurring jobs)
// ---------------------------------------------------------------------------

function getCronEvents(): CalendarEvent[] {
  return [
    {
      id: eventId(1, "monthly-security-audit"),
      day: 1,
      label: "Monthly security audit",
      type: "cron",
    },
    {
      id: eventId(1, "monthly-backup-verification"),
      day: 1,
      label: "Monthly backup verification",
      type: "cron",
    },
    {
      id: eventId(7, "weekly-memory-cleanup"),
      day: 7,
      label: "Weekly memory cleanup",
      type: "cron",
    },
    {
      id: eventId(14, "weekly-memory-cleanup"),
      day: 14,
      label: "Weekly memory cleanup",
      type: "cron",
    },
    {
      id: eventId(15, "monthly-dependency-scan"),
      day: 15,
      label: "Monthly dependency scan",
      type: "cron",
    },
    {
      id: eventId(21, "weekly-memory-cleanup"),
      day: 21,
      label: "Weekly memory cleanup",
      type: "cron",
    },
    {
      id: eventId(28, "weekly-memory-cleanup"),
      day: 28,
      label: "Weekly memory cleanup",
      type: "cron",
    },
  ];
}

// ---------------------------------------------------------------------------
// Task milestones (fetched from internal /api/tasks)
// ---------------------------------------------------------------------------

/**
 * Fetch tasks from the internal API and derive milestone events for the
 * requested month.  Tasks whose `updatedAt` falls within the month are
 * shown as milestones on that day.
 */
async function getTaskMilestones(
  year: number,
  month: number,
): Promise<CalendarEvent[]> {
  try {
    // Build absolute URL for the internal API call.
    const baseUrl = process.env.NEXTAUTH_URL
      ?? process.env.NEXT_PUBLIC_BASE_URL
      ?? "http://localhost:3000";

    const res = await fetch(`${baseUrl}/api/tasks`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });

    if (!res.ok) return [];

    const data = (await res.json()) as { tasks: Task[] };
    const events: CalendarEvent[] = [];

    for (const task of data.tasks) {
      const updated = new Date(task.updatedAt);
      if (
        updated.getFullYear() === year &&
        updated.getMonth() + 1 === month
      ) {
        const day = updated.getDate();
        const type: CalendarEvent["type"] =
          task.status === "done" ? "milestone" : "task";

        events.push({
          id: eventId(day, task.id),
          day,
          label: task.title,
          type,
        });
      }
    }

    return events;
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

/**
 * GET /api/calendar?month=YYYY-MM
 *
 * Returns calendar events combining cron schedules and task milestones.
 * Defaults to the current month when the query parameter is omitted.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const { year, month } = parseMonth(searchParams.get("month"));
  const monthStr = `${year}-${pad2(month)}`;

  try {
    const [cronEvents, taskEvents] = await Promise.all([
      Promise.resolve(getCronEvents()),
      getTaskMilestones(year, month),
    ]);

    const events = [...cronEvents, ...taskEvents];

    return NextResponse.json({
      events,
      month: monthStr,
      source: taskEvents.length > 0 ? ("live" as const) : ("mock" as const),
    });
  } catch {
    // Total failure — return just cron events
    return NextResponse.json({
      events: getCronEvents(),
      month: monthStr,
      source: "mock" as const,
    });
  }
}
