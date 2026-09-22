"use client";

import { useCallback, useEffect, useState } from "react";
import { bindToast } from "@/lib/toast";
import { cn } from "@/lib/khaki";

const DURATION = 3200;

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
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-6"
        aria-live="polite"
        aria-relevant="additions"
      >
        {items.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              "pointer-events-auto flex max-w-md items-start gap-3 rounded-2xl px-4 py-3 text-sm font-semibold shadow-soft animate-fade-in-up",
              t.type === "error" && "bg-[#DC2626] text-white",
              t.type === "info" && "bg-[#2A3F4D] text-[#F7F4EC]",
              t.type === "success" && "bg-[#3D5C6E] text-[#F7F4EC]"
            )}
          >
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
