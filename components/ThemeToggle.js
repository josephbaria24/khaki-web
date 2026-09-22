"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/khaki";

const OPTIONS = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export default function ThemeToggle({ className }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className={cn("flex h-11 rounded-full bg-muted p-1", className)} aria-hidden>
        <div className="flex-1" />
        <div className="flex-1" />
        <div className="flex-1" />
      </div>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label="Appearance"
      className={cn("flex rounded-full bg-muted p-1", className)}
    >
      {OPTIONS.map((option) => {
        const active = theme === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(option.value)}
            className={cn(
              "flex-1 rounded-full px-3 py-2 text-xs font-bold transition",
              active
                ? "bg-card text-foreground shadow-card"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
