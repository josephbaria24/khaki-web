"use client";

import { useState } from "react";
import Link from "next/link";
import { LANDING, LANDING_CATEGORIES } from "@/lib/landingContent";
import { Collapse } from "@/components/ui/motion";

export default function CategoryBreakdown() {
  const [openKey, setOpenKey] = useState(null);

  return (
    <div className="mt-10 grid gap-2 sm:grid-cols-2 sm:gap-3">
      {LANDING_CATEGORIES.map((cat, i) => {
        const open = openKey === cat.key;
        return (
          <article
            key={cat.key}
            className="overflow-hidden rounded-2xl bg-[#FFFCF7] shadow-[0_8px_28px_rgba(42,63,77,0.08)]"
          >
            <button
              type="button"
              onClick={() => setOpenKey(open ? null : cat.key)}
              aria-expanded={open}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
            >
              <span className="w-7 shrink-0 text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: LANDING.olive }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1 truncate text-[15px] font-black text-foreground">{cat.title}</span>
              <span
                className={`shrink-0 text-muted-foreground transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? "rotate-180" : "rotate-0"}`}
                aria-hidden
              >
                ▾
              </span>
            </button>
            <Collapse open={open}>
              <div className="px-4 pb-4">
                <p className="text-sm text-muted-foreground">{cat.desc}</p>
                <ul className="mt-3 space-y-2.5">
                  {cat.groups.map((group) => (
                    <li key={group.title}>
                      <p className="text-sm font-bold text-foreground">{group.title}</p>
                      <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">{group.desc}</p>
                    </li>
                  ))}
                </ul>
                <Link
                  href={cat.href || "/browse"}
                  className="mt-3 inline-flex text-sm font-bold underline-offset-4 hover:underline"
                  style={{ color: LANDING.olive }}
                >
                  {cat.key === "other" ? `Post ${cat.title}` : `Browse ${cat.title}`}
                </Link>
              </div>
            </Collapse>
          </article>
        );
      })}
    </div>
  );
}
