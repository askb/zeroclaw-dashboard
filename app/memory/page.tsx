// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2026 Anil Belur <askb23@gmail.com>

import Header from "@/components/layout/Header";
import { Search, Filter, Brain } from "lucide-react";

const memoryEntries = [
  {
    date: "2026-04-02",
    entries: [
      {
        time: "06:45",
        agent: "Code Architect",
        type: "decision",
        title: "Dashboard tech stack chosen",
        preview:
          "Selected Next.js 15 + Tailwind + Lucide icons. Linear-inspired dark theme. Separate repo from mission-control.",
      },
      {
        time: "05:30",
        agent: "Orchestrator",
        type: "context",
        title: "Constitution governance ratified",
        preview:
          "8 principles established. Repo allowlist: 12 repos. Analysis-first protocol enforced across all agents.",
      },
    ],
  },
  {
    date: "2026-04-01",
    entries: [
      {
        time: "22:10",
        agent: "Code Architect",
        type: "action",
        title: "SearXNG deployed as internal metasearch",
        preview:
          "52 results from 6 engines. Internal-only, no host port. Read-only FS with cap_drop ALL.",
      },
      {
        time: "20:45",
        agent: "Code Architect",
        type: "decision",
        title: "Exec approvals tightened to 30+ deny patterns",
        preview:
          "Blocked: force push, push to main, docker start/stop, env/printenv, n8n/HA writes. Scoped allows for approved branches only.",
      },
      {
        time: "18:30",
        agent: "Orchestrator",
        type: "context",
        title: "Security audit — 1 critical remaining",
        preview:
          "dangerouslyDisableDeviceAuth required for HTTP LAN. Will be resolved by Caddy HTTPS proxy.",
      },
    ],
  },
];

const typeColors: Record<string, string> = {
  decision: "bg-[var(--color-accent-muted)] text-[var(--color-text-accent)]",
  action: "bg-[var(--color-success)]/20 text-[var(--color-success)]",
  context: "bg-[var(--color-info)]/20 text-[var(--color-info)]",
};

export default function MemoryPage() {
  return (
    <>
      <Header
        title="Memory"
        subtitle="Searchable journal of agent long-term and short-term memory"
      />
      <div className="flex-1 overflow-auto p-6">
        {/* Search bar */}
        <div className="mb-6 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
            <input
              type="text"
              placeholder="Search memory entries..."
              className="h-9 w-full rounded-md border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] pl-10 pr-4 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-accent)] focus:outline-none"
            />
          </div>
          <button className="flex h-9 items-center gap-2 rounded-md border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] px-3 text-xs text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-border-strong)]">
            <Filter className="h-3.5 w-3.5" />
            Filter
          </button>
        </div>

        {/* Timeline */}
        <div className="space-y-8">
          {memoryEntries.map((group) => (
            <div key={group.date}>
              <h2 className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">
                {group.date}
              </h2>
              <div className="space-y-2">
                {group.entries.map((entry, i) => (
                  <div
                    key={i}
                    className="flex gap-4 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] p-4 transition-colors hover:border-[var(--color-border-default)]"
                  >
                    <div className="flex flex-col items-center">
                      <Brain className="h-4 w-4 text-[var(--color-text-tertiary)]" />
                      <div className="mt-2 h-full w-px bg-[var(--color-border-subtle)]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-[var(--color-text-primary)]">
                          {entry.title}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] ${typeColors[entry.type]}`}
                        >
                          {entry.type}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">
                        {entry.preview}
                      </p>
                      <div className="mt-2 flex items-center gap-3 text-[10px] text-[var(--color-text-tertiary)]">
                        <span>{entry.time}</span>
                        <span>·</span>
                        <span>{entry.agent}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
