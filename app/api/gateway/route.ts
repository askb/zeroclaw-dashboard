// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2026 Anil Belur <askb23@gmail.com>

import { NextResponse } from "next/server";
import { getGatewayHealth } from "@/lib/gateway";

export const dynamic = "force-dynamic";

/**
 * GET /api/gateway
 *
 * Returns gateway health, agent count, session count, and session details.
 * Calls the gateway server-side so the token is never exposed to the browser.
 */
export async function GET() {
  try {
    const health = await getGatewayHealth();

    return NextResponse.json({
      ok: health.ok,
      status: health.status,
      agentCount: health.agents.length,
      sessionCount: health.sessions.length,
      agents: health.agents,
      sessions: health.sessions,
      channels: health.channels,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        status: "down",
        error: err instanceof Error ? err.message : "Unknown error",
        agentCount: 0,
        sessionCount: 0,
        agents: [],
        sessions: [],
        channels: {},
      },
      { status: 502 },
    );
  }
}
