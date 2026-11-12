"use client";

import { useLayoutEffect, useState } from "react";
import { usePathname } from "next/navigation";

const SHEET_KEY = "khaki.sheet";

export function markSheet(href) {
  try {
    sessionStorage.setItem(SHEET_KEY, href);
  } catch {
    /* ignore */
  }
}

function matchesSheet(pathname, target) {
  return pathname === target || pathname.startsWith(`${target}/`);
}

export function leaveSheet() {
  return new Promise((resolve) => {
    const node = document.querySelector(".sheet-page");
    if (!node || node.classList.contains("is-leaving")) {
      resolve();
      return;
    }
    let settled = false;
    const finish = (event) => {
      if (event && event.target !== node) return;
      if (settled) return;
      settled = true;
      node.removeEventListener("animationend", finish);
      resolve();
    };
    node.addEventListener("animationend", finish);
    node.classList.add("is-leaving");
    window.setTimeout(() => finish(), 420);
  });
}

export function PageEnter({ children, className = "" }) {
  const pathname = usePathname();
  const [sheet, setSheet] = useState(false);

  useLayoutEffect(() => {
    try {
      const target = sessionStorage.getItem(SHEET_KEY);
      if (target && matchesSheet(pathname, target)) {
        sessionStorage.removeItem(SHEET_KEY);
        setSheet(true);
        return;
      }
    } catch {
      /* ignore */
    }
    setSheet(false);
  }, [pathname]);

  return (
    <div className={`${sheet ? "sheet-page" : "animate-page-enter"} min-w-0 max-w-full ${className}`.trim()}>
      {children}
    </div>
  );
}

export function FadeIn({ children, className = "", delay = 0 }) {
  return (
    <div className={`animate-fade-in-up ${className}`.trim()} style={delay ? { animationDelay: `${delay}ms` } : undefined}>
      {children}
    </div>
  );
}

export function Stagger({ children, className = "" }) {
  return <div className={`stagger-children ${className}`.trim()}>{children}</div>;
}

export function Collapse({ open, children, className = "" }) {
  return (
    <div className={`profile-collapse ${open ? "is-open" : ""} ${className}`.trim()} aria-hidden={!open}>
      <div className="profile-collapse-inner">
        <div>{children}</div>
      </div>
    </div>
  );
}
