"use client";

import { useMemo, useState } from "react";
import PostedJobCard from "@/components/PostedJobCard";
import { cn, displayTaskCategory } from "@/lib/khaki";

const TABS = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "ongoing", label: "Ongoing" },
  { id: "done", label: "Done" },
  { id: "cancelled", label: "Cancelled" },
];

const SORTS = [
  { id: "newest", label: "Newest" },
  { id: "oldest", label: "Oldest" },
  { id: "budget_desc", label: "Budget high" },
  { id: "budget_asc", label: "Budget low" },
  { id: "bids", label: "Most bids" },
];

const EMPTY = {
  all: "Walang gawain.",
  open: "Walang open na gawain dito.",
  ongoing: "Walang ongoing na gawain.",
  done: "Wala pang tapos na gawain.",
  cancelled: "Walang cancelled na gawain.",
};

export function postedJobTab(status) {
  if (status === "cancelled") return "cancelled";
  if (status === "released") return "done";
  if (status === "open" || status === "offer_accepted") return "open";
  return "ongoing";
}

function timeOf(task) {
  const raw = task.created_at || task.updated_at || 0;
  const n = new Date(raw).getTime();
  return Number.isFinite(n) ? n : 0;
}

export default function PostedJobsList({ tasks = [], people = {}, reviews = {}, bidCounts = {}, onCancel }) {
  const [tab, setTab] = useState("all");
  const [sort, setSort] = useState("newest");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const categories = useMemo(() => {
    const set = new Set();
    tasks.forEach((task) => {
      const label = displayTaskCategory(task);
      if (label) set.add(label);
    });
    return ["All", ...set];
  }, [tasks]);

  const counts = useMemo(() => {
    const next = { all: tasks.length, open: 0, ongoing: 0, done: 0, cancelled: 0 };
    tasks.forEach((task) => {
      next[postedJobTab(task.status)] += 1;
    });
    return next;
  }, [tasks]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = tasks.filter((task) => {
      if (tab !== "all" && postedJobTab(task.status) !== tab) return false;
      if (category !== "All" && displayTaskCategory(task) !== category) return false;
      if (q && !`${task.title} ${task.details || ""} ${displayTaskCategory(task)}`.toLowerCase().includes(q)) return false;
      return true;
    });
    rows.sort((a, b) => {
      const bidsA = Number(bidCounts[a.id] ?? a.offer_count) || 0;
      const bidsB = Number(bidCounts[b.id] ?? b.offer_count) || 0;
      if (sort === "oldest") return timeOf(a) - timeOf(b);
      if (sort === "budget_desc") return Number(b.budget_php || 0) - Number(a.budget_php || 0);
      if (sort === "budget_asc") return Number(a.budget_php || 0) - Number(b.budget_php || 0);
      if (sort === "bids") return bidsB - bidsA || timeOf(b) - timeOf(a);
      return timeOf(b) - timeOf(a);
    });
    return rows;
  }, [tasks, tab, sort, query, category, bidCounts]);

  if (tasks.length === 0) {
    return (
      <p className="mt-6 rounded-[1.35rem] border border-dashed border-[#C9D6E0] bg-card py-12 text-center text-sm text-muted-foreground">
        Wala ka pang naka-post. Mag-post ng gawain para maghanap ng tulong.
      </p>
    );
  }

  return (
    <div className="mt-4">
      <div className="grid grid-cols-5 gap-1 sm:gap-2">
        {TABS.map((item) => {
          const on = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                "flex min-w-0 items-center justify-center gap-1 rounded-full px-1 py-1.5 text-[10px] font-bold leading-none transition sm:gap-1.5 sm:px-3 sm:py-2 sm:text-xs",
                on ? "bg-[#3D5C6E] text-[#F7F4EC]" : "bg-white text-[#2A3F4D] shadow-sm"
              )}
            >
              <span className="truncate">{item.label}</span>
              <span className={cn("shrink-0 text-[9px] sm:text-[10px]", on ? "text-white/80" : "text-[#2A3F4D]/55")}>
                {counts[item.id]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 space-y-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by title..."
          className="h-11 w-full rounded-full bg-white px-4 text-sm text-[#2A3F4D] shadow-sm outline-none placeholder:text-[#2A3F4D]/40"
        />
        <div className="grid grid-cols-2 gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-11 min-w-0 rounded-full bg-white px-3 text-sm font-semibold text-[#2A3F4D] shadow-sm"
            aria-label="Filter category"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c === "All" ? "All categories" : c}</option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-11 min-w-0 rounded-full bg-white px-3 text-sm font-semibold text-[#2A3F4D] shadow-sm"
            aria-label="Sort jobs"
          >
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {visible.map((task) => (
          <PostedJobCard
            key={task.id}
            task={task}
            tasker={people[task.accepted_tasker_id]}
            review={reviews[task.id]}
            bidCount={bidCounts[task.id]}
            onCancel={onCancel}
          />
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="mt-4 rounded-[1.35rem] border border-dashed border-[#C9D6E0] bg-white/70 py-10 text-center text-sm text-muted-foreground">
          {query || category !== "All" ? "Walang tumugma sa filter." : EMPTY[tab]}
        </p>
      ) : null}

      <p className="mt-3 text-[11px] font-semibold text-[#163044]">
        {visible.length} shown
      </p>
    </div>
  );
}
