"use client";

import { useCallback, useEffect, useState } from "react";
import { bindToast } from "@/lib/toast";
import { cn } from "@/lib/khaki";

const DURATION = 3200;

const TONE = {
  success: "border-[#6EE7B7] bg-[#ECFDF5] text-[#065F46]",
  error: "border-[#FECACA] bg-[#FEF2F2] text-[#991B1B]",
  info: "border-[#BFDBFE] bg-[#EFF6FF] text-[#1E40AF]",
};

const DOT = {
  success: "bg-[#059669]",
  error: "bg-[#DC2626]",
  info: "bg-[#2563EB]",
};

export default function ToastProvider({ children }) {
  const [items, setItems] = useState([]);

  const dismiss = useCallback((id) => {
    setItems((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((toast) => {
    setItems((list) => [...list.slice(-4), toast]);
  }, []);

  useEffect(() => bindToast(push), [push]);

  useEffect(() => {
    if (!items.length) return undefined;
    const timers = items.map((t) => setTimeout(() => dismiss(t.id), DURATION));
    return () => timers.forEach(clearTimeout);
  }, [items, dismiss]);

  return (
    <>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 sm:top-5"
        aria-live="polite"
        aria-relevant="additions"
      >
        {items.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              "pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-soft animate-toast-in",
              TONE[t.type] || TONE.success
            )}
          >
            <span className={cn("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", DOT[t.type] || DOT.success)} aria-hidden />
            <span className="flex-1 leading-snug">{t.message}</span>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="shrink-0 text-current/70 hover:text-current"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
