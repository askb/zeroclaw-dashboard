// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2026 Anil Belur <askb23@gmail.com>

import { NextResponse } from "next/server";
import { readFile, readdir, stat } from "node:fs/promises";
import { join, basename } from "node:path";
import type { DocFile } from "@/lib/types";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SPECIFY_DIR = "/app/data/specify";
const AGENTS_DIR = "/app/data/agents";
const WORKSPACE_DIR = "/app/data/workspace";

/** Well-known documentation file paths to scan. */
const KNOWN_PATHS: { path: string; dir: string; category: string }[] = [
  {
    path: "memory/constitution.md",
    dir: SPECIFY_DIR,
    category: "Governance",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extract the first `# heading` from markdown content. */
function extractTitle(content: string, fallback: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : fallback;
}

/** Count lines in a string. */
function lineCount(content: string): number {
  if (!content) return 0;
  return content.split("\n").length;
}

/** Format a Date as YYYY-MM-DD. */
function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Read a single doc file and return a DocFile entry. */
async function readDocFile(
  filePath: string,
  category: string,
  displayPath?: string,
): Promise<DocFile | null> {
  try {
    const content = await readFile(filePath, "utf-8");
    const s = await stat(filePath);
    const title = extractTitle(content, basename(filePath, ".md"));

    return {
      path: displayPath ?? filePath,
      title,
      category,
      updatedAt: formatDate(s.mtime),
      lines: lineCount(content),
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Live data reader
// ---------------------------------------------------------------------------

async function readLiveDocs(): Promise<DocFile[]> {
  const docs: DocFile[] = [];

  // 1. Known governance files under .specify/
  for (const known of KNOWN_PATHS) {
    const doc = await readDocFile(
      join(known.dir, known.path),
      known.category,
      `.specify/${known.path}`,
    );
    if (doc) docs.push(doc);
  }

  // 2. Scan .specify/templates/*.md
  try {
    const templatesDir = join(SPECIFY_DIR, "templates");
    const files = await readdir(templatesDir);
    for (const file of files) {
      if (!file.endsWith(".md")) continue;
      const doc = await readDocFile(
        join(templatesDir, file),
        "Governance",
        `.specify/templates/${file}`,
      );
      if (doc) docs.push(doc);
    }
  } catch {
    // templates/ directory missing — skip
  }

  // 3. Scan agents/*/agent.md and agents/*/tools.md
  try {
    const agentDirs = await readdir(AGENTS_DIR, { withFileTypes: true });
    for (const entry of agentDirs) {
      if (!entry.isDirectory()) continue;
      for (const mdFile of ["agent.md", "tools.md"]) {
        const doc = await readDocFile(
          join(AGENTS_DIR, entry.name, mdFile),
          "Agents",
          `agents/${entry.name}/${mdFile}`,
        );
        if (doc) docs.push(doc);
      }
    }
  } catch {
    // agents/ directory missing — skip
  }

  // 4. Workspace root docs
  for (const wsFile of ["AGENTS.md", "SOUL.md"]) {
    const doc = await readDocFile(
      join(WORKSPACE_DIR, wsFile),
      "Operations",
      `workspace/${wsFile}`,
    );
    if (doc) docs.push(doc);
  }

  return docs;
}

// ---------------------------------------------------------------------------
// Mock fallback — mirrors the 8 hardcoded docs from app/docs/page.tsx
// ---------------------------------------------------------------------------

const MOCK_DOCS: DocFile[] = [
  {
    path: ".specify/memory/constitution.md",
    title: "Constitution.md",
    category: "Architecture",
    updatedAt: "2026-04-02",
    lines: 180,
  },
  {
    path: "specs/001-zeroclaw-dashboard/spec.md",
    title: "Dashboard Spec (001)",
    category: "Architecture",
    updatedAt: "2026-04-02",
    lines: 250,
  },
  {
    path: "AGENTS.md",
    title: "AGENTS.md",
    category: "Governance",
    updatedAt: "2026-04-01",
    lines: 120,
  },
  {
    path: ".github/copilot-instructions.md",
    title: "Copilot Instructions",
    category: "Governance",
    updatedAt: "2026-04-01",
    lines: 85,
  },
  {
    path: "config/gateway/exec-approvals.json",
    title: "Exec Approvals",
    category: "Operations",
    updatedAt: "2026-04-01",
    lines: 95,
  },
  {
    path: "config/searxng/settings.yml",
    title: "SearXNG Settings",
    category: "Operations",
    updatedAt: "2026-04-01",
    lines: 45,
  },
];

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

/**
 * GET /api/docs
 *
 * Scans mounted volumes for documentation files and returns metadata.
 * Falls back to mock data matching the hardcoded docs page when volumes
 * are unavailable.
 */
export async function GET() {
  try {
    const docs = await readLiveDocs();

    if (docs.length > 0) {
      return NextResponse.json({
        docs,
        source: "live" as const,
      });
    }

    // No files found — return mock data
    return NextResponse.json({
      docs: MOCK_DOCS,
      source: "mock" as const,
    });
  } catch {
    return NextResponse.json({
      docs: MOCK_DOCS,
      source: "mock" as const,
    });
  }
}
