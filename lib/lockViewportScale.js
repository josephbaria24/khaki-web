"use client";

import { isStandaloneApp } from "@/lib/installApp";

/**
 * In installed Safari/Chrome PWAs, block iOS page-zoom gestures so navigation
 * stays at 1×. Does not touch single-finger scroll or in-map gestures.
 */
function blockGesture(event) {
  event.preventDefault();
}

if (typeof window !== "undefined") {
  const attach = () => {
    if (!isStandaloneApp()) return;
    document.addEventListener("gesturestart", blockGesture, { passive: false });
    document.addEventListener("gesturechange", blockGesture, { passive: false });
    document.addEventListener("gestureend", blockGesture, { passive: false });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", attach, { once: true });
  } else {
    attach();
  }
}
