// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2026 Anil Belur <askb23@gmail.com>

import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import type { Conversation, ConversationsResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Paths to try for live conversation data
// ---------------------------------------------------------------------------

const LIVE_PATHS = [
  "/home/node/.openclaw/agents/main/sessions/sessions.json",
  "/app/data/conversations.json",
];

// ---------------------------------------------------------------------------
// Demo data
// ---------------------------------------------------------------------------

const now = new Date();

function ago(minutes: number): string {
  return new Date(now.getTime() - minutes * 60_000).toISOString();
}

const DEMO_CONVERSATIONS: Conversation[] = [
  // ---- Telegram conversations ----
  {
    id: "tg-research-001",
    channel: "telegram",
    title: "Research: OpenStack Magnum deprecation",
    preview: "Here's a summary of the Magnum deprecation timeline…",
    created_at: ago(180),
    updated_at: ago(12),
    messages: [
      {
        id: "tg-r1-m1",
        role: "user",
        content:
          "Can you research the OpenStack Magnum deprecation status? I need to know the timeline and what replaces it.",
        timestamp: ago(180),
      },
      {
        id: "tg-r1-m2",
        role: "agent",
        content:
          "I'll look into that now. Searching for recent OpenStack governance decisions and mailing list threads about Magnum.",
        timestamp: ago(179),
        agent: "researcher",
      },
      {
        id: "tg-r1-m3",
        role: "agent",
        content:
          "Here's a summary of the Magnum deprecation timeline:\n\n**Status:** Officially deprecated as of 2025.2 (Epoxy) cycle\n\n**Key dates:**\n- TC vote: March 2025\n- Last stable release: 2025.1 (Dalmatian)\n- End of maintenance: April 2026\n\n**Replacements:**\n- `cluster-api-provider-openstack` for Kubernetes\n- Standalone Cluster API with OpenStack infrastructure provider\n\nWant me to draft a migration guide?",
        timestamp: ago(170),
        agent: "researcher",
      },
      {
        id: "tg-r1-m4",
        role: "user",
        content: "Yes, please draft a migration checklist.",
        timestamp: ago(15),
      },
      {
        id: "tg-r1-m5",
        role: "agent",
        content:
          "Migration checklist drafted and saved to `workspace/docs/magnum-migration.md`. Key steps:\n\n1. Inventory existing Magnum clusters\n2. Export cluster templates\n3. Set up Cluster API controllers\n4. Test with non-production workloads\n5. Migrate persistent volumes\n6. Update CI/CD pipelines\n7. Decommission Magnum endpoints",
        timestamp: ago(12),
        agent: "researcher",
      },
    ],
  },
  {
    id: "tg-dashboard-002",
    channel: "telegram",
    title: "Dashboard status check",
    preview: "All systems operational. Gateway uptime: 99.97%…",
    created_at: ago(90),
    updated_at: ago(45),
    messages: [
      {
        id: "tg-d2-m1",
        role: "user",
        content: "What's the current system status?",
        timestamp: ago(90),
      },
      {
        id: "tg-d2-m2",
        role: "agent",
        content:
          "All systems operational. Gateway uptime: 99.97% over the last 7 days.\n\n**Services:**\n- 🟢 Gateway: healthy (latency: 42ms)\n- 🟢 SearXNG: healthy\n- 🟢 n8n: 3 active workflows\n- 🟢 Home Assistant: connected\n- 🟡 Ollama: high memory (78%)\n\n**Today's usage:** 145K tokens, $0.32 estimated cost",
        timestamp: ago(89),
        agent: "orchestrator",
      },
      {
        id: "tg-d2-m3",
        role: "user",
        content: "What about Ollama memory? Should we restart it?",
        timestamp: ago(50),
      },
      {
        id: "tg-d2-m4",
        role: "agent",
        content:
          "Ollama memory is at 78% due to having two models loaded (`llama3:8b` and `codellama:13b`). This is within normal range. A restart would drop to ~40% but would require reloading models on next inference.\n\nRecommendation: No action needed unless it exceeds 90%.",
        timestamp: ago(45),
        agent: "orchestrator",
      },
    ],
  },
  {
    id: "tg-task-003",
    channel: "telegram",
    title: "Create Packer template for Ubuntu 24.04",
    preview: "Task created and added to the backlog…",
    created_at: ago(300),
    updated_at: ago(240),
    messages: [
      {
        id: "tg-t3-m1",
        role: "user",
        content:
          "Create a task: Build a new Packer template for Ubuntu 24.04 with Docker pre-installed. High priority.",
        timestamp: ago(300),
      },
      {
        id: "tg-t3-m2",
        role: "agent",
        content:
          'Task created and added to the backlog:\n\n**Title:** Build Packer template — Ubuntu 24.04 + Docker\n**Priority:** High\n**Agent:** builder\n**Status:** Backlog\n\nI based it on the existing `ubuntu-22.04.pkr.hcl` template. Want me to start working on it now?',
        timestamp: ago(299),
        agent: "orchestrator",
      },
      {
        id: "tg-t3-m3",
        role: "user",
        content: "Not yet, keep it in backlog for now.",
        timestamp: ago(250),
      },
      {
        id: "tg-t3-m4",
        role: "agent",
        content: "Got it. Task stays in backlog. I'll wait for your go-ahead.",
        timestamp: ago(249),
        agent: "orchestrator",
      },
    ],
  },
  {
    id: "tg-code-004",
    channel: "telegram",
    title: "Fix shellcheck warnings in deploy script",
    preview: "Found 3 issues in scripts/deploy.sh…",
    created_at: ago(420),
    updated_at: ago(380),
    messages: [
      {
        id: "tg-c4-m1",
        role: "user",
        content: "Run shellcheck on scripts/deploy.sh and fix any warnings.",
        timestamp: ago(420),
      },
      {
        id: "tg-c4-m2",
        role: "agent",
        content:
          "Found 3 issues in `scripts/deploy.sh`:\n\n```\nSC2086: Double quote to prevent globbing (line 24)\nSC2155: Declare and assign separately (line 31)\nSC2034: UNUSED_VAR appears unused (line 45)\n```\n\nFixing now…",
        timestamp: ago(415),
        agent: "coder",
      },
      {
        id: "tg-c4-m3",
        role: "agent",
        content:
          'All 3 shellcheck warnings fixed:\n\n1. Line 24: Quoted `$DEPLOY_DIR` expansion\n2. Line 31: Split `local result=$(cmd)` into declaration + assignment\n3. Line 45: Removed unused `UNUSED_VAR`\n\n`shellcheck scripts/deploy.sh` now passes cleanly. Changes committed to branch `fix/shellcheck-deploy`.',
        timestamp: ago(380),
        agent: "coder",
      },
    ],
  },

  // ---- Discord conversations ----
  {
    id: "dc-brief-001",
    channel: "discord",
    discord_channel: "#daily-briefs",
    title: "Daily Brief — 2026-01-18",
    preview: "Good morning! Here's your daily brief…",
    created_at: ago(60),
    updated_at: ago(55),
    messages: [
      {
        id: "dc-b1-m1",
        role: "agent",
        content:
          "Good morning! Here's your daily brief for **2026-01-18**:\n\n📋 **Tasks:** 3 in progress, 2 in review, 1 blocked\n📊 **Usage:** Yesterday — 287K tokens ($0.58)\n🔔 **Alerts:**\n- PR #42 on `lfreleng-actions` needs review (2 days old)\n- Gerrit change 98765 on `releng-builder` has -1 verify\n- Dependabot: 1 critical alert on `packer-build-action`\n\n🏠 **Home:** Living room temp 21.5°C, no automations triggered overnight",
        timestamp: ago(60),
        agent: "orchestrator",
      },
      {
        id: "dc-b1-m2",
        role: "user",
        content: "What's the blocked task?",
        timestamp: ago(58),
      },
      {
        id: "dc-b1-m3",
        role: "agent",
        content:
          'The blocked task is **"Migrate CI from Jenkins to GitHub Actions for bgpcep"** — it\'s waiting on the `global-jjb` submodule update in `releng-builder`. The submodule pin needs to be bumped to include the new reusable workflow templates.\n\nWant me to create a change to bump the submodule?',
        timestamp: ago(55),
        agent: "orchestrator",
      },
    ],
  },
  {
    id: "dc-devlogs-002",
    channel: "discord",
    discord_channel: "#dev-logs",
    title: "Packer build completed — Ubuntu 22.04",
    preview: "✅ Packer build completed successfully…",
    created_at: ago(150),
    updated_at: ago(140),
    messages: [
      {
        id: "dc-dl2-m1",
        role: "agent",
        content:
          "✅ Packer build completed successfully\n\n**Template:** `ubuntu-22.04-docker.pkr.hcl`\n**Cloud:** VexxHost (YUL1)\n**Duration:** 12m 34s\n**Image ID:** `img-a1b2c3d4`\n**Image Name:** `ubuntu-22.04-docker-20260118`\n\n```\nBuild finished: openstack.ubuntu-22.04\nArtifact: img-a1b2c3d4\nSize: 2.1 GB\n```",
        timestamp: ago(150),
        agent: "builder",
      },
      {
        id: "dc-dl2-m2",
        role: "user",
        content: "Nice. Did the Ansible provisioner run the Docker role correctly?",
        timestamp: ago(145),
      },
      {
        id: "dc-dl2-m3",
        role: "agent",
        content:
          "Yes, the Ansible provisioner completed all tasks:\n\n- `geerlingguy.docker` role: ✅ installed Docker CE 27.5.1\n- Docker Compose plugin: ✅ v2.32.4\n- Docker daemon config: ✅ (overlay2, json-file logging)\n- Smoke test `docker run hello-world`: ✅ passed\n\nAll 23 Ansible tasks completed with 0 failures.",
        timestamp: ago(140),
        agent: "builder",
      },
    ],
  },
  {
    id: "dc-devlogs-003",
    channel: "discord",
    discord_channel: "#dev-logs",
    title: "Pre-commit hook update — releng-builder",
    preview: "Updated pre-commit hooks to latest versions…",
    created_at: ago(500),
    updated_at: ago(490),
    messages: [
      {
        id: "dc-dl3-m1",
        role: "agent",
        content:
          "Updated pre-commit hooks to latest versions in `releng-builder`:\n\n```diff\n- rev: v4.5.0   # pre-commit-hooks\n+ rev: v4.6.0\n- rev: v0.9.0   # shellcheck\n+ rev: v0.10.0\n- rev: v1.16.0  # actionlint\n+ rev: v1.17.0\n```\n\nAll hooks pass on `pre-commit run --all-files`. Gerrit change submitted.",
        timestamp: ago(500),
        agent: "coder",
      },
      {
        id: "dc-dl3-m2",
        role: "user",
        content: "Any breaking changes in shellcheck 0.10?",
        timestamp: ago(495),
      },
      {
        id: "dc-dl3-m3",
        role: "agent",
        content:
          "One notable change: SC2308 (new in 0.10) flags `[ -v var ]` as a bashism when `#!/bin/sh` is used. We had 2 scripts affected:\n\n- `jjb/scripts/check-env.sh` → switched to `[ -n \"${var+x}\" ]`\n- `scripts/setup-node.sh` → already using bash shebang, no change needed\n\nBoth fixes included in the Gerrit change.",
        timestamp: ago(490),
        agent: "coder",
      },
    ],
  },
  {
    id: "dc-testing-004",
    channel: "discord",
    discord_channel: "#bot-testing",
    title: "Testing SearXNG integration",
    preview: "Search test completed. 12 results returned…",
    created_at: ago(600),
    updated_at: ago(580),
    messages: [
      {
        id: "dc-bt4-m1",
        role: "user",
        content: "Test the SearXNG search integration. Search for 'OpenDaylight NETCONF latest release'.",
        timestamp: ago(600),
      },
      {
        id: "dc-bt4-m2",
        role: "agent",
        content:
          "Search test completed. 12 results returned in 1.2s via SearXNG:\n\n**Top 3 results:**\n1. OpenDaylight NETCONF Plugin 8.0.0 Release Notes — docs.opendaylight.org\n2. NETCONF project Wiki — wiki.opendaylight.org\n3. ODL Potassium release announcement — lists.opendaylight.org\n\n**Engines used:** google, duckduckgo, bing\n**Cache hit:** no (first query for this term)",
        timestamp: ago(595),
        agent: "researcher",
      },
      {
        id: "dc-bt4-m3",
        role: "user",
        content: "Good. Now test with a malformed query — empty string.",
        timestamp: ago(585),
      },
      {
        id: "dc-bt4-m4",
        role: "agent",
        content:
          "Empty query handled correctly:\n\n```json\n{\n  \"error\": \"Query cannot be empty\",\n  \"code\": \"INVALID_QUERY\",\n  \"results\": []\n}\n```\n\nHTTP 400 returned as expected. Error logging captured the event.",
        timestamp: ago(580),
        agent: "researcher",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

/**
 * GET /api/conversations
 *
 * Returns conversation history. Tries live data from session store,
 * falls back to demo data.
 *
 * Query params:
 *   - channel: "telegram" | "discord" | "all" (default: "all")
 *   - limit: number (default: 50)
 *   - offset: number (default: 0)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const channel = searchParams.get("channel") ?? "all";
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 100);
  const offset = Math.max(Number(searchParams.get("offset") ?? 0), 0);

  // Attempt to read live conversation data
  for (const path of LIVE_PATHS) {
    try {
      const raw = await readFile(path, "utf-8");
      const parsed = JSON.parse(raw) as Conversation[];
      const filtered =
        channel === "all"
          ? parsed
          : parsed.filter((c) => c.channel === channel);

      const paged = filtered.slice(offset, offset + limit);

      return NextResponse.json({
        source: "live",
        conversations: paged,
        total: filtered.length,
      } satisfies ConversationsResponse);
    } catch {
      // File not readable — try next path
    }
  }

  // Fall back to demo data
  const filtered =
    channel === "all"
      ? DEMO_CONVERSATIONS
      : DEMO_CONVERSATIONS.filter((c) => c.channel === channel);

  const paged = filtered.slice(offset, offset + limit);

  return NextResponse.json({
    source: "demo",
    conversations: paged,
    total: filtered.length,
  } satisfies ConversationsResponse);
}
