"use client";

import { useCallback, useState } from "react";
import PullToRefresh from "@/components/PullToRefresh";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/store";
import { cn } from "@/lib/khaki";

/**
 * Scroll container with swipe-down refresh (for fill pages that scroll internally).
 */
export default function Refreshable({ children, className, onRefresh, disabled = false }) {
  const { refresh: refreshAuth } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = useCallback(async () => {
    api.clearCaches();
    await Promise.allSettled([refreshAuth?.() ?? Promise.resolve(), Promise.resolve(onRefresh?.())]);
    setRefreshKey((k) => k + 1);
    await new Promise((r) => setTimeout(r, 350));
  }, [onRefresh, refreshAuth]);

  const parts = String(className || "").split(/\s+/).filter(Boolean);
  const contentSpace = parts.filter((token) => token.startsWith("space-y-") || token.startsWith("space-x-")).join(" ");
  const scrollerClass = parts.filter((token) => !token.startsWith("space-y-") && !token.startsWith("space-x-")).join(" ");

  return (
    <PullToRefresh className={scrollerClass} onRefresh={handleRefresh} disabled={disabled}>
      <div key={refreshKey} className={cn("min-h-0", contentSpace)}>
        {children}
      </div>
    </PullToRefresh>
  );
}
