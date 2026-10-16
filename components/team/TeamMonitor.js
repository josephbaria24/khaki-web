"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/store";
import {
  initials,
  jobsTodayLabel,
  lastSeenLabel,
  pauseEndsLabel,
  presenceColors,
  PRESENCE_LABEL,
  ratingLabel,
  vehicleLine,
  verifyColors,
  verifyLabel,
} from "@/lib/teams";
import { toast } from "@/lib/toast";

const EMPTY_SUMMARY = {
  waiting: 0, online: 0, busy: 0, inactive: 0, paused: 0, offline: 0,
  jobs_today: 0, inactive_warnings: 0, offline_warnings: 0,
};

export default function TeamMonitor({ teamId, onChange }) {
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [riders, setRiders] = useState([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState("");
  const [messageFor, setMessageFor] = useState(null);
  const [messageText, setMessageText] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await api.teams.monitor(teamId);
      setSummary({ ...EMPTY_SUMMARY, ...(data.summary || {}) });
      setRiders(data.riders || []);
      setError("");
    } catch (err) {
      setError(err.message || "Could not load the team monitor.");
    } finally {
      setReady(true);
    }
  }, [teamId]);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 30 * 1000);
    return () => window.clearInterval(timer);
  }, [load]);

  const waiting = riders.filter((row) => row.presence === "waiting");
  const active = riders.filter((row) => row.presence !== "waiting");
  const needle = query.trim().toLowerCase();
  const shown = active.filter((row) => !needle
    || `${row.full_name || ""} ${row.plate_number || ""} ${row.phone || ""}`.toLowerCase().includes(needle));

  const run = async (id, fn, successMessage) => {
    setBusyId(id);
    try {
      await fn();
      if (successMessage) toast.success(successMessage);
      await load();
      onChange?.();
    } catch (err) {
      toast.error(err.message || "Could not save.");
    } finally {
      setBusyId("");
    }
  };

  const decide = (row, decision) => {
    if (decision === "decline" && !window.confirm("Decline this rider's request?")) return;
    if (decision === "remove" && !window.confirm("Remove this rider from the team? They will be notified.")) return;
    run(
      row.member_id,
      () => api.teams.decide(row.member_id, decision),
      decision === "approve" ? "Rider approved" : decision === "decline" ? "Request declined" : "Rider removed"
    );
  };

  const pause = (row) => {
    if (!window.confirm("Pause this rider for 30 minutes? They will not get team job assignments until it ends.")) return;
    run(row.member_id, () => api.teams.pause(row.member_id, 30), "Rider paused for 30 minutes");
  };

  const unpause = (row) => {
    run(row.member_id, () => api.teams.unpause(row.member_id), "Rider is active again");
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!messageFor) return;
    setBusyId(messageFor.tasker_id);
    try {
      await api.teams.message(messageFor.tasker_id, messageText);
      toast.success("Message sent");
      setMessageFor(null);
      setMessageText("");
    } catch (err) {
      toast.error(err.message || "Could not send the message.");
    } finally {
      setBusyId("");
    }
  };

  if (!ready) return <PageSkeleton rows={4} />;
  if (error) return <p className="rounded-xl bg-[#C94B78]/10 p-3 text-sm font-semibold text-[#C94B78]">{error}</p>;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Online" value={Number(summary.online || 0)} />
        <Stat label="Busy" value={Number(summary.busy || 0)} />
        <Stat label="Offline" value={Number(summary.offline || 0)} />
        <Stat label="Inactive" value={Number(summary.inactive || 0)} />
        <Stat label="Paused" value={Number(summary.paused || 0)} />
        <Stat label="Jobs today" value={Number(summary.jobs_today || 0)} />
      </div>

      {(Number(summary.inactive_warnings) > 0 || Number(summary.offline_warnings) > 0) ? (
        <div className="space-y-2">
          {Number(summary.inactive_warnings) > 0 ? (
            <p className="rounded-xl bg-[#FFF0C4] px-3 py-2 text-sm font-semibold text-[#8A6410]">
              {`${Number(summary.inactive_warnings)} rider${Number(summary.inactive_warnings) === 1 ? "" : "s"} online but quiet for 30+ minutes.`}
            </p>
          ) : null}
          {Number(summary.offline_warnings) > 0 ? (
            <p className="rounded-xl bg-[#EEF2F6] px-3 py-2 text-sm font-semibold text-[#3D4A5C]">
              {`${Number(summary.offline_warnings)} rider${Number(summary.offline_warnings) === 1 ? "" : "s"} with no activity for 1+ day.`}
            </p>
          ) : null}
        </div>
      ) : null}

      {waiting.length ? (
        <section className="space-y-2">
          <h3 className="text-base font-black text-[#163044] dark:text-[#F5F3EE]">Waiting for approval</h3>
          {waiting.map((row) => (
            <RiderCard key={row.member_id} row={row}>
              <Action disabled={Boolean(busyId)} onClick={() => decide(row, "approve")} tone="primary">Approve</Action>
              <Action disabled={Boolean(busyId)} onClick={() => decide(row, "decline")}>Decline</Action>
            </RiderCard>
          ))}
        </section>
      ) : null}

      <section className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-black text-[#163044] dark:text-[#F5F3EE]">Team monitor</h3>
          {active.length > 6 ? (
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, plate, or phone"
              className="h-9 w-full rounded-xl border border-[#E6DDD0] bg-white px-3 text-sm font-semibold text-[#163044] outline-none sm:w-64 dark:border-[#252A35] dark:bg-[#11141A] dark:text-[#F5F3EE]"
            />
          ) : null}
        </div>
        {!active.length ? (
          <p className="rounded-2xl border border-dashed border-[#E6DDD0] p-4 text-sm text-[#163044]/60 dark:border-[#252A35] dark:text-[#F5F3EE]/60">
            No riders yet. Share the invite code so riders can join.
          </p>
        ) : null}
        {active.length > 0 && !shown.length ? <p className="text-sm text-[#163044]/60">No riders match.</p> : null}
        {shown.map((row) => {
          const paused = row.presence === "paused";
          return (
            <RiderCard key={row.member_id} row={row} monitor>
              <Action disabled={Boolean(busyId)} onClick={() => { setMessageFor(row); setMessageText(""); }}>Message</Action>
              {row.phone ? (
                <a href={`tel:${row.phone}`} className="inline-flex h-9 items-center rounded-xl border border-[#163044]/15 px-3 text-xs font-black text-[#163044] dark:border-white/15 dark:text-[#F5F3EE]">
                  Call
                </a>
              ) : null}
              {row.shared_task_id ? (
                <Link href={`/task/${row.shared_task_id}/chat`} className="inline-flex h-9 items-center rounded-xl border border-[#163044]/15 px-3 text-xs font-black text-[#163044] dark:border-white/15 dark:text-[#F5F3EE]">
                  Chat
                </Link>
              ) : null}
              {paused ? (
                <Action disabled={Boolean(busyId)} onClick={() => unpause(row)} tone="teal">Unpause</Action>
              ) : (
                <Action disabled={Boolean(busyId)} onClick={() => pause(row)} tone="warn">Pause 30 min</Action>
              )}
              <Action disabled={Boolean(busyId)} onClick={() => decide(row, "remove")} tone="danger">Remove</Action>
            </RiderCard>
          );
        })}
      </section>

      {messageFor ? (
        <form onSubmit={sendMessage} className="rounded-[1.35rem] bg-[#163044] p-4 text-white">
          <p className="text-sm font-black">Message {messageFor.full_name}</p>
          <p className="mt-1 text-xs text-white/70">They get this in Notifications. Keep it short.</p>
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            maxLength={500}
            className="mt-3 min-h-24 w-full rounded-xl bg-[#102636] p-3 text-sm outline-none"
            placeholder="What should they know?"
          />
          <div className="mt-3 flex gap-2">
            <button type="submit" disabled={Boolean(busyId) || messageText.trim().length < 2} className="h-10 rounded-xl bg-[#E8DCC4] px-4 text-sm font-black text-[#163044] disabled:opacity-50">
              Send message
            </button>
            <button type="button" className="h-10 rounded-xl px-4 text-sm font-bold text-white/80" onClick={() => setMessageFor(null)}>Cancel</button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

function RiderCard({ row, monitor = false, children }) {
  const presence = PRESENCE_LABEL[row.presence] || row.presence;
  const tone = presenceColors(row.presence);
  const verifyTone = verifyColors(row.verification_status);
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
            <span className="rounded-full px-2 py-0.5 text-[10px] font-black" style={{ background: tone.bg, color: tone.fg }}>{presence}</span>
            <span className="rounded-full px-2 py-0.5 text-[10px] font-black" style={{ background: verifyTone.bg, color: verifyTone.fg }}>{verifyLabel(row.verification_status)}</span>
          </div>
          <p className="truncate text-xs font-semibold text-[#163044]/70 dark:text-[#F5F3EE]/70">{vehicleLine(row)}</p>
          {monitor ? (
            <p className="truncate text-xs text-[#163044]/55 dark:text-[#F5F3EE]/55">
              {row.presence === "paused" ? pauseEndsLabel(row.paused_until) : lastSeenLabel(row)}
              {" · "}
              {jobsTodayLabel(row.jobs_today)}
              {" · "}
              {ratingLabel(row.avg_rating, row.review_count)}
            </p>
          ) : (
            <p className="truncate text-xs text-[#163044]/55 dark:text-[#F5F3EE]/55">
              {row.phone ? <a href={`tel:${row.phone}`} className="font-semibold underline">{row.phone}</a> : "No phone"}
              {" · "}
              {lastSeenLabel(row)}
            </p>
          )}
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">{children}</div>
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

function Action({ children, onClick, disabled, tone = "default" }) {
  const styles = {
    primary: "bg-[#163044] text-white",
    teal: "bg-[#0D666A] text-white",
    warn: "bg-[#FFF0C4] text-[#8A6410]",
    danger: "border border-[#C94B78]/30 text-[#C94B78]",
    default: "border border-[#163044]/15 text-[#163044] dark:border-white/15 dark:text-[#F5F3EE]",
  };
  return (
    <button type="button" disabled={disabled} onClick={onClick} className={`h-9 rounded-xl px-3 text-xs font-black disabled:opacity-50 ${styles[tone] || styles.default}`}>
      {children}
    </button>
  );
}
