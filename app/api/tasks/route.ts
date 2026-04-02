// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2026 Anil Belur <askb23@gmail.com>

import { NextResponse } from "next/server";
import type { Task } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Structured mock tasks matching the Task type.
 * These are used until the gateway exposes a task/kanban API.
 */
const MOCK_TASKS: Task[] = [
  {
    id: "t1",
    title: "Configure n8n skill integration",
    description: "Set up n8n as a skill so the orchestrator can trigger automation workflows",
    status: "backlog",
    priority: "medium",
    agent: "Orchestrator",
    createdAt: "2026-06-28T10:00:00Z",
    updatedAt: "2026-06-28T10:00:00Z",
  },
  {
    id: "t2",
    title: "Configure Home Assistant skill",
    description: "Connect Home Assistant REST API as a gateway skill for smart-home control",
    status: "backlog",
    priority: "low",
    agent: "Orchestrator",
    createdAt: "2026-06-27T14:00:00Z",
    updatedAt: "2026-06-27T14:00:00Z",
  },
  {
    id: "t3",
    title: "Build ZeroClaw Dashboard Phase 2",
    description: "Gateway WebSocket client, React hooks, and live API routes",
    status: "in_progress",
    priority: "high",
    agent: "Code Architect",
    createdAt: "2026-06-29T08:00:00Z",
    updatedAt: "2026-06-30T12:00:00Z",
  },
  {
    id: "t4",
    title: "Security hardening — exec approvals",
    description: "Implement 30+ deny patterns for dangerous shell commands",
    status: "done",
    priority: "high",
    agent: "Code Architect",
    createdAt: "2026-06-25T09:00:00Z",
    updatedAt: "2026-06-28T16:00:00Z",
  },
  {
    id: "t5",
    title: "Deploy SearXNG metasearch",
    description: "Self-hosted SearXNG instance for privacy-respecting web search",
    status: "done",
    priority: "medium",
    agent: "Code Architect",
    createdAt: "2026-06-24T11:00:00Z",
    updatedAt: "2026-06-27T09:00:00Z",
  },
  {
    id: "t6",
    title: "Create Constitution & spec kit",
    description: "Agent constitution and specification documents for governance",
    status: "done",
    priority: "high",
    agent: "Orchestrator",
    createdAt: "2026-06-23T10:00:00Z",
    updatedAt: "2026-06-26T15:00:00Z",
  },
];

/**
 * GET /api/tasks
 *
 * Returns the task list.  Currently returns structured mock data since the
 * gateway does not yet expose a kanban/task API.  The `source` field
 * indicates whether data is live or mocked.
 */
export async function GET() {
  // TODO: When the gateway adds a task management RPC, wire it up here.
  // For now, return structured mock data.
  return NextResponse.json({
    tasks: MOCK_TASKS,
    source: "mock" as const,
  });
}
