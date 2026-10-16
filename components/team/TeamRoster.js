"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/store";
import { initials, lastSeenLabel, MEMBER_STATUS_LABEL, vehicleLine, verifyColors, verifyLabel } from "@/lib/teams";
import { toast } from "@/lib/toast";
import { PageSkeleton } from "@/components/ui/Skeleton";

export default function TeamRoster({ teamId, onChange }) {
  const [rows, setRows] = useState([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    try {
      setRows(await api.teams.roster(teamId));
      setError("");
    } catch (err) {
      setError(err.message || "Could not load the roster.");
    } finally {
      setReady(true);
    }
  }, [teamId]);

  useEffect(() => {
    load();
  }, [load]);

  const waiting = rows.filter((row) => row.status === "waiting");
  const members = rows.filter((row) => row.status !== "waiting");
  const verified = members.filter((row) => row.verification_status === "verified").length;
  const needle = query.trim().toLowerCase();
  const shown = members.filter((row) => !needle
    || `${row.full_name || ""} ${row.plate_number || ""} ${row.phone || ""}`.toLowerCase().includes(needle));

  const decide = async (row, decision) => {
    if (decision === "decline" && !window.confirm("Decline this rider's request?")) return;
    if (decision === "remove" && !window.confirm("Remove this rider from the team? They will be notified.")) return;
    setBusy(row.member_id);
    try {
      await api.teams.decide(row.member_id, decision);
      toast.success(decision === "approve" ? "Rider approved" : decision === "decline" ? "Request declined" : "Rider removed");
      await load();
      onChange?.();
    } catch (err) {
      toast.error(err.message || "Could not save.");
    } finally {
      setBusy("");
    }
  };

  const approveAll = async () => {
    if (!window.confirm("Approve every rider waiting for this team?")) return;
    setBusy("all");
    let done = 0;
    for (const row of waiting) {
      try {
        await api.teams.decide(row.member_id, "approve");
        done += 1;
      } catch {
        // Keep going; whatever failed stays in the waiting list.
      }
    }
    toast.success(done === waiting.length ? "All riders approved" : "Some riders could not be approved");
    setBusy("");
    await load();
    onChange?.();
  };

  if (!ready) return <PageSkeleton rows={3} />;
  if (error) return <p className="rounded-xl bg-[#C94B78]/10 p-3 text-sm font-semibold text-[#C94B78]">{error}</p>;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Waiting" value={waiting.length} />
        <Stat label="Active riders" value={members.filter((row) => row.status === "active").length} />
        <Stat label="Verified" value={verified} />
        <Stat label="Not verified" value={members.length - verified} />
      </div>

      {waiting.length ? (
        <section className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-black text-[#163044] dark:text-[#F5F3EE]">Waiting for approval</h3>
            {waiting.length > 1 ? (
              <button
                type="button"
                onClick={approveAll}
                disabled={Boolean(busy)}
                className="h-9 rounded-xl bg-[#0D666A] px-3 text-xs font-black text-white disabled:opacity-50"
              >
                Approve all
              </button>
            ) : null}
          </div>
          {waiting.map((row) => (
            <RiderRow key={row.member_id} row={row}>
              <button type="button" disabled={Boolean(busy)} onClick={() => decide(row, "approve")} className="h-9 rounded-xl bg-[#163044] px-3 text-xs font-black text-white disabled:opacity-50">
                Approve
              </button>
              <button type="button" disabled={Boolean(busy)} onClick={() => decide(row, "decline")} className="h-9 rounded-xl border border-[#163044]/15 px-3 text-xs font-black text-[#163044] disabled:opacity-50 dark:border-white/15 dark:text-[#F5F3EE]">
                Decline
              </button>
            </RiderRow>
          ))}
        </section>
      ) : null}

      <section className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-black text-[#163044] dark:text-[#F5F3EE]">Riders</h3>
          {members.length > 6 ? (
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, plate, or phone"
              className="h-9 w-full rounded-xl border border-[#E6DDD0] bg-white px-3 text-sm font-semibold text-[#163044] outline-none sm:w-64 dark:border-[#252A35] dark:bg-[#11141A] dark:text-[#F5F3EE]"
            />
          ) : null}
        </div>
        {!members.length ? (
          <p className="rounded-2xl border border-dashed border-[#E6DDD0] p-4 text-sm text-[#163044]/60 dark:border-[#252A35] dark:text-[#F5F3EE]/60">
            No riders yet. Share the invite code so riders can join.
          </p>
        ) : null}
        {members.length > 0 && !shown.length ? <p className="text-sm text-[#163044]/60 dark:text-[#F5F3EE]/60">No riders match.</p> : null}
        {shown.map((row) => (
          <RiderRow key={row.member_id} row={row} showStatus>
            <button type="button" disabled={Boolean(busy)} onClick={() => decide(row, "remove")} className="h-9 rounded-xl border border-[#C94B78]/30 px-3 text-xs font-black text-[#C94B78] disabled:opacity-50">
              Remove
            </button>
          </RiderRow>
        ))}
      </section>
    </div>
  );
}

function RiderRow({ row, showStatus = false, children }) {
  const tone = verifyColors(row.verification_status);
  return (
    <div className="flex flex-col gap-3 rounded-[1.25rem] bg-white p-3 shadow-[0_6px_20px_rgba(22,48,68,0.06)] sm:flex-row sm:items-center dark:bg-[#1A1E27]">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {row.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={row.avatar_url} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
        ) : (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E8DCC4] text-xs font-black text-[#163044]">{initials(row.full_name)}</span>
        )}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="truncate font-black text-[#163044] dark:text-[#F5F3EE]">{row.full_name || "Rider"}</p>
            <span className="rounded-full px-2 py-0.5 text-[10px] font-black" style={{ background: tone.bg, color: tone.fg }}>{verifyLabel(row.verification_status)}</span>
            {showStatus && row.status !== "active" ? (
              <span className="rounded-full bg-[#F3EFE3] px-2 py-0.5 text-[10px] font-black text-[#163044]">{MEMBER_STATUS_LABEL[row.status] || row.status}</span>
            ) : null}
          </div>
          <p className="truncate text-xs font-semibold text-[#163044]/70 dark:text-[#F5F3EE]/70">{vehicleLine(row)}</p>
          <p className="truncate text-xs text-[#163044]/55 dark:text-[#F5F3EE]/55">
            {row.phone ? <a href={`tel:${row.phone}`} className="font-semibold underline">{row.phone}</a> : null}
            {row.phone ? " · " : null}
            {lastSeenLabel(row)}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 gap-2">{children}</div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-[1.25rem] bg-white p-3 shadow-[0_6px_20px_rgba(22,48,68,0.06)] dark:bg-[#1A1E27]">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#163044]/55 dark:text-[#F5F3EE]/55">{label}</p>
      <p className="text-2xl font-black tabular-nums text-[#163044] dark:text-[#F5F3EE]">{value}</p>
    </div>
  );
}
