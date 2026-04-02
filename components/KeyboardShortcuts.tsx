// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2026 Anil Belur <askb23@gmail.com>

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import HelpModal, { HelpButton } from "@/components/HelpModal";
import { useToast } from "@/components/Toast";

const goToRoutes: Record<string, string> = {
  t: "/tasks",
  m: "/memory",
  d: "/docs",
  c: "/calendar",
  p: "/projects",
  e: "/team",
  o: "/office",
  s: "/settings",
};

function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if ((el as HTMLElement).isContentEditable) return true;
  return false;
}

export default function KeyboardShortcuts() {
  const router = useRouter();
  const { toast } = useToast();
  const [helpOpen, setHelpOpen] = useState(false);
  const goModeRef = useRef(false);
  const goTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearGoMode = useCallback(() => {
    goModeRef.current = false;
    if (goTimerRef.current) {
      clearTimeout(goTimerRef.current);
      goTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isInputFocused()) return;

      // Escape closes modals
      if (e.key === "Escape") {
        if (helpOpen) setHelpOpen(false);
        clearGoMode();
        return;
      }

      // ? toggles help
      if (e.key === "?") {
        e.preventDefault();
        setHelpOpen((prev) => !prev);
        clearGoMode();
        return;
      }

      // Second key in "go to" mode
      if (goModeRef.current) {
        const route = goToRoutes[e.key];
        clearGoMode();
        if (route) {
          e.preventDefault();
          router.push(route);
        }
        return;
      }

      // Start "go to" mode
      if (e.key === "g") {
        goModeRef.current = true;
        toast("Go to…", "info");
        goTimerRef.current = setTimeout(() => {
          goModeRef.current = false;
        }, 1000);
        return;
      }
    };

    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      clearGoMode();
    };
  }, [router, toast, helpOpen, clearGoMode]);

  return (
    <>
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
      <HelpButton onClick={() => setHelpOpen(true)} />
    </>
  );
}
