// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2026 Anil Belur <askb23@gmail.com>

import Header from "@/components/layout/Header";
import { Shield, Cpu, HardDrive, Wifi, Bell } from "lucide-react";

const sections = [
  {
    title: "Gateway",
    icon: Wifi,
    items: [
      { label: "Gateway URL", value: "ws://gateway:18789", editable: false },
      { label: "Auth Mode", value: "Token", editable: false },
      { label: "Bind Mode", value: "LAN (127.0.0.1)", editable: false },
    ],
  },
  {
    title: "Security",
    icon: Shield,
    items: [
      { label: "Exec Approvals", value: "30+ deny patterns", editable: false },
      { label: "Secrets Audit", value: "Clean (0 plaintext)", editable: false },
      { label: "HTTPS (Caddy)", value: "Active on :8443", editable: false },
    ],
  },
  {
    title: "Services",
    icon: Cpu,
    items: [
      { label: "Gateway", value: "Healthy", editable: false },
      { label: "Dashboard", value: "Healthy", editable: false },
      { label: "Redis", value: "Healthy", editable: false },
      { label: "SearXNG", value: "Healthy", editable: false },
      { label: "Caddy", value: "Healthy", editable: false },
    ],
  },
  {
    title: "Resources",
    icon: HardDrive,
    items: [
      { label: "Gateway Memory", value: "4G limit", editable: false },
      { label: "Dashboard Memory", value: "512M limit", editable: false },
      { label: "Redis Memory", value: "256M limit", editable: false },
      { label: "SearXNG Memory", value: "256M limit", editable: false },
    ],
  },
];

export default function SettingsPage() {
  return (
    <>
      <Header title="Settings" subtitle="System configuration and status" />
      <div className="flex-1 overflow-auto p-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <div
                key={section.title}
                className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)]"
              >
                <div className="flex items-center gap-2 border-b border-[var(--color-border-subtle)] px-5 py-3">
                  <Icon className="h-4 w-4 text-[var(--color-accent)]" />
                  <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                    {section.title}
                  </h2>
                </div>
                <div className="divide-y divide-[var(--color-border-subtle)]">
                  {section.items.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between px-5 py-2.5"
                    >
                      <span className="text-xs text-[var(--color-text-secondary)]">
                        {item.label}
                      </span>
                      <span className="text-xs font-medium text-[var(--color-text-primary)]">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Notifications placeholder */}
        <div className="mt-6 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] p-5">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="h-4 w-4 text-[var(--color-accent)]" />
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
              Notifications
            </h2>
          </div>
          <p className="text-xs text-[var(--color-text-tertiary)]">
            Notification preferences will be configurable in a future update.
          </p>
        </div>
      </div>
    </>
  );
}
