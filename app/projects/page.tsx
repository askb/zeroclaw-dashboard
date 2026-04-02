// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2026 Anil Belur <askb23@gmail.com>

import Header from "@/components/layout/Header";
import { Target, ArrowRight, Sparkles } from "lucide-react";

const projects = [
  {
    id: "p1",
    name: "ZeroClaw Hardening",
    status: "Active",
    progress: 75,
    description: "Security hardening, exec approvals, and governance framework",
    tasks: { total: 16, done: 10 },
  },
  {
    id: "p2",
    name: "Custom Dashboard",
    status: "Active",
    progress: 10,
    description: "Linear-inspired Next.js dashboard for agent management",
    tasks: { total: 35, done: 0 },
  },
  {
    id: "p3",
    name: "Skill Expansion",
    status: "Planning",
    progress: 0,
    description: "n8n, Home Assistant, and coding agent integrations",
    tasks: { total: 6, done: 0 },
  },
];

export default function ProjectsPage() {
  return (
    <>
      <Header
        title="Projects"
        subtitle="High-level goals with reverse prompting"
      />
      <div className="flex-1 overflow-auto p-6">
        {/* Reverse Prompting card */}
        <div className="mb-6 rounded-lg border border-[var(--color-accent-muted)] bg-[var(--color-accent-muted)] p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 text-[var(--color-text-accent)]" />
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-text-accent)]">
                AI Suggestion — Next Best Move
              </h3>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                &quot;Based on your current progress, I recommend completing the{" "}
                <span className="font-medium text-[var(--color-text-primary)]">
                  env var secrets isolation
                </span>{" "}
                before starting Dashboard Phase 2. The OPENROUTER_API_KEY is
                still visible to agents via echo — this is a critical security
                gap.&quot;
              </p>
              <button className="mt-3 flex items-center gap-1 text-xs font-medium text-[var(--color-text-accent)] transition-colors hover:text-[var(--color-accent-hover)]">
                Accept suggestion
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Project cards */}
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => (
            <div
              key={p.id}
              className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] p-5 transition-colors hover:border-[var(--color-border-default)]"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-[var(--color-accent)]" />
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                    {p.name}
                  </h3>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    p.status === "Active"
                      ? "bg-[var(--color-success)]/20 text-[var(--color-success)]"
                      : "bg-[var(--color-text-tertiary)]/20 text-[var(--color-text-secondary)]"
                  }`}
                >
                  {p.status}
                </span>
              </div>
              <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
                {p.description}
              </p>
              {/* Progress bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[var(--color-text-tertiary)]">
                    {p.tasks.done}/{p.tasks.total} tasks
                  </span>
                  <span className="text-[var(--color-text-secondary)]">
                    {p.progress}%
                  </span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-[var(--color-bg-tertiary)]">
                  <div
                    className="h-full rounded-full bg-[var(--color-accent)]"
                    style={{ width: `${p.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
