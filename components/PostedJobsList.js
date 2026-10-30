"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import PostedJobCard from "@/components/PostedJobCard";
import { cn, displayTaskCategory, formatPHP, STATUS_CONFIG, timeAgo } from "@/lib/khaki";

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

const STATUS_ROW = {
  open: {
    wash: "bg-status-open/10 hover:bg-status-open/15 dark:bg-status-open/15 dark:hover:bg-status-open/25",
    ink: "text-status-open",
    bar: "bg-status-open",
  },
  offer_accepted: {
    wash: "bg-emerald-50 hover:bg-emerald-100/80 dark:bg-emerald-500/15 dark:hover:bg-emerald-500/25",
    ink: "text-emerald-700 dark:text-emerald-300",
    bar: "bg-emerald-500",
  },
  escrow_locked: {
    wash: "bg-blue-50 hover:bg-blue-100/80 dark:bg-blue-500/15 dark:hover:bg-blue-500/25",
    ink: "text-blue-700 dark:text-blue-300",
    bar: "bg-blue-600",
  },
  in_progress: {
    wash: "bg-status-progress/20 hover:bg-status-progress/30 dark:bg-status-progress/15 dark:hover:bg-status-progress/25",
    ink: "text-[#8A6A00] dark:text-status-progress",
    bar: "bg-status-progress",
  },
  completed_pending_review: {
    wash: "bg-purple-50 hover:bg-purple-100/80 dark:bg-purple-500/15 dark:hover:bg-purple-500/25",
    ink: "text-purple-700 dark:text-purple-300",
    bar: "bg-purple-500",
  },
  disputed: {
    wash: "bg-amber-50 hover:bg-amber-100/80 dark:bg-amber-500/15 dark:hover:bg-amber-500/25",
    ink: "text-amber-700 dark:text-amber-300",
    bar: "bg-amber-500",
  },
  released: {
    wash: "bg-status-done/10 hover:bg-status-done/15 dark:bg-status-done/20 dark:hover:bg-status-done/30",
    ink: "text-status-done",
    bar: "bg-status-done",
  },
  cancelled: {
    wash: "bg-destructive/10 hover:bg-destructive/15 dark:bg-destructive/15 dark:hover:bg-destructive/25",
    ink: "text-destructive",
    bar: "bg-destructive",
  },
};

function statusRow(status) {
  return STATUS_ROW[status] || STATUS_ROW.open;
}

function previewTail(task, tasker, bids) {
  const hired = tasker || (task.accepted_tasker_id ? { full_name: "Tasker" } : null);
  const who = hired
    ? `Kumuha: ${hired.full_name}`
    : task.status === "cancelled"
      ? "Cancelled"
      : "Waiting pa";
  const bidLabel = bids > 0 ? `${bids} ${bids === 1 ? "bid" : "bids"}` : "Walang bid pa";
  return `${displayTaskCategory(task)} · ${timeAgo(task.created_at)} · ${bidLabel} · ${who}`;
}

export default function PostedJobsList({
  tasks = [],
  people = {},
  reviews = {},
  bidCounts = {},
  onCancel,
  preview = false,
  showAllHref = "/my-jobs",
}) {
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

  const newest = useMemo(
    () => [...tasks].sort((a, b) => timeOf(b) - timeOf(a)),
    [tasks]
  );

  if (tasks.length === 0) {
    return (
      <p className="mt-6 rounded-[1.35rem] border border-dashed border-[#C9D6E0] bg-card py-12 text-center text-sm text-muted-foreground">
        Wala ka pang naka-post. Mag-post ng gawain para maghanap ng tulong.
      </p>
    );
  }

  if (preview) {
    return (
      <div className="mt-4 overflow-hidden rounded-[1.35rem] bg-white ring-1 ring-[#EEF1F4] dark:bg-[#1A1E27] dark:ring-white/10">
        <div className="h-72 overflow-y-auto overscroll-contain">
          {newest.map((task) => {
            const row = statusRow(task.status);
            const bids = Number(bidCounts[task.id] ?? task.offer_count) || 0;
            const status = STATUS_CONFIG[task.status]?.label || task.status || "Open";
            return (
              <Link
                key={task.id}
                href={`/task/${task.id}`}
                className={cn(
                  "flex items-center gap-3 border-b border-[#F0F3F6] px-3.5 py-3 last:border-b-0 dark:border-white/10",
                  row.wash
                )}
              >
                <span className={cn("h-9 w-1 shrink-0 rounded-full", row.bar)} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-sm font-bold text-foreground">{task.title}</span>
                    <span className={cn("shrink-0 text-sm font-black", row.ink)}>{formatPHP(task.budget_php)}</span>
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] font-medium text-muted-foreground">
                    <span className={cn("font-bold", row.ink)}>{status}</span>
                    {" · "}
                    {previewTail(task, people[task.accepted_tasker_id], bids)}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
        <Link
          href={showAllHref}
          className="flex h-11 items-center justify-center border-t border-[#EEF1F4] text-sm font-bold text-[#163044] hover:bg-[#F4F7FA] dark:border-white/10 dark:text-[#F7F4EC] dark:hover:bg-white/5"
        >
          Show all
        </Link>
      </div>
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
