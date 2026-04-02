// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2026 Anil Belur <askb23@gmail.com>

import Header from "@/components/layout/Header";

const agents = [
  { id: "orchestrator", name: "Manager", x: 200, y: 120, activity: "desk" },
  { id: "coder", name: "Coder", x: 400, y: 200, activity: "desk" },
  { id: "researcher", name: "Researcher", x: 120, y: 280, activity: "cooler" },
  { id: "security", name: "Security", x: 350, y: 320, activity: "meeting" },
];

const activityEmojis: Record<string, string> = {
  desk: "💻",
  cooler: "☕",
  meeting: "🤝",
  idle: "💤",
};

const activityLabels: Record<string, string> = {
  desk: "Working at desk",
  cooler: "At the water cooler",
  meeting: "In a meeting",
  idle: "Away",
};

export default function OfficePage() {
  return (
    <>
      <Header
        title="Office"
        subtitle="2D pixel-art office — agents at desks, coolers, and meetings"
      />
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="relative h-[480px] w-[600px] rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] p-4">
          {/* Floor grid */}
          <div
            className="absolute inset-4"
            style={{
              backgroundImage:
                "linear-gradient(var(--color-border-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--color-border-subtle) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          {/* Room labels */}
          <div className="absolute left-8 top-8 rounded bg-[var(--color-bg-tertiary)] px-2 py-1 text-[10px] text-[var(--color-text-tertiary)]">
            🖥️ Dev Area
          </div>
          <div className="absolute right-8 top-8 rounded bg-[var(--color-bg-tertiary)] px-2 py-1 text-[10px] text-[var(--color-text-tertiary)]">
            📋 War Room
          </div>
          <div className="absolute bottom-8 left-8 rounded bg-[var(--color-bg-tertiary)] px-2 py-1 text-[10px] text-[var(--color-text-tertiary)]">
            ☕ Break Room
          </div>

          {/* Agent sprites */}
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="absolute flex flex-col items-center"
              style={{
                left: agent.x,
                top: agent.y,
                transform: "translate(-50%, -50%)",
              }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] text-2xl shadow-lg transition-transform hover:scale-110">
                {activityEmojis[agent.activity]}
              </div>
              <span className="mt-1 text-[11px] font-medium text-[var(--color-text-primary)]">
                {agent.name}
              </span>
              <span className="text-[9px] text-[var(--color-text-tertiary)]">
                {activityLabels[agent.activity]}
              </span>
            </div>
          ))}

          {/* Phase 6: Replace with Canvas-based rendering */}
          <div className="absolute bottom-4 right-4 rounded bg-[var(--color-accent-muted)] px-2 py-1 text-[10px] text-[var(--color-text-accent)]">
            Preview — Canvas rendering in Phase 6
          </div>
        </div>
      </div>
    </>
  );
}
