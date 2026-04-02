// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2026 Anil Belur <askb23@gmail.com>

import { NextResponse } from "next/server";
import { getGatewayAgents } from "@/lib/gateway";
import type { Agent } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Fallback mock agents shown when the gateway is unreachable. */
const MOCK_AGENTS: Agent[] = [
  {
    id: "main",
    name: "Main",
    role: "Default Agent",
    status: "online",
    description: "Primary agent handling default routing",
    skills: ["chat", "heartbeat", "telegram"],
  },
  {
    id: "code-architect",
    name: "Code Architect",
    role: "Specialist",
    status: "idle",
    description: "Specialist agent: code-architect",
    skills: ["coding", "review", "architecture"],
  },
  {
    id: "orchestrator",
    name: "Orchestrator",
    role: "Specialist",
    status: "idle",
    description: "Specialist agent: orchestrator",
    skills: ["planning", "delegation", "monitoring"],
  },
  {
    id: "research-specialist",
    name: "Research Specialist",
    role: "Specialist",
    status: "offline",
    description: "Specialist agent: research-specialist",
    skills: ["search", "analysis", "summarization"],
  },
];

/**
 * GET /api/agents
 *
 * Returns agent list with live status from gateway.
 * Falls back to mock data when the gateway is unreachable.
 */
export async function GET() {
  try {
    const agents = await getGatewayAgents();

    if (agents.length > 0) {
      return NextResponse.json({
        agents,
        source: "live" as const,
      });
    }

    // Gateway returned empty — use mocks
    return NextResponse.json({
      agents: MOCK_AGENTS,
      source: "mock" as const,
    });
  } catch {
    return NextResponse.json({
      agents: MOCK_AGENTS,
      source: "mock" as const,
    });
  }
}
