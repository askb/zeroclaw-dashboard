// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2026 Anil Belur <askb23@gmail.com>

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

type ToastType = "info" | "success" | "warning" | "error";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  exiting?: boolean;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const typeStyles: Record<ToastType, string> = {
  info: "border-l-[var(--color-info)] bg-[var(--color-bg-tertiary)]",
  success: "border-l-[var(--color-success)] bg-[var(--color-bg-tertiary)]",
  warning: "border-l-[var(--color-warning)] bg-[var(--color-bg-tertiary)]",
  error: "border-l-[var(--color-error)] bg-[var(--color-bg-tertiary)]",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  useEffect(() => {
    if (toasts.length === 0) return;

    const latest = toasts[toasts.length - 1];
    if (latest.exiting) return;

    const exitTimer = setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === latest.id ? { ...t, exiting: true } : t)),
      );
    }, 2600);

    const removeTimer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== latest.id));
    }, 3000);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [toasts]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center rounded-md border-l-[3px] px-4 py-2.5 text-sm shadow-lg backdrop-blur-sm transition-all duration-300 ${typeStyles[t.type]} ${
              t.exiting
                ? "translate-x-full opacity-0"
                : "translate-x-0 opacity-100 animate-[slideInRight_0.3s_ease-out]"
            }`}
            style={{
              border: "1px solid var(--color-border-default)",
              color: "var(--color-text-primary)",
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
