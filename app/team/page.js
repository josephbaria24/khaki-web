"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import Container from "@/components/Container";
import TeamJoinCard from "@/components/team/TeamJoinCard";
import TeamMonitor from "@/components/team/TeamMonitor";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/store";
import { formatCode } from "@/lib/teams";
import { toast } from "@/lib/toast";

export default function TeamPage() {
  const { user, ready: authReady } = useAuth();
  // undefined while loading, null when the user has no team.
  const [team, setTeam] = useState(undefined);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const isAdminUser = user?.role === "admin";

  const load = useCallback(async () => {
    try {
      setTeam(await api.teams.mine());
      setError("");
    } catch (err) {
      setTeam(null);
      setError(err.message || "Could not load your team.");
    }
  }, []);

  useEffect(() => {
    if (user?.id && !isAdminUser) load();
  }, [user?.id, isAdminUser, load]);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(team.invite_code);
      toast.success("Invite code copied");
    } catch {
      toast.error("Could not copy. Read the code out instead.");
    }
  };

  const newCode = async () => {
    if (!window.confirm("Make a new invite code? The old code stops working right away.")) return;
    setBusy(true);
    try {
      const code = await api.teams.regenerateCode(team.team_id);
      setTeam((prev) => ({ ...prev, invite_code: code }));
      toast.success("New invite code ready");
    } catch (err) {
      toast.error(err.message || "Could not change the code.");
    } finally {
      setBusy(false);
    }
  };

  let body;
  if (!authReady || (user?.id && !isAdminUser && team === undefined)) {
    body = <PageSkeleton rows={4} />;
  } else if (!user?.id) {
    body = (
      <div>
        <h1 className="page-title">Team</h1>
        <p className="page-sub">Log in to join a rider team.</p>
        <Link href="/login" className="mt-4 inline-flex h-11 items-center rounded-xl bg-[#163044] px-5 font-bold text-white">Log in</Link>
      </div>
    );
  } else if (isAdminUser) {
    body = (
      <div>
        <h1 className="page-title">Team</h1>
        <p className="page-sub">Admins create teams and appoint leads from the admin console.</p>
        <Link href="/admin?tab=teams" className="mt-4 inline-flex h-11 items-center rounded-xl bg-[#163044] px-5 font-bold text-white">Open admin teams</Link>
      </div>
    );
  } else if (team?.role === "lead") {
    body = (
      <div className="space-y-6">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#0D666A]">Team lead</p>
          <h1 className="page-title">{team.name}</h1>
          <p className="page-sub">{team.area}</p>
        </div>
        <section className="rounded-[1.5rem] bg-[#163044] p-5 text-white shadow-[0_12px_32px_rgba(22,48,68,0.22)]">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-white/60">Invite code</p>
          <p className="mt-1 font-mono text-4xl font-black tracking-[0.18em]" data-no-translate>{formatCode(team.invite_code)}</p>
          <p className="mt-2 text-sm text-white/70">Share this code with your riders. They enter it on their Profile or Verify page, then you approve them here.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={copyCode} className="h-10 rounded-xl bg-[#E8DCC4] px-4 text-sm font-black text-[#163044]">Copy code</button>
            <button type="button" onClick={newCode} disabled={busy} className="h-10 rounded-xl border border-white/25 px-4 text-sm font-black text-white disabled:opacity-50">New code</button>
          </div>
        </section>
        <TeamMonitor teamId={team.team_id} onChange={load} />
      </div>
    );
  } else {
    body = (
      <div className="space-y-4">
        <div>
          <h1 className="page-title">Team</h1>
          <p className="page-sub">Riders in a team get matched to jobs as usual, and the team lead helps keep everyone on track.</p>
        </div>
        {error ? <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
        <TeamJoinCard className="!mx-0" onChange={load} />
      </div>
    );
  }

  return (
    <AppShell>
      <Container className="max-w-4xl py-6 lg:py-10">{body}</Container>
    </AppShell>
  );
}
