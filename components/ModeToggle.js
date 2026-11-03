"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { cn } from "@/lib/khaki";
import { activeMode, mustCompleteVerification } from "@/lib/roles";
import { toast } from "@/lib/toast";

const HOME = "/dashboard";

export default function ModeToggle({ className = "", track = "bg-[#163044] dark:bg-[#163044]" }) {
  const { user, setMode, modeFlash } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);
  const mode = activeMode(user);
  const locked = busy || Boolean(modeFlash);
  const needsVerify = mustCompleteVerification(user);

  const switchTo = async (next) => {
    if (!user || next === mode || locked) return;
    if (needsVerify) {
      toast.error("Verify your account first before switching to Poster or Tasker.");
      router.push("/verify");
      return;
    }
    setBusy(true);
    try {
      await setMode(next);
      toast.success(next === "poster" ? "Switched to Poster" : "Switched to Tasker");
      if (pathname !== HOME) router.push(HOME);
      router.refresh();
    } catch (err) {
      toast.error(err?.message || "Could not switch mode");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={cn("inline-flex rounded-full p-1", track, className)}
      role="tablist"
      aria-label="Account mode"
    >
      <button
        type="button"
        role="tab"
        aria-selected={mode === "poster"}
        disabled={locked}
        onClick={() => switchTo("poster")}
        className={`rounded-full px-2.5 py-1 text-[11px] font-black transition min-[400px]:px-3.5 min-[400px]:py-1.5 min-[400px]:text-xs sm:px-4 ${
          mode === "poster" ? "mode-toggle-on bg-[#C6ECD9] text-[#163044] shadow-sm dark:bg-[#C6ECD9]" : "text-[#F7F4EC] hover:bg-white/15 dark:text-[#F7F4EC]"
        }`}
      >
        Poster
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === "tasker"}
        disabled={locked}
        onClick={() => switchTo("tasker")}
        className={`rounded-full px-2.5 py-1 text-[11px] font-black transition min-[400px]:px-3.5 min-[400px]:py-1.5 min-[400px]:text-xs sm:px-4 ${
          mode === "tasker" ? "mode-toggle-on bg-[#C6ECD9] text-[#163044] shadow-sm dark:bg-[#C6ECD9]" : "text-[#F7F4EC] hover:bg-white/15 dark:text-[#F7F4EC]"
        }`}
      >
        Tasker
      </button>
    </div>
  );
}
