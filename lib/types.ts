// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2026 Anil Belur <askb23@gmail.com>

/** Gateway connection configuration */
export interface GatewayConfig {
  url: string;
  token: string;
}

/** Agent status as reported by gateway heartbeat */
export type AgentStatus = "online" | "busy" | "idle" | "offline";

/** A task in the Kanban board */
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: "backlog" | "in_progress" | "review" | "done";
  priority: "high" | "medium" | "low";
  agent?: string;
  createdAt: string;
  updatedAt: string;
}

/** An agent in the system */
export interface Agent {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  description: string;
  skills: string[];
}

/** A memory entry from the agent workspace */
export interface MemoryEntry {
  id: string;
  date: string;
  time: string;
  agent: string;
  type: "decision" | "action" | "context" | "error";
  title: string;
  content: string;
}

/** A document in the docs repository */
export interface DocFile {
  path: string;
  title: string;
  category: string;
  updatedAt: string;
  lines: number;
}

/** A project with goals and progress tracking */
export interface Project {
  id: string;
  name: string;
  status: "active" | "planning" | "completed" | "paused";
  description: string;
  progress: number;
  tasks: { total: number; done: number };
}

/** Calendar event (cron job or scheduled task) */
export interface CalendarEvent {
  id: string;
  day: number;
  label: string;
  type: "cron" | "task" | "milestone";
}

/** Activity feed event */
export interface ActivityEvent {
  id: string;
  timestamp: string;
  text: string;
  agent?: string;
  type: "info" | "success" | "warning" | "error";
}

/** Daily API usage/cost entry from the gateway */
export interface DailyUsage {
  date: string;
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  totalTokens: number;
  totalCost: number;
  inputCost: number;
  outputCost: number;
  cacheReadCost: number;
  cacheWriteCost: number;
  missingCostEntries: number;
}

/** Aggregated usage/cost response from the gateway */
export interface UsageResponse {
  updatedAt?: number;
  days: number;
  daily: DailyUsage[];
  totals: DailyUsage;
  source: "live" | "mock" | "stale" | "unavailable";
  error?: string;
}
