// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2026 Anil Belur <askb23@gmail.com>

import { NextResponse } from "next/server";
import { readFile, readdir, stat } from "node:fs/promises";
import { join, basename, dirname } from "node:path";
import type { MemoryEntry } from "@/lib/types";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WORKSPACE_DIR = "/app/data/workspace";

/** Workspace markdown files that represent agent memory. */
const MEMORY_FILES: { file: string; type: MemoryEntry["type"] }[] = [
  { file: "SOUL.md", type: "context" },
  { file: "IDENTITY.md", type: "context" },
  { file: "USER.md", type: "context" },
  { file: "TOOLS.md", type: "action" },
  { file: "BOOTSTRAP.md", type: "decision" },
  { file: "AGENTS.md", type: "decision" },
  { file: "HEARTBEAT.md", type: "action" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extract the first `# heading` from markdown content. */
function extractTitle(content: string, fallback: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : fallback;
}

/** Return first N characters as a content preview. */
function preview(content: string, chars = 200): string {
  const trimmed = content.slice(0, chars);
  return trimmed.length < content.length ? `${trimmed}…` : trimmed;
}

/** Build a deterministic ISO date string from a file stat. */
async function fileDatetime(
  path: string,
): Promise<{ date: string; time: string }> {
  try {
    const s = await stat(path);
    const d = s.mtime;
    return {
      date: d.toISOString().slice(0, 10),
      time: d.toISOString().slice(11, 16),
    };
  } catch {
    const now = new Date();
    return {
      date: now.toISOString().slice(0, 10),
      time: now.toISOString().slice(11, 16),
    };
  }
}

// ---------------------------------------------------------------------------
// Live data reader
// ---------------------------------------------------------------------------

async function readLiveEntries(): Promise<MemoryEntry[]> {
  const entries: MemoryEntry[] = [];

  // 1. Read top-level workspace memory files
  for (const { file, type } of MEMORY_FILES) {
    try {
      const filePath = join(WORKSPACE_DIR, file);
      const content = await readFile(filePath, "utf-8");
      const { date, time } = await fileDatetime(filePath);
      const title = extractTitle(content, basename(file, ".md"));

      entries.push({
        id: `ws-${file.toLowerCase().replace(/\W+/g, "-")}`,
        date,
        time,
        agent: "gateway",
        type,
        title,
        content: preview(content),
      });
    } catch {
      // File doesn't exist — skip silently
    }
  }

  // 2. Scan skills directories for SKILL.md files
  try {
    const skillsDir = join(WORKSPACE_DIR, "skills");
    const skillDirs = await readdir(skillsDir, { withFileTypes: true });

    for (const entry of skillDirs) {
      if (!entry.isDirectory()) continue;
      try {
        const skillPath = join(skillsDir, entry.name, "SKILL.md");
        const content = await readFile(skillPath, "utf-8");
        const { date, time } = await fileDatetime(skillPath);
        const title = extractTitle(content, entry.name);

        entries.push({
          id: `skill-${entry.name.toLowerCase().replace(/\W+/g, "-")}`,
          date,
          time,
          agent: entry.name,
          type: "action",
          title: `Skill: ${title}`,
          content: preview(content),
        });
      } catch {
        // SKILL.md missing in this directory — skip
      }
    }
  } catch {
    // skills/ directory doesn't exist — skip
  }

  return entries;
}

// ---------------------------------------------------------------------------
// Mock fallback
// ---------------------------------------------------------------------------

const MOCK_ENTRIES: MemoryEntry[] = [
  {
    id: "mock-soul",
    date: "2026-04-02",
    time: "08:00",
    agent: "gateway",
    type: "context",
    title: "Agent Soul Definition",
    content:
      "Core personality and behavioral guidelines for the agent system. Defines tone, boundaries, and operational philosophy.",
  },
  {
    id: "mock-identity",
    date: "2026-04-02",
    time: "08:01",
    agent: "gateway",
    type: "context",
    title: "System Identity",
    content:
      "Identity metadata including system name, version, owner, and deployment context for the ZeroClaw platform.",
  },
  {
    id: "mock-user",
    date: "2026-04-01",
    time: "14:30",
    agent: "gateway",
    type: "context",
    title: "User Profile & Preferences",
    content:
      "Operator preferences, communication style, timezone, and interaction history used to personalize responses.",
  },
  {
    id: "mock-tools",
    date: "2026-04-02",
    time: "07:45",
    agent: "orchestrator",
    type: "action",
    title: "Available Tools Registry",
    content:
      "Registry of connected tools and skills: SearXNG search, Home Assistant, n8n workflows, file system access.",
  },
  {
    id: "mock-bootstrap",
    date: "2026-04-01",
    time: "10:00",
    agent: "orchestrator",
    type: "decision",
    title: "Bootstrap Configuration",
    content:
      "Initial system bootstrap sequence: load constitution, verify skills, connect channels, start heartbeat loop.",
  },
];

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

/**
 * GET /api/memory
 *
 * Returns structured memory entries parsed from workspace markdown files.
 * Falls back to mock data when the mounted volume is unavailable.
 */
export async function GET() {
  try {
    const entries = await readLiveEntries();

    if (entries.length > 0) {
      return NextResponse.json({
        entries,
        source: "live" as const,
      });
    }

    // No files found — return mock data
    return NextResponse.json({
      entries: MOCK_ENTRIES,
      source: "mock" as const,
    });
  } catch {
    return NextResponse.json({
      entries: MOCK_ENTRIES,
      source: "mock" as const,
    });
  }
}
