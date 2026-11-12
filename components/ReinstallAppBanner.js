"use client";

import { useEffect, useState } from "react";
import { X } from "@/components/icons";
import { isIOS, isStandaloneApp } from "@/lib/installApp";

/** Bump this when an iOS Home Screen shortcut must be deleted and added again. */
const REINSTALL_ID = "2026-11-status-bar";
const DISMISS_KEY = "khaki.reinstallDismissed";

const STEPS = [
  { title: "Delete the old icon", detail: "Press and hold Khaki on the Home Screen, then tap Remove App." },
  { title: "Open Safari", detail: "Go to khakiplatform.com. The install only works in Safari." },
  { title: "Add it again", detail: "Tap Share, then Add to Home Screen, then Add." },
];

export default function ReinstallAppBanner() {
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isIOS() || !isStandaloneApp()) return;
    try {
      if (window.localStorage.getItem(DISMISS_KEY) === REINSTALL_ID) return;
    } catch {
      /* show the notice if storage is blocked */
    }
    setVisible(true);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    try {
      window.localStorage.setItem(DISMISS_KEY, REINSTALL_ID);
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  return (
    <div className="mx-auto mb-4 w-full max-w-6xl px-4 pt-2 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-[1.35rem] bg-white shadow-[0_8px_18px_rgba(22,48,68,0.12)] ring-1 ring-[#E6DFD2] dark:bg-[#1A1E27] dark:ring-[#2A303C]">
        <div className="flex items-center gap-1.5 py-2 pl-2.5 pr-1.5 sm:gap-2 sm:py-2.5 sm:pl-3 sm:pr-2">
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-2xl text-left"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo-mark.png" alt="" className="h-11 w-11 shrink-0 bg-transparent object-contain" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-black tracking-tight text-[#163044] dark:text-[#F5F3EE]">Update your Home Screen icon</span>
              <span className="mt-0.5 block text-[12px] font-medium leading-snug text-[#6B6558] dark:text-[#94A3B8]">
                Delete Khaki, then add it again from Safari. That clears the blurry bar at the top.
              </span>
            </span>
            <span className="inline-flex h-9 shrink-0 items-center rounded-full bg-[#163044] px-3.5 text-xs font-black text-[#F7F4EC] dark:bg-[#F5F3EE] dark:text-[#11141A]">
              {open ? "Hide" : "How"}
            </span>
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#6B6558] transition hover:bg-[#F3EFE3] dark:text-[#94A3B8] dark:hover:bg-[#252A35]"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" color="currentColor" />
          </button>
        </div>
        {open ? (
          <ol className="space-y-2.5 border-t border-[#E6DFD2] bg-[#FBF8F1] px-3 py-3 dark:border-[#2A303C] dark:bg-[#151922] sm:px-4">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-2.5">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#163044] text-[11px] font-black text-[#F7F4EC] dark:bg-[#F5F3EE] dark:text-[#11141A]">
                  {index + 1}
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-black text-[#163044] dark:text-[#F5F3EE]">{step.title}</span>
                  <span className="block text-[12px] font-medium leading-snug text-[#6B6558] dark:text-[#94A3B8]">{step.detail}</span>
                </span>
              </li>
            ))}
          </ol>
        ) : null}
      </div>
    </div>
  );
}
