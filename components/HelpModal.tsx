// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2026 Anil Belur <askb23@gmail.com>

"use client";

import { useEffect, useRef } from "react";

interface Shortcut {
  keys: string[];
  description: string;
}

const shortcuts: Shortcut[] = [
  { keys: ["g", "t"], description: "Go to Tasks" },
  { keys: ["g", "m"], description: "Go to Memory" },
  { keys: ["g", "d"], description: "Go to Docs" },
  { keys: ["g", "c"], description: "Go to Calendar" },
  { keys: ["g", "p"], description: "Go to Projects" },
  { keys: ["g", "e"], description: "Go to Team" },
  { keys: ["g", "o"], description: "Go to Office" },
  { keys: ["g", "s"], description: "Go to Settings" },
  { keys: ["?"], description: "Toggle this help" },
  { keys: ["Esc"], description: "Close modal" },
];

function Kbd({ children }: { children: string }) {
  return (
    <kbd
      className="inline-flex h-6 min-w-6 items-center justify-center rounded-[5px] px-1.5 text-xs font-medium leading-none"
      style={{
        background: "var(--color-bg-hover)",
        border: "1px solid var(--color-border-strong)",
        boxShadow: "0 1px 0 var(--color-border-default)",
        color: "var(--color-text-primary)",
      }}
    >
      {children}
    </kbd>
  );
}

interface HelpModalProps {
  open: boolean;
  onClose: () => void;
}

export default function HelpModal({ open, onClose }: HelpModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(4px)" }}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        className="w-full max-w-md rounded-xl p-6 shadow-2xl"
        style={{
          background: "var(--color-bg-secondary)",
          border: "1px solid var(--color-border-default)",
        }}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2
            className="text-base font-semibold"
            style={{ color: "var(--color-text-primary)" }}
          >
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 transition-colors"
            style={{ color: "var(--color-text-tertiary)" }}
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M4 4l8 8M12 4l-8 8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-2">
          {shortcuts.map((s) => (
            <div
              key={s.description}
              className="flex items-center justify-between rounded-md px-3 py-2"
              style={{ background: "var(--color-bg-primary)" }}
            >
              <span
                className="text-sm"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {s.description}
              </span>
              <span className="flex gap-1">
                {s.keys.map((k, i) => (
                  <span key={i} className="flex items-center gap-1">
                    {i > 0 && (
                      <span
                        className="text-xs"
                        style={{ color: "var(--color-text-tertiary)" }}
                      >
                        then
                      </span>
                    )}
                    <Kbd>{k}</Kbd>
                  </span>
                ))}
              </span>
            </div>
          ))}
        </div>

        <p
          className="mt-4 text-center text-xs"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          Press <Kbd>?</Kbd> anywhere to toggle this panel
        </p>
      </div>
    </div>
  );
}

export function HelpButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Keyboard shortcuts"
      className="fixed bottom-4 right-4 z-40 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold shadow-lg transition-colors"
      style={{
        background: "var(--color-bg-tertiary)",
        border: "1px solid var(--color-border-default)",
        color: "var(--color-text-secondary)",
      }}
    >
      ?
    </button>
  );
}
