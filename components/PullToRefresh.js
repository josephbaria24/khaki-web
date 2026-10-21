"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HashLoader } from "react-spinners";
import { usePrimaryColor } from "@/lib/primaryColor";

const THRESHOLD = 68;
const MAX_PULL = 112;

/**
 * Swipe-down-to-refresh for a scrollable container (or the window).
 * Shows HashLoader while pulling / refreshing.
 */
export default function PullToRefresh({
  children,
  onRefresh,
  disabled = false,
  className = "",
  /** When true, track document/window scroll instead of this element */
  windowScroll = false,
}) {
  const primary = usePrimaryColor();
  const scrollerRef = useRef(null);
  const startY = useRef(0);
  const pulling = useRef(false);
  const pullRef = useRef(0);
  const refreshingRef = useRef(false);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const setPullBoth = (value) => {
    pullRef.current = value;
    setPull(value);
  };

  const scrollTop = useCallback(() => {
    if (windowScroll) {
      return window.scrollY || document.documentElement.scrollTop || 0;
    }
    return scrollerRef.current?.scrollTop || 0;
  }, [windowScroll]);

  useEffect(() => {
    if (disabled) return undefined;

    const onStart = (e) => {
      if (refreshingRef.current) return;
      if (scrollTop() > 0) return;
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    };

    const onMove = (e) => {
      if (!pulling.current || refreshingRef.current) return;
      if (scrollTop() > 0) {
        pulling.current = false;
        setPullBoth(0);
        return;
      }
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0) {
        setPullBoth(0);
        return;
      }
      const next = Math.min(MAX_PULL, dy * 0.42);
      setPullBoth(next);
      if (next > 8 && e.cancelable) e.preventDefault();
    };

    const onEnd = async () => {
      if (!pulling.current) return;
      pulling.current = false;
      const distance = pullRef.current;
      if (distance >= THRESHOLD && typeof onRefresh === "function" && !refreshingRef.current) {
        refreshingRef.current = true;
        setRefreshing(true);
        setPullBoth(Math.max(distance, 56));
        try {
          await onRefresh();
        } finally {
          refreshingRef.current = false;
          setRefreshing(false);
          setPullBoth(0);
        }
        return;
      }
      setPullBoth(0);
    };

    const target = windowScroll ? document : scrollerRef.current;
    if (!target) return undefined;

    target.addEventListener("touchstart", onStart, { passive: true });
    target.addEventListener("touchmove", onMove, { passive: false });
    target.addEventListener("touchend", onEnd, { passive: true });
    target.addEventListener("touchcancel", onEnd, { passive: true });

    return () => {
      target.removeEventListener("touchstart", onStart);
      target.removeEventListener("touchmove", onMove);
      target.removeEventListener("touchend", onEnd);
      target.removeEventListener("touchcancel", onEnd);
    };
  }, [disabled, windowScroll, scrollTop, onRefresh]);

  const indicatorHeight = refreshing ? 64 : pull;
  const showLoader = refreshing || pull > 10;

  const indicator = (
    <div
      aria-hidden
      className="pointer-events-none flex items-center justify-center overflow-hidden"
      style={{
        height: windowScroll ? undefined : indicatorHeight,
        opacity: showLoader ? Math.min(1, (refreshing ? 1 : pull) / THRESHOLD) : 0,
        transition: refreshing || pull === 0 ? "height 160ms ease, opacity 160ms ease" : undefined,
      }}
    >
      {showLoader ? <HashLoader color={primary} size={28} /> : null}
    </div>
  );

  if (windowScroll) {
    return (
      <>
        {showLoader ? (
          <div className="pointer-events-none fixed left-0 right-0 top-3 z-[60] flex justify-center">
            <HashLoader color={primary} size={28} />
          </div>
        ) : null}
        {children}
      </>
    );
  }

  return (
    <div ref={scrollerRef} className={className}>
      {indicator}
      {children}
    </div>
  );
}
