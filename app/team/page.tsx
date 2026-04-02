// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2026 Anil Belur <askb23@gmail.com>

import Header from "@/components/layout/Header";
import { Bot, Shield, Code, Search, Zap } from "lucide-react";

const missionStatement =
  "To build a zero-trust AI agent orchestration platform that is secure by default, analysis-first, and accountable through transparent governance.";

const agents = [
  {
    id: "orchestrator",
    name: "Orchestrator",
    role: "Manager",
    icon: Zap,
    status: "online",
    description:
      "Task delegation, agent coordination, analysis-first enforcement",
    skills: ["Task routing", "Priority assessment", "Agent coordination"],
  },
  {
    id: "code-architect",
    name: "Code Architect",
    role: "Senior Developer",
    icon: Code,
    status: "busy",
    description: "Code review, PR creation, infrastructure automation",
    skills: [
      "GitHub CLI",
      "Shell scripting",
      "Docker",
      "Infrastructure as Code",
    ],
  },
  {
    id: "researcher",
    name: "Research Specialist",
    role: "Research Analyst",
    icon: Search,
    status: "idle",
    description:
      "Information gathering, fact-checking, source citation, SearXNG search",
    skills: ["Web search", "ArXiv", "Documentation analysis"],
  },
  {
    id: "security",
    name: "Security Sentinel",
    role: "Security Engineer",
    icon: Shield,
    status: "online",
    description:
      "Exec approval enforcement, audit trail, prompt injection defense",
    skills: [
      "Threat modeling",
      "Policy enforcement",
      "Compliance verification",
    ],
  },
];

const statusColors: Record<string, string> = {
  online: "bg-[var(--color-success)]",
  busy: "bg-[var(--color-warning)]",
  idle: "bg-[var(--color-text-tertiary)]",
  offline: "bg-[var(--color-error)]",
};

export default function TeamPage() {
  return (
    <>
      <Header
        title="Team"
        subtitle="Agent organizational chart and status"
      />
      <div className="flex-1 overflow-auto p-6">
        {/* Mission statement */}
        <div className="mb-8 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] p-6 text-center">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
            Mission Statement
          </h2>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-[var(--color-text-secondary)]">
            {missionStatement}
          </p>
        </div>

        {/* Org chart */}
        <div className="mb-6 flex items-center gap-2">
          <Bot className="h-4 w-4 text-[var(--color-text-tertiary)]" />
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Agent Roster
          </h2>
          <span className="text-xs text-[var(--color-text-tertiary)]">
            ({agents.length} agents)
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {agents.map((agent) => {
            const Icon = agent.icon;
            return (
              <div
                key={agent.id}
                className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] p-5 transition-colors hover:border-[var(--color-border-default)]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-bg-tertiary)]">
                    <Icon className="h-5 w-5 text-[var(--color-accent)]" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`h-2 w-2 rounded-full ${statusColors[agent.status]}`}
                    />
                    <span className="text-[10px] text-[var(--color-text-tertiary)]">
                      {agent.status}
                    </span>
                  </div>
                </div>
                <h3 className="mt-3 text-sm font-semibold text-[var(--color-text-primary)]">
                  {agent.name}
                </h3>
                <p className="text-xs text-[var(--color-text-accent)]">
                  {agent.role}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-[var(--color-text-secondary)]">
                  {agent.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {agent.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-[var(--color-bg-tertiary)] px-2 py-0.5 text-[10px] text-[var(--color-text-tertiary)]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
