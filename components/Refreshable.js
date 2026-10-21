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

  return (
    <PullToRefresh className={cn(className)} onRefresh={handleRefresh} disabled={disabled}>
      <div key={refreshKey} className="min-h-0">
        {children}
      </div>
    </PullToRefresh>
  );
}
