"use client";

import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { activeMode } from "@/lib/roles";
import { toast } from "@/lib/toast";

export default function ModeToggle({ className = "" }) {
  const { user, setMode, modeFlash } = useAuth();
  const [busy, setBusy] = useState(false);
  const mode = activeMode(user);
  const locked = busy || Boolean(modeFlash);

  const switchTo = async (next) => {
    if (!user || next === mode || locked) return;
    setBusy(true);
    try {
      await setMode(next);
      toast.success(next === "poster" ? "Switched to Poster" : "Switched to Tasker");
    } catch (err) {
      toast.error(err?.message || "Could not switch mode");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={`inline-flex rounded-full bg-[#C9D6E0]/55 p-1 ${className}`}
      role="tablist"
      aria-label="Account mode"
    >
      <button
        type="button"
        role="tab"
        aria-selected={mode === "poster"}
        disabled={locked}
        onClick={() => switchTo("poster")}
        className={`rounded-full px-3.5 py-1.5 text-xs font-black transition sm:px-4 ${
          mode === "poster" ? "bg-[#3D5C6E] text-[#F7F4EC] shadow-sm" : "text-[#2A3F4D] hover:bg-white/50"
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
        className={`rounded-full px-3.5 py-1.5 text-xs font-black transition sm:px-4 ${
          mode === "tasker" ? "bg-[#3D5C6E] text-[#F7F4EC] shadow-sm" : "text-[#2A3F4D] hover:bg-white/50"
        }`}
      >
        Tasker
      </button>
    </div>
  );
}
