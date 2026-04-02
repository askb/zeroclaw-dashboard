// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2026 Anil Belur <askb23@gmail.com>

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  FolderKanban,
  Brain,
  FileText,
  Users,
  Building2,
  Cog,
  Zap,
} from "lucide-react";

const navItems = [
  { href: "/tasks", label: "Tasks", icon: LayoutDashboard },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/memory", label: "Memory", icon: Brain },
  { href: "/docs", label: "Docs", icon: FileText },
  { href: "/team", label: "Team", icon: Users },
  { href: "/office", label: "Office", icon: Building2 },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-56 flex-col border-r border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)]">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-[var(--color-border-subtle)]">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--color-accent)] text-white">
          <Zap className="h-4 w-4" />
        </div>
        <span className="text-sm font-semibold tracking-tight text-[var(--color-text-primary)]">
          ZeroClaw
        </span>
        <span className="ml-auto rounded bg-[var(--color-accent-muted)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-text-accent)]">
          MC
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <ul className="space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive =
              pathname === href || pathname.startsWith(`${href}/`);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                    isActive
                      ? "bg-[var(--color-bg-active)] text-[var(--color-text-primary)] font-medium"
                      : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-[var(--color-border-subtle)] px-2 py-3">
        <Link
          href="/settings"
          className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-[var(--color-text-tertiary)] transition-colors hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-secondary)]"
        >
          <Cog className="h-4 w-4" />
          Settings
        </Link>
        <div className="mt-2 px-2.5 text-[11px] text-[var(--color-text-tertiary)]">
          ZeroClaw v0.1.0
        </div>
      </div>
    </aside>
  );
}
