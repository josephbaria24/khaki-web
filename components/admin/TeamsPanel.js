"use client";

import { useCallback, useEffect, useState } from "react";
import TeamRoster from "@/components/team/TeamRoster";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { LOCATIONS } from "@/lib/khaki";
import { api } from "@/lib/store";
import { eligibleLeads, formatCode } from "@/lib/teams";
import { toast } from "@/lib/toast";

const EMPTY_FORM = { id: null, name: "", area: "Puerto Princesa City", lead_id: null };

export default function TeamsPanel({ users, onOpenQueue }) {
  const [teams, setTeams] = useState([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [leadQuery, setLeadQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [rosterFor, setRosterFor] = useState("");

  const load = useCallback(async () => {
    try {
      setTeams(await api.admin.teams());
      setError("");
    } catch (err) {
      setError(err.message || "Could not load teams.");
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const usersById = Object.fromEntries((users || []).map((u) => [u.id, u]));
  const lead = form.lead_id ? usersById[form.lead_id] : null;
  const needle = leadQuery.trim().toLowerCase();
  const leadOptions = needle
    ? eligibleLeads(users, teams, form.id)
      .filter((u) => `${u.full_name || ""} ${u.email || ""} ${u.phone || ""}`.toLowerCase().includes(needle))
      .slice(0, 6)
    : [];

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.admin.saveTeam(form);
      toast.success(form.id ? "Team saved" : "Team created");
      setForm(EMPTY_FORM);
      setLeadQuery("");
      await load();
    } catch (err) {
      toast.error(err.message || "Could not save the team.");
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (team, status) => {
    if (status === "archived" && !window.confirm("Archive this team? Every rider in it, and every waiting request, is released.")) return;
    try {
      await api.admin.setTeamStatus(team.id, status);
      toast.success(status === "archived" ? "Team archived" : "Team reopened");
      await load();
    } catch (err) {
      toast.error(err.message || "Could not update the team.");
    }
  };

  const copy = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Invite code copied");
    } catch {
      toast.error("Could not copy the code.");
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-black text-[#163044]">Teams</h2>
        <p className="text-sm text-[#163044]/65">Create a rider team, appoint its lead, and share the invite code. Money never goes through a team.</p>
      </div>

      <form onSubmit={save} className="space-y-3 rounded-[1.5rem] bg-white p-4 shadow-[0_8px_28px_rgba(22,48,68,0.08)] lg:p-5">
        <p className="text-sm font-black text-[#163044]">{form.id ? "Edit team" : "New team"}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-wide text-[#163044]/55">Team name</span>
            <input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Maxim Riders PPC"
              maxLength={60}
              className="mt-1 h-11 w-full rounded-xl border border-[#E6DDD0] bg-[#FBF8F1] px-3 text-sm font-semibold text-[#163044] outline-none"
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-wide text-[#163044]/55">Area</span>
            <select
              value={form.area}
              onChange={(e) => setForm((prev) => ({ ...prev, area: e.target.value }))}
              className="mt-1 h-11 w-full rounded-xl border border-[#E6DDD0] bg-[#FBF8F1] px-3 text-sm font-semibold text-[#163044] outline-none"
            >
              {LOCATIONS.map((town) => <option key={town} value={town}>{town}</option>)}
            </select>
          </label>
        </div>
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wide text-[#163044]/55">Team lead</span>
          {lead || form.lead_id ? (
            <div className="mt-1 flex items-center justify-between gap-2 rounded-xl bg-[#F3EFE3] px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-[#163044]">{lead?.full_name || "Current lead"}</p>
                <p className="truncate text-xs text-[#163044]/60">{lead?.email || lead?.phone || ""}</p>
              </div>
              <button type="button" onClick={() => setForm((prev) => ({ ...prev, lead_id: null }))} className="h-8 shrink-0 rounded-lg border border-[#163044]/15 px-3 text-xs font-black text-[#163044]">
                Change
              </button>
            </div>
          ) : (
            <>
              <input
                value={leadQuery}
                onChange={(e) => setLeadQuery(e.target.value)}
                placeholder="Search a verified account by name, email, or phone"
                className="mt-1 h-11 w-full rounded-xl border border-[#E6DDD0] bg-[#FBF8F1] px-3 text-sm font-semibold text-[#163044] outline-none"
              />
              {needle && !leadOptions.length ? (
                <p className="mt-1 text-xs text-[#163044]/60">No verified account matches. Verify the lead first in the Verification tab.</p>
              ) : null}
              {leadOptions.length ? (
                <div className="mt-1 overflow-hidden rounded-xl border border-[#E6DDD0]">
                  {leadOptions.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => { setForm((prev) => ({ ...prev, lead_id: u.id })); setLeadQuery(""); }}
                      className="flex w-full items-center justify-between gap-2 border-b border-[#E6DDD0] bg-white px-3 py-2 text-left last:border-0 hover:bg-[#FBF8F1]"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-black text-[#163044]">{u.full_name}</span>
                        <span className="block truncate text-xs text-[#163044]/60">{u.email || u.phone || ""}</span>
                      </span>
                      <span className="shrink-0 text-xs font-black text-[#0D666A]">Appoint</span>
                    </button>
                  ))}
                </div>
              ) : null}
              <p className="mt-1 text-xs text-[#163044]/55">Optional. Only verified accounts can lead a team.</p>
            </>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={saving || form.name.trim().length < 2} className="h-11 rounded-xl bg-[#163044] px-5 text-sm font-black text-white disabled:opacity-50">
            {saving ? "Saving…" : form.id ? "Save changes" : "Create team"}
          </button>
          {form.id ? (
            <button type="button" onClick={() => { setForm(EMPTY_FORM); setLeadQuery(""); }} className="h-11 rounded-xl px-4 text-sm font-bold text-[#163044]/70">
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      {error ? <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
      {!ready ? <PageSkeleton rows={3} /> : null}
      {ready && !error && !teams.length ? (
        <p className="rounded-2xl border border-dashed border-[#E6DDD0] p-4 text-sm text-[#163044]/60">No teams yet. Create the first one above.</p>
      ) : null}

      <div className="grid gap-3 xl:grid-cols-2">
        {teams.map((team) => {
          const archived = team.status !== "active";
          return (
            <div key={team.id} className={`rounded-[1.5rem] bg-white p-4 shadow-[0_8px_28px_rgba(22,48,68,0.08)] ${archived ? "opacity-70" : ""} ${rosterFor === team.id ? "xl:col-span-2" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-lg font-black text-[#163044]">{team.name}</p>
                  <p className="text-xs font-semibold text-[#163044]/60">{team.area}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${archived ? "bg-[#EEF2F6] text-[#3D4A5C]" : "bg-[#D7F0EA] text-[#0D666A]"}`}>
                  {archived ? "Archived" : "Active"}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Cell label="Team lead" value={team.lead_name || "No lead yet"} />
                <Cell label="Invite code" value={formatCode(team.invite_code)} mono />
                <Cell label="Waiting" value={Number(team.waiting || 0)} />
                <Cell label="Active riders" value={Number(team.active || 0)} />
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {!archived ? (
                  <>
                    <SmallButton onClick={() => copy(team.invite_code)}>Copy code</SmallButton>
                    <SmallButton onClick={() => setRosterFor(rosterFor === team.id ? "" : team.id)}>{rosterFor === team.id ? "Hide roster" : "Roster"}</SmallButton>
                    <SmallButton onClick={() => onOpenQueue?.(team)}>Verification queue</SmallButton>
                    <SmallButton onClick={() => { setForm({ id: team.id, name: team.name, area: team.area, lead_id: team.lead_id }); setLeadQuery(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Edit</SmallButton>
                    <SmallButton tone="danger" onClick={() => setStatus(team, "archived")}>Archive</SmallButton>
                  </>
                ) : (
                  <SmallButton onClick={() => setStatus(team, "active")}>Reopen</SmallButton>
                )}
              </div>
              {rosterFor === team.id && !archived ? (
                <div className="mt-4 border-t border-[#E6DDD0] pt-4">
                  <TeamRoster teamId={team.id} onChange={load} />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Cell({ label, value, mono = false }) {
  return (
    <div className="min-w-0 rounded-xl bg-[#F3EFE3] px-3 py-2">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#163044]/55">{label}</p>
      <p className={`truncate text-sm font-black text-[#163044] ${mono ? "font-mono tracking-[0.12em]" : ""}`} data-no-translate={mono || undefined}>{value}</p>
    </div>
  );
}

function SmallButton({ children, onClick, tone = "default" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-9 rounded-lg px-3 text-xs font-black ${tone === "danger" ? "border border-[#C94B78]/30 text-[#C94B78]" : "bg-[#163044] text-white"}`}
    >
      {children}
    </button>
  );
}
