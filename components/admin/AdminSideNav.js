"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "@/components/icons";
import AdminUserToggle from "@/components/AdminUserToggle";
import { useAdminNav } from "@/lib/AdminNavContext";

export function AdminSectionChip({ label, className = "" }) {
  return (
    <div className={`min-w-0 rounded-2xl border border-[#163044]/10 bg-card px-3 py-1.5 shadow-card sm:px-3.5 sm:py-2 dark:border-white/10 ${className}`}>
      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground sm:text-[10px]">Section</p>
      <p className="truncate text-sm font-black leading-tight text-foreground">{label}</p>
    </div>
  );
}

export default function AdminSideNav({ tabs, activeId, onSelect, badges = {}, hideChip = false }) {
  const { open, setOpen, register, unregister } = useAdminNav();
  const [shown, setShown] = useState(false);
  const [entered, setEntered] = useState(false);
  const [mounted, setMounted] = useState(false);
  const titleId = useId();
  const active = tabs.find((tab) => tab.id === activeId) || tabs[0];

  useEffect(() => {
    setMounted(true);
  }, []);

  const badgeKey = JSON.stringify(badges || {});
  useEffect(() => {
    register({ activeId, label: active?.label || "Admin", badges: JSON.parse(badgeKey) });
    return () => unregister();
  }, [activeId, active?.label, badgeKey, register, unregister]);

  useEffect(() => {
    if (open) setShown(true);
    else setEntered(false);
  }, [open]);

  useEffect(() => {
    if (!shown || !open) return undefined;
    setEntered(false);
    let frame2 = 0;
    const frame1 = window.requestAnimationFrame(() => {
      frame2 = window.requestAnimationFrame(() => setEntered(true));
    });
    return () => {
      window.cancelAnimationFrame(frame1);
      window.cancelAnimationFrame(frame2);
    };
  }, [shown, open]);

  useEffect(() => {
    if (open || !shown) return undefined;
    const timer = window.setTimeout(() => setShown(false), 340);
    return () => window.clearTimeout(timer);
  }, [open, shown]);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen]);

  const choose = (id) => {
    onSelect?.(id);
    setOpen(false);
  };

  const ease = "duration-[340ms] ease-[cubic-bezier(0.22,1,0.36,1)]";

  const drawer = shown && mounted ? createPortal(
    <div className="fixed inset-0 z-[80]" role="presentation">
      <button
        type="button"
        aria-label="Close menu"
        className={`absolute inset-0 bg-[#163044]/40 backdrop-blur-[3px] transition-opacity ${ease} ${
          entered ? "opacity-100" : "opacity-0"
        }`}
        onClick={() => setOpen(false)}
      />
      <aside
        id="admin-side-nav"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`admin-side-nav absolute left-3 top-[4.5rem] flex w-[min(18.5rem,calc(100vw-1.5rem))] max-h-[calc(100dvh-5.25rem)] origin-top-left flex-col overflow-hidden rounded-[1.75rem] border border-[#163044]/12 bg-[#FBF8F1] text-[#163044] shadow-[0_24px_60px_rgba(22,48,68,0.28)] backdrop-blur-xl transition-[transform,opacity] ${ease} sm:left-4 sm:top-[4.75rem] sm:max-h-[calc(100dvh-5.5rem)] lg:top-[5rem] dark:border-white/12 dark:bg-[#151922] dark:text-[#F5F3EE] dark:shadow-[0_24px_60px_rgba(0,0,0,0.55)] ${
            entered
            ? "translate-x-0 scale-100 opacity-100"
            : "-translate-x-5 scale-[0.96] opacity-0"
        }`}
      >
        <div
          className={`flex shrink-0 items-center justify-between gap-2 border-b border-[#163044]/08 px-3 py-3 transition-[transform,opacity] delay-75 duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] dark:border-white/10 ${
            entered ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"
          }`}
        >
          <p id={titleId} className="sr-only">Admin menu</p>
          <AdminUserToggle className="shrink-0" />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#163044]/08 text-[#163044] transition hover:bg-[#163044]/14 dark:bg-white/10 dark:text-[#F5F3EE] dark:hover:bg-white/16"
            aria-label="Close"
          >
            <X className="h-4 w-4" color="currentColor" />
          </button>
        </div>

        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain p-2.5">
          {tabs.map((tab, index) => {
            const on = tab.id === activeId;
            const badge = badges[tab.id];
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => choose(tab.id)}
                style={{ transitionDelay: entered ? `${90 + index * 28}ms` : "0ms" }}
                className={`flex w-full items-center justify-between gap-3 rounded-2xl px-3.5 py-2.5 text-left text-sm font-bold transition-[transform,opacity,background-color,color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  entered ? "translate-x-0 opacity-100" : "-translate-x-3 opacity-0"
                } ${
                  on
                    ? "bg-[#163044] text-[#F7F4EC] shadow-sm dark:bg-[#2A3544]"
                    : "text-[#2A3F4D] hover:bg-[#C9D6E0]/45 dark:text-[#E8E4DC] dark:hover:bg-white/10"
                }`}
              >
                <span>{tab.label}</span>
                {badge ? (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-black tabular-nums ${
                      on ? "bg-[#F6C56B] text-[#7A4A00]" : "bg-[#FFF4D6] text-[#B45309] dark:bg-[#3A2E14] dark:text-[#F6C56B]"
                    }`}
                  >
                    {badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </aside>
    </div>,
    document.body
  ) : null;

  return (
    <>
      {hideChip ? null : <AdminSectionChip label={active?.label} className="max-w-sm" />}
      {drawer}
    </>
  );
}
