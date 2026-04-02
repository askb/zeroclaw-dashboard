// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2026 Anil Belur <askb23@gmail.com>

import Header from "@/components/layout/Header";
import { FileText, Search, FolderOpen } from "lucide-react";

const docs = [
  {
    category: "Architecture",
    items: [
      {
        title: "Constitution.md",
        path: ".specify/memory/constitution.md",
        updated: "2026-04-02",
        lines: 180,
      },
      {
        title: "Dashboard Spec (001)",
        path: "specs/001-zeroclaw-dashboard/spec.md",
        updated: "2026-04-02",
        lines: 250,
      },
    ],
  },
  {
    category: "Governance",
    items: [
      {
        title: "AGENTS.md",
        path: "AGENTS.md",
        updated: "2026-04-01",
        lines: 120,
      },
      {
        title: "Copilot Instructions",
        path: ".github/copilot-instructions.md",
        updated: "2026-04-01",
        lines: 85,
      },
    ],
  },
  {
    category: "Operations",
    items: [
      {
        title: "Exec Approvals",
        path: "config/gateway/exec-approvals.json",
        updated: "2026-04-01",
        lines: 95,
      },
      {
        title: "SearXNG Settings",
        path: "config/searxng/settings.yml",
        updated: "2026-04-01",
        lines: 45,
      },
    ],
  },
];

export default function DocsPage() {
  return (
    <>
      <Header
        title="Docs"
        subtitle="Centralized repository for architecture, governance, and plans"
      />
      <div className="flex-1 overflow-auto p-6">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
          <input
            type="text"
            placeholder="Search documentation..."
            className="h-9 w-full rounded-md border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] pl-10 pr-4 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-accent)] focus:outline-none"
          />
        </div>

        {/* Doc categories */}
        <div className="space-y-6">
          {docs.map((cat) => (
            <div key={cat.category}>
              <div className="mb-3 flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-[var(--color-text-tertiary)]" />
                <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {cat.category}
                </h2>
                <span className="text-xs text-[var(--color-text-tertiary)]">
                  ({cat.items.length})
                </span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {cat.items.map((doc) => (
                  <div
                    key={doc.path}
                    className="cursor-pointer rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] p-4 transition-colors hover:border-[var(--color-border-default)]"
                  >
                    <div className="flex items-start gap-2">
                      <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-accent)]" />
                      <div>
                        <h3 className="text-sm font-medium text-[var(--color-text-primary)]">
                          {doc.title}
                        </h3>
                        <p className="mt-1 font-mono text-[10px] text-[var(--color-text-tertiary)]">
                          {doc.path}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-3 text-[10px] text-[var(--color-text-tertiary)]">
                      <span>{doc.updated}</span>
                      <span>·</span>
                      <span>{doc.lines} lines</span>
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
