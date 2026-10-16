"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { activeMode } from "@/lib/roles";
import { api } from "@/lib/store";
import { MEMBER_STATUS_LABEL } from "@/lib/teams";
import { toast } from "@/lib/toast";

export default function TeamJoinCard({ className = "", onChange }) {
  const { user } = useAuth();
  const online = activeMode(user) === "tasker";
  // undefined while loading, null when the user has no team.
  const [team, setTeam] = useState(undefined);
  const [unavailable, setUnavailable] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const eligible = Boolean(user?.id) && user?.role !== "admin";

  const load = useCallback(async () => {
    try {
      setTeam(await api.teams.mine());
      setUnavailable(false);
    } catch {
      setUnavailable(true);
    }
  }, []);

  useEffect(() => {
    if (eligible) load();
  }, [eligible, user?.id, load]);

  if (!eligible || unavailable || team === undefined) return null;

  const join = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api.teams.join(code);
      setCode("");
      toast.success("Request sent to your team lead");
      await load();
      onChange?.();
    } catch (err) {
      setError(err.message || "Could not join the team.");
    } finally {
      setBusy(false);
    }
  };

  const leave = async () => {
    const waiting = team?.status === "waiting";
    if (!window.confirm(waiting ? "Cancel your request to join this team?" : "Leave this team? Your lead will be notified.")) return;
    setBusy(true);
    try {
      await api.teams.leave();
      toast.success(waiting ? "Request cancelled" : "You left the team");
      await load();
      onChange?.();
    } catch (err) {
      toast.error(err.message || "Could not leave the team.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={`mx-auto w-full max-w-[420px] rounded-[1.5rem] bg-white p-4 shadow-[0_8px_28px_rgba(22,48,68,0.08)] md:max-w-[560px] lg:max-w-[640px] lg:p-5 dark:bg-[#1A1E27] ${className}`}>
      <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#0D666A]">Rider team</p>

      {!team ? (
        <form onSubmit={join}>
          <h2 className="mt-1 text-lg font-black text-[#163044] dark:text-[#F5F3EE]">Join a team</h2>
          <p className="mt-1 text-sm text-[#163044]/65 dark:text-[#F5F3EE]/65">
            Got an invite code from your team lead? Enter it here. Your lead will see your name, phone, verification status, and vehicle.
          </p>
          <div className="mt-3 flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABC-123"
              maxLength={8}
              autoCapitalize="characters"
              autoComplete="off"
              aria-label="Invite code"
              data-no-translate
              className="h-11 min-w-0 flex-1 rounded-xl border border-[#E6DDD0] bg-[#FBF8F1] px-3 text-base font-black tracking-[0.2em] text-[#163044] outline-none focus:border-[#0D666A] dark:border-[#252A35] dark:bg-[#11141A] dark:text-[#F5F3EE]"
            />
            <button
              type="submit"
              disabled={busy || !code.trim()}
              className="h-11 shrink-0 rounded-xl bg-[#163044] px-5 text-sm font-black text-white disabled:opacity-50"
            >
              {busy ? "Joining…" : "Join"}
            </button>
          </div>
          {error ? <p className="mt-2 text-sm font-semibold text-[#C94B78]">{error}</p> : null}
        </form>
      ) : team.role === "lead" ? (
        <>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-black text-[#163044] dark:text-[#F5F3EE]">{team.name}</h2>
            <span className="rounded-full bg-[#163044] px-2.5 py-0.5 text-[11px] font-black text-white">Team lead</span>
          </div>
          <p className="mt-0.5 text-sm text-[#163044]/65 dark:text-[#F5F3EE]/65">{team.area}</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Stat label="Waiting" value={team.waiting} />
            <Stat label="Active riders" value={team.active} />
          </div>
          <Link href="/team" className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#163044] text-sm font-black text-white">
            Open team
          </Link>
        </>
      ) : (
        <>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-black text-[#163044] dark:text-[#F5F3EE]">{team.name}</h2>
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-black ${team.status === "active" ? "bg-[#D7F0EA] text-[#0D666A]" : "bg-[#FFF0C4] text-[#8A6410]"}`}>
              {MEMBER_STATUS_LABEL[team.status] || team.status}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-[#163044]/65 dark:text-[#F5F3EE]/65">{team.area}</p>
          <p className="mt-2 text-sm text-[#163044] dark:text-[#F5F3EE]">
            {team.status === "waiting" ? "Waiting for your lead to approve you." : "You're in this team."}
          </p>
          {team.status === "active" || team.status === "paused" ? (
            <div className={`mt-3 rounded-xl px-3 py-2 ${online ? "bg-[#D7F0EA]" : "bg-[#F3EFE3] dark:bg-[#252A35]"}`}>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#163044]/55 dark:text-[#F5F3EE]/55">For your lead</p>
              <p className={`text-sm font-black ${online ? "text-[#0D666A]" : "text-[#163044] dark:text-[#F5F3EE]"}`}>
                {online ? "You're Online (Tasker mode)" : "You're Offline (Poster mode)"}
              </p>
              <p className="mt-0.5 text-xs text-[#163044]/65 dark:text-[#F5F3EE]/65">
                Use the Poster / Tasker switch to go Online or Offline. Keep the app open so your last active stays fresh.
              </p>
            </div>
          ) : null}
          <div className="mt-3 rounded-xl bg-[#F3EFE3] px-3 py-2 dark:bg-[#252A35]">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#163044]/55 dark:text-[#F5F3EE]/55">Team lead</p>
            <p className="text-sm font-black text-[#163044] dark:text-[#F5F3EE]">{team.lead_name || "No lead yet"}</p>
          </div>
          <button
            type="button"
            onClick={leave}
            disabled={busy}
            className="mt-3 h-11 w-full rounded-xl border border-[#163044]/15 text-sm font-black text-[#163044] disabled:opacity-50 dark:border-white/15 dark:text-[#F5F3EE]"
          >
            {team.status === "waiting" ? "Cancel request" : "Leave team"}
          </button>
        </>
      )}
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl bg-[#F3EFE3] px-3 py-2 dark:bg-[#252A35]">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#163044]/55 dark:text-[#F5F3EE]/55">{label}</p>
      <p className="text-xl font-black tabular-nums text-[#163044] dark:text-[#F5F3EE]">{Number(value || 0)}</p>
    </div>
  );
}
