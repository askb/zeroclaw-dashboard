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
    createdAt: "2026-04-01T10:00:00Z",
    updatedAt: "2026-04-01T10:00:00Z",
  },
  {
    id: "t2",
    title: "Configure Home Assistant skill",
    description: "Connect Home Assistant REST API as a gateway skill for smart-home control",
    status: "backlog",
    priority: "low",
    agent: "Orchestrator",
    createdAt: "2026-04-01T14:00:00Z",
    updatedAt: "2026-04-01T14:00:00Z",
  },
  {
    id: "t7",
    title: "Connect Discord to OpenClaw",
    description: "Set up Discord bot and connect as a channel to the gateway",
    status: "backlog",
    priority: "medium",
    agent: "Orchestrator",
    createdAt: "2026-04-02T07:53:00Z",
    updatedAt: "2026-04-02T07:53:00Z",
  },
  {
    id: "t8",
    title: "Build Dashboard Phase 3 — Memory Screen",
    description: "Wire memory screen to live workspace file reading with search and filters",
    status: "in_progress",
    priority: "high",
    agent: "Code Architect",
    createdAt: "2026-04-02T08:00:00Z",
    updatedAt: "2026-04-02T08:00:00Z",
  },
  {
    id: "t3",
    title: "Build ZeroClaw Dashboard Phase 2",
    description: "Gateway WebSocket client, React hooks, and live API routes",
    status: "done",
    priority: "high",
    agent: "Code Architect",
    createdAt: "2026-04-02T07:27:00Z",
    updatedAt: "2026-04-02T08:06:00Z",
  },
  {
    id: "t9",
    title: "Deploy Caddy HTTPS reverse proxy",
    description: "Self-signed TLS for LAN, proxy gateway + MC, fixes last critical audit finding",
    status: "done",
    priority: "high",
    agent: "Code Architect",
    createdAt: "2026-04-02T07:27:00Z",
    updatedAt: "2026-04-02T07:35:00Z",
  },
  {
    id: "t10",
    title: "Isolate API key secrets",
    description: "Moved secrets to SecretRef system — 0 plaintext in audit",
    status: "done",
    priority: "high",
    agent: "Code Architect",
    createdAt: "2026-04-02T07:27:00Z",
    updatedAt: "2026-04-02T07:38:00Z",
  },
  {
    id: "t11",
    title: "Install Claude Code coding agent",
    description: "Claude Code v2.1.90 installed, coding-agent skill ready",
    status: "done",
    priority: "medium",
    agent: "Code Architect",
    createdAt: "2026-04-02T07:27:00Z",
    updatedAt: "2026-04-02T07:28:00Z",
  },
  {
    id: "t4",
    title: "Security hardening — exec approvals",
    description: "Implement 30+ deny patterns for dangerous shell commands",
    status: "done",
    priority: "high",
    agent: "Code Architect",
    createdAt: "2026-04-01T09:00:00Z",
    updatedAt: "2026-04-01T16:00:00Z",
  },
  {
    id: "t5",
    title: "Deploy SearXNG metasearch",
    description: "Self-hosted SearXNG instance for privacy-respecting web search",
    status: "done",
    priority: "medium",
    agent: "Code Architect",
    createdAt: "2026-04-01T11:00:00Z",
    updatedAt: "2026-04-01T14:00:00Z",
  },
  {
    id: "t6",
    title: "Create Constitution & spec kit",
    description: "Agent constitution and specification documents for governance",
    status: "done",
    priority: "high",
    agent: "Orchestrator",
    createdAt: "2026-04-01T10:00:00Z",
    updatedAt: "2026-04-01T15:00:00Z",
  },
  {
    id: "t12",
    title: "Replace crshdn MC with custom dashboard",
    description: "Removed third-party Mission Control, built and deployed our own",
    status: "done",
    priority: "high",
    agent: "Code Architect",
    createdAt: "2026-04-02T07:49:00Z",
    updatedAt: "2026-04-02T08:00:00Z",
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
