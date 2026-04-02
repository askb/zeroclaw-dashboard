// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2026 Anil Belur <askb23@gmail.com>

import { Search, Bell } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] px-6 py-3">
      <div>
        <h1 className="text-base font-semibold text-[var(--color-text-primary)]">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-[var(--color-text-tertiary)]">
            {subtitle}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <button
          className="flex h-8 items-center gap-2 rounded-md border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] px-3 text-xs text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-border-strong)]"
          aria-label="Search"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Search...</span>
          <kbd className="ml-4 rounded border border-[var(--color-border-default)] px-1 py-0.5 text-[10px] text-[var(--color-text-tertiary)]">
            ⌘K
          </kbd>
        </button>
        <button
          className="relative flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-[var(--color-bg-hover)]"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4 text-[var(--color-text-secondary)]" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
        </button>
      </div>
    </header>
  );
}
