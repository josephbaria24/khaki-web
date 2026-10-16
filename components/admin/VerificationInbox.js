"use client";

import { useMemo, useState } from "react";
import ApplicationReviewCard from "@/components/admin/ApplicationReviewCard";
import SwipeToDelete from "@/components/admin/SwipeToDelete";

function needsReview(u) {
  return u.verification_status === "pending" || u.tasker_application?.review_state === "reverify";
}

function statusRank(u) {
  if (needsReview(u)) return 0;
  if (u.verification_status === "verified") return 2;
  return 1;
}

function submittedAt(u) {
  const stamp = u.tasker_application?.submitted_at || u.updated_at || u.created_at || "";
  return new Date(stamp || 0).getTime() || 0;
}

export default function VerificationInbox({
  applications,
  teams = [],
  teamFilter,
  setTeamFilter,
  onApprove,
  onReject,
  onDelete,
  onApproveSelected,
  onDeleteSelected,
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("priority");
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState(() => new Set());

  const teamOptions = useMemo(
    () => [["all", "All teams"], ...teams.map((t) => [t.id, t.name]), ["none", "No team"]],
    [teams]
  );

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    let list = applications.filter((u) => {
      if (teamFilter === "none" && u.team) return false;
      if (teamFilter !== "all" && teamFilter !== "none" && u.team?.id !== teamFilter) return false;
      if (statusFilter === "pending" && !needsReview(u)) return false;
      if (statusFilter === "verified" && u.verification_status !== "verified") return false;
      if (statusFilter === "rejected" && !(u.verification_note && u.verification_status !== "verified" && u.verification_status !== "pending")) return false;
      if (statusFilter === "unverified" && (u.verification_status === "verified" || u.verification_status === "pending")) return false;
      if (!needle) return true;
      return `${u.full_name || ""} ${u.email || ""} ${u.team?.name || ""} ${u.location_area || ""}`.toLowerCase().includes(needle);
    });

    list = [...list].sort((a, b) => {
      if (sortBy === "name") return String(a.full_name || "").localeCompare(String(b.full_name || ""));
      if (sortBy === "newest") return submittedAt(b) - submittedAt(a);
      if (sortBy === "oldest") return submittedAt(a) - submittedAt(b);
      const rank = statusRank(a) - statusRank(b);
      if (rank !== 0) return rank;
      return submittedAt(b) - submittedAt(a);
    });
    return list;
  }, [applications, query, statusFilter, sortBy, teamFilter]);

  const pendingCount = applications.filter(needsReview).length;
  const selectedCount = selected.size;
  const selectedPending = rows.filter((u) => selected.has(u.id) && needsReview(u));

  const toggleOne = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllVisible = () => {
    setSelected((prev) => {
      const ids = rows.map((u) => u.id);
      const allOn = ids.length > 0 && ids.every((id) => prev.has(id));
      if (allOn) return new Set();
      return new Set(ids);
    });
  };

  const exitSelect = () => {
    setSelectMode(false);
    setSelected(new Set());
  };

  const statusChips = [
    ["all", "All"],
    ["pending", "Pending"],
    ["verified", "Verified"],
    ["rejected", "Rejected"],
    ["unverified", "Unverified"],
  ];

  return (
    <section className="flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-[1.75rem] border border-[#163044]/10 bg-[#FFFCF7] shadow-[0_12px_36px_rgba(22,48,68,0.1)] dark:border-white/10 dark:bg-[#151922]">
      <header className="shrink-0 border-b border-[#163044]/08 bg-gradient-to-br from-[#163044] to-[#2A4A5C] px-3 py-2.5 text-[#F7F4EC] sm:px-4">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-black leading-tight">Verification</h2>
            <p className="truncate text-[10px] font-semibold text-[#F7F4EC]/60">
              {rows.length} shown · {pendingCount} pending
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
            {selectMode ? (
              <button type="button" onClick={toggleAllVisible} className="h-7 rounded-lg bg-white/12 px-2 text-[10px] font-black text-white">
                {rows.length && rows.every((u) => selected.has(u.id)) ? "Clear" : "All"}
              </button>
            ) : null}
            {selectedPending.length > 1 ? (
              <button
                type="button"
                onClick={() => onApproveSelected?.(selectedPending)}
                className="h-7 rounded-lg bg-[#0D666A] px-2 text-[10px] font-black text-white"
              >
                Approve {selectedPending.length}
              </button>
            ) : null}
            {selectedCount > 0 ? (
              <button
                type="button"
                onClick={() => onDeleteSelected?.(rows.filter((u) => selected.has(u.id)))}
                className="h-7 rounded-lg bg-[#B42318] px-2 text-[10px] font-black text-white"
              >
                Delete {selectedCount}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => (selectMode ? exitSelect() : setSelectMode(true))}
              className={`h-7 rounded-lg px-2.5 text-[10px] font-black ${selectMode ? "bg-[#F6C56B] text-[#7A4A00]" : "bg-white/15 text-white"}`}
            >
              {selectMode ? "Done" : "Select"}
            </button>
          </div>
        </div>

        <div className="mt-2 flex gap-1.5">
          <label className="relative min-w-0 flex-1">
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-[#163044]/35">⌕</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email, town…"
              className="h-8 w-full rounded-lg border-0 bg-[#F7F4EC] pl-7 pr-2 text-xs font-semibold text-[#163044] outline-none placeholder:text-[#163044]/40"
            />
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-8 shrink-0 rounded-lg border-0 bg-[#F7F4EC] px-2 text-[11px] font-bold text-[#163044] outline-none"
            aria-label="Sort"
          >
            <option value="priority">Priority</option>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="name">Name</option>
          </select>
        </div>

        <div className="mt-2 flex gap-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {statusChips.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setStatusFilter(id)}
              className={`h-6 shrink-0 rounded-md px-2 text-[10px] font-black ${
                statusFilter === id ? "bg-[#F6C56B] text-[#7A4A00]" : "bg-white/10 text-[#F7F4EC]/85"
              }`}
            >
              {label}
            </button>
          ))}
          {teamOptions.length > 2 ? (
            <>
              <span className="mx-0.5 self-center text-[10px] text-white/25">|</span>
              {teamOptions.map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTeamFilter(id)}
                  className={`h-6 shrink-0 rounded-md px-2 text-[10px] font-black ${
                    teamFilter === id ? "bg-[#D7F0EA] text-[#0D666A]" : "bg-white/10 text-[#F7F4EC]/75"
                  }`}
                >
                  {label}
                </button>
              ))}
            </>
          ) : null}
        </div>
      </header>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain bg-[#F4F7FB]/80 p-3 sm:p-4 dark:bg-[#11141A]">
        {applications.length === 0 ? (
          <Empty>No verification submissions yet. Forms from /verify appear here.</Empty>
        ) : rows.length === 0 ? (
          <Empty>No applications match this search or filter.</Empty>
        ) : (
          rows.map((u) => (
            <div key={u.id} className="flex items-start gap-2">
              {selectMode ? (
                <button
                  type="button"
                  onClick={() => toggleOne(u.id)}
                  aria-pressed={selected.has(u.id)}
                  className={`mt-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-[11px] font-black ${
                    selected.has(u.id)
                      ? "border-[#163044] bg-[#163044] text-white"
                      : "border-[#163044]/25 bg-white text-transparent"
                  }`}
                >
                  ✓
                </button>
              ) : null}
              <div className="min-w-0 flex-1">
                {u.team ? (
                  <p className="mb-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#0D666A]">
                    Team · <span data-no-translate>{u.team.name}</span>
                  </p>
                ) : null}
                <SwipeToDelete disabled={u.role === "admin" || selectMode} onDelete={() => onDelete?.(u)}>
                  <ApplicationReviewCard
                    user={u}
                    onApprove={() => onApprove?.(u)}
                    onReject={() => onReject?.(u)}
                    onDelete={() => onDelete?.(u)}
                  />
                </SwipeToDelete>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function Empty({ children }) {
  return (
    <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-[#163044]/15 bg-white/70 px-4 text-center text-sm font-semibold text-[#163044]/55 dark:bg-[#1A1E27]/70">
      {children}
    </div>
  );
}
