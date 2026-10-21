"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

/** Resolve CSS `--primary` to a concrete rgb() string for libraries that can't use CSS vars. */
export function readPrimaryColor(el) {
  if (typeof window === "undefined") return "#163044";
  const node = el || document.documentElement;
  const probe = document.createElement("span");
  probe.style.color = "hsl(var(--primary))";
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  probe.style.pointerEvents = "none";
  (node === document.documentElement ? document.body : node)?.appendChild(probe);
  const resolved = getComputedStyle(probe).color;
  probe.remove();
  return resolved && resolved !== "rgba(0, 0, 0, 0)" ? resolved : "#163044";
}

/** Theme-aware primary color for spinners / canvas / etc. */
export function usePrimaryColor() {
  const { resolvedTheme } = useTheme();
  const [color, setColor] = useState("#163044");

  useEffect(() => {
    setColor(readPrimaryColor());
  }, [resolvedTheme]);

  return color;
}
