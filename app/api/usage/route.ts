// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2026 Anil Belur <askb23@gmail.com>

import { NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";
import type { UsageResponse, DailyUsage } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Path to the usage data file written by the gateway dump script. */
const USAGE_FILE = path.join(
  process.env.USAGE_DATA_DIR || "/app/data/usage",
  "usage-30d.json",
);

/** Max age in seconds before the file is considered stale. */
const MAX_AGE_SECONDS = 600; // 10 minutes

/** Mock data returned when no live data is available. */
const MOCK_USAGE: UsageResponse = {
  days: 30,
  daily: [
    { date: "2026-04-02", totalTokens: 2283343, totalCost: 1.32, inputCost: 1.30, outputCost: 0.02, input: 2274201, output: 9142, cacheRead: 0, cacheWrite: 0, cacheReadCost: 0, cacheWriteCost: 0, missingCostEntries: 0 },
    { date: "2026-04-01", totalTokens: 87570, totalCost: 0.05, inputCost: 0.049, outputCost: 0.002, input: 86746, output: 824, cacheRead: 0, cacheWrite: 0, cacheReadCost: 0, cacheWriteCost: 0, missingCostEntries: 0 },
    { date: "2026-03-31", totalTokens: 148462, totalCost: 0.09, inputCost: 0.084, outputCost: 0.001, input: 147986, output: 476, cacheRead: 0, cacheWrite: 0, cacheReadCost: 0, cacheWriteCost: 0, missingCostEntries: 0 },
  ],
  totals: { date: "", totalTokens: 2569398, totalCost: 1.48, inputCost: 1.46, outputCost: 0.024, input: 2558933, output: 10465, cacheRead: 0, cacheWrite: 0, cacheReadCost: 0, cacheWriteCost: 0, missingCostEntries: 0 },
  source: "mock",
};

function mapUsage(r: Record<string, unknown>): DailyUsage {
  return {
    date: String(r.date ?? ""),
    input: Number(r.input ?? 0),
    output: Number(r.output ?? 0),
    cacheRead: Number(r.cacheRead ?? 0),
    cacheWrite: Number(r.cacheWrite ?? 0),
    totalTokens: Number(r.totalTokens ?? 0),
    totalCost: Number(r.totalCost ?? 0),
    inputCost: Number(r.inputCost ?? 0),
    outputCost: Number(r.outputCost ?? 0),
    cacheReadCost: Number(r.cacheReadCost ?? 0),
    cacheWriteCost: Number(r.cacheWriteCost ?? 0),
    missingCostEntries: Number(r.missingCostEntries ?? 0),
  };
}

/**
 * GET /api/usage?days=30
 *
 * Reads API usage/cost data from a shared volume file written by the gateway.
 * Falls back to mock data if the file doesn't exist or is stale.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = Math.min(Math.max(parseInt(searchParams.get("days") || "30", 10), 1), 365);

  try {
    // Check file freshness
    const fileStat = await stat(USAGE_FILE);
    const ageSeconds = (Date.now() - fileStat.mtimeMs) / 1000;

    const raw = await readFile(USAGE_FILE, "utf-8");
    const data = JSON.parse(raw) as Record<string, unknown>;

    const rawDaily = (data.daily ?? []) as Array<Record<string, unknown>>;
    const rawTotals = (data.totals ?? {}) as Record<string, unknown>;

    // Filter daily entries to requested day count
    const allDaily = rawDaily.map(mapUsage);
    const daily = days < allDaily.length ? allDaily.slice(0, days) : allDaily;

    // Recalculate totals for the filtered range
    const totals = daily.length > 0
      ? daily.reduce(
          (acc, d) => ({
            ...acc,
            input: acc.input + d.input,
            output: acc.output + d.output,
            totalTokens: acc.totalTokens + d.totalTokens,
            totalCost: acc.totalCost + d.totalCost,
            inputCost: acc.inputCost + d.inputCost,
            outputCost: acc.outputCost + d.outputCost,
            cacheRead: acc.cacheRead + d.cacheRead,
            cacheWrite: acc.cacheWrite + d.cacheWrite,
            cacheReadCost: acc.cacheReadCost + d.cacheReadCost,
            cacheWriteCost: acc.cacheWriteCost + d.cacheWriteCost,
          }),
          mapUsage({}),
        )
      : mapUsage(rawTotals);

    return NextResponse.json({
      updatedAt: Number(data.updatedAt ?? fileStat.mtimeMs),
      days,
      daily,
      totals,
      source: ageSeconds > MAX_AGE_SECONDS ? "stale" : "live",
      fileAge: Math.round(ageSeconds),
    } satisfies UsageResponse & { fileAge: number });
  } catch {
    return NextResponse.json({ ...MOCK_USAGE, days });
  }
}
