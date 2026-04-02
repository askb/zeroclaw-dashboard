// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2026 Anil Belur <askb23@gmail.com>

import { NextResponse } from "next/server";
import { getGatewayUsageCost } from "@/lib/gateway";
import type { UsageResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Mock data returned when the gateway is unreachable. */
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

/**
 * GET /api/usage?days=30
 *
 * Fetches API usage/cost data from the OpenClaw gateway via WebSocket RPC.
 * Falls back to mock data if the gateway is unreachable.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = Math.min(Math.max(parseInt(searchParams.get("days") || "30", 10), 1), 365);

  try {
    const usage = await getGatewayUsageCost(days);
    return NextResponse.json(usage);
  } catch (err) {
    // Gateway unreachable — return mock data so the UI still renders
    return NextResponse.json({
      ...MOCK_USAGE,
      days,
      error: `Gateway unreachable: ${err instanceof Error ? err.message : "unknown"}`,
    });
  }
}
