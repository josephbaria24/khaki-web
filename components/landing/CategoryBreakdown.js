"use client";

import { useState } from "react";
import Link from "next/link";
import { LANDING_CATEGORIES } from "@/lib/landingContent";

export default function CategoryBreakdown({ categories = LANDING_CATEGORIES }) {
  const list = categories.length ? categories : LANDING_CATEGORIES;
  const [activeKey, setActiveKey] = useState(list[0]?.key ?? null);
  const active = list.find((cat) => cat.key === activeKey) || list[0];
  const index = Math.max(0, list.findIndex((cat) => cat.key === active?.key));

  if (!active) return null;

  return (
    <div className="mt-6">
      <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-px-6 px-6 pb-1 sm:mx-0 sm:scroll-px-0 sm:px-0">
        {list.map((cat) => {
          const selected = cat.key === active.key;
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => setActiveKey(cat.key)}
              aria-pressed={selected}
              className={`inline-flex h-11 shrink-0 snap-start items-center gap-2 rounded-full pl-1.5 pr-3.5 text-left transition duration-200 ${
                selected
                  ? "bg-[#163044] text-[#F7F4EC] shadow-[0_8px_20px_rgba(22,48,68,0.18)] dark:bg-[#F5F3EE] dark:text-[#11141A]"
                  : "bg-white text-[#163044] ring-1 ring-[#E7E2D8] hover:bg-[#F7F8FA] dark:bg-[#1A1E27] dark:text-[#F5F3EE] dark:ring-[#2A303C]"
              }`}
            >
              {cat.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cat.image} alt="" className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <span className={`h-8 w-8 rounded-full ${selected ? "bg-white/15" : "bg-[#F3EFE3]"}`} />
              )}
              <span className="max-w-[9.5rem] truncate text-[13px] font-black">{cat.title}</span>
            </button>
          );
        })}
      </div>

      <article
        key={active.key}
        className="animate-fade-in-up mt-4 rounded-[1.35rem] bg-white p-4 ring-1 ring-[#E7E2D8] dark:bg-[#1A1E27] dark:ring-[#2A303C] sm:p-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8A8478] dark:text-[#94A3B8]">
              {String(index + 1).padStart(2, "0")}
            </p>
            <h3 className="mt-1 text-lg font-black tracking-tight text-[#163044] dark:text-[#F5F3EE]">{active.title}</h3>
            <p className="mt-1 text-sm leading-snug text-[#6B6558] dark:text-[#94A3B8]">{active.desc}</p>
          </div>
        </div>

        <ul className="mt-4 grid gap-2 sm:grid-cols-3">
          {(active.groups || []).map((group) => (
            <li key={group.title} className="rounded-2xl bg-[#F7F8FA] px-3 py-3 dark:bg-[#151922]">
              <p className="text-[13px] font-black leading-snug text-[#163044] dark:text-[#F5F3EE]">{group.title}</p>
              <p className="mt-1 text-[12px] leading-snug text-[#6B6558] dark:text-[#94A3B8]">{group.desc}</p>
            </li>
          ))}
        </ul>

        <Link
          href={active.href || "/browse"}
          className="mt-4 inline-flex h-10 items-center rounded-full bg-[#163044] px-4 text-xs font-black text-[#F7F4EC] dark:bg-[#F5F3EE] dark:text-[#11141A]"
        >
          {active.key === "other" ? `Post ${active.title}` : `Browse ${active.title}`}
        </Link>
      </article>
    </div>
  );
}
