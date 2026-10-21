"use client";

import { useEffect, useState } from "react";
import { formatPHP } from "@/lib/khaki";
import { releaseEscrow } from "@/lib/paymongoClient";
import { api } from "@/lib/store";
import { toast } from "@/lib/toast";

const TEAL = "#0F6B6B";
const BEIGE = "#D9C5A0";

function delivered(row) {
  if (row?.task?.extras?.progress?.times?.delivered) return true;
  return row?.task?.status === "released" || row?.task?.status === "completed_pending_review";
}

export default function EscrowDashboard() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [simulationOn, setSimulationOn] = useState(false);
  const [simBusy, setSimBusy] = useState(false);

  const load = () => api.escrow.list()
    .then(setRows)
    .catch((err) => setError(err.message || "Could not load escrow."));

  const loadSim = () => api.admin.getSetting("payment_simulation_enabled")
    .then((value) => setSimulationOn(value === true || value === "true"))
    .catch(() => setSimulationOn(false));

  useEffect(() => {
    load();
    loadSim();
  }, []);

  const held = rows.filter((row) => row.status === "locked");
  const total = held.reduce((sum, row) => sum + Number(row.amount_held || 0), 0);
  const platform = held.reduce((sum, row) => sum + Number(row.platform_fee || 0), 0);
  const payout = held.reduce((sum, row) => sum + Number(row.tasker_payout || 0), 0);

  const toggleSimulation = async () => {
    setSimBusy(true);
    setError("");
    try {
      const next = !simulationOn;
      await api.admin.setSetting("payment_simulation_enabled", next);
      setSimulationOn(next);
      toast.success(next ? "Payment simulation ON — users can see demo QR" : "Payment simulation OFF — demo QR hidden");
    } catch (err) {
      setError(err.message || "Could not update simulation setting.");
    } finally {
      setSimBusy(false);
    }
  };

  const release = async (row) => {
    setBusy(row.id);
    setError("");
    try {
      await releaseEscrow(row.id);
      await load();
    } catch (err) {
      setError(err.message || "Could not release.");
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-black text-[#163044]">Escrow</h2>
        <p className="truncate text-[11px] font-semibold text-[#163044]/50">Release after delivery, then pay out in PayMongo.</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E6D9C4] bg-[#FFFCF7] px-3 py-2.5">
        <div className="min-w-0">
          <p className="text-sm font-black text-[#163044]">Payment simulation</p>
          <p className="text-[11px] font-semibold text-[#163044]/55">
            {simulationOn
              ? "ON — users see demo QR / simulated lock on escrow."
              : "OFF — no demo QR or simulation controls for users."}
          </p>
        </div>
        <button
          type="button"
          disabled={simBusy}
          onClick={toggleSimulation}
          className="relative h-8 w-14 shrink-0 rounded-full transition disabled:opacity-50"
          style={{ background: simulationOn ? TEAL : "#C9D6E0" }}
          aria-pressed={simulationOn}
          aria-label={simulationOn ? "Turn payment simulation off" : "Turn payment simulation on"}
        >
          <span
            className="absolute top-1 h-6 w-6 rounded-full bg-white shadow transition"
            style={{ left: simulationOn ? 28 : 4 }}
          />
        </button>
      </div>

      {error ? <p className="rounded-lg bg-destructive/10 px-2.5 py-1.5 text-xs text-destructive">{error}</p> : null}
      <div className="grid grid-cols-3 gap-1.5">
        <Stat label="Held" value={formatPHP(total)} tone="teal" />
        <Stat label="Fee" value={formatPHP(platform)} tone="sand" />
        <Stat label="Payout" value={formatPHP(payout)} tone="green" />
      </div>
      <div className="overflow-hidden rounded-xl border border-[#E6D9C4] bg-white">
        {rows.length === 0 ? (
          <p className="px-3 py-4 text-center text-xs text-muted-foreground">No escrow payments yet.</p>
        ) : rows.map((row) => {
          const label = row.status === "locked" ? "HOLD" : row.status === "released" ? "RELEASED" : row.status === "pending_payment" ? "UNPAID" : "CANCELLED";
          const canRelease = row.status === "locked" && delivered(row);
          const when = row.created_at ? new Date(row.created_at).toLocaleDateString("en-CA") : "";
          return (
            <div key={row.id} className="flex items-center gap-2 border-t border-[#EFE7DA] px-3 py-2 first:border-t-0">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-black text-[#163044]">{row.client_name || "Client"}</p>
                  <span className="shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-black" style={{ background: row.status === "released" ? "#C8F0D8" : BEIGE }}>
                    {label}
                  </span>
                </div>
                <p className="truncate text-[11px] font-semibold text-[#163044]/55">
                  {formatPHP(row.amount_held)} · tasker {formatPHP(row.tasker_payout)} · fee {formatPHP(row.platform_fee)}
                  {when ? ` · ${when}` : ""}
                </p>
              </div>
              {row.status === "locked" ? (
                <button
                  type="button"
                  disabled={!canRelease || busy === row.id}
                  onClick={() => release(row)}
                  className="h-8 shrink-0 rounded-lg px-2.5 text-[11px] font-black text-white disabled:opacity-40"
                  style={{ background: TEAL }}
                  title={canRelease ? "Release the tasker payout" : "Waiting for delivery"}
                >
                  {busy === row.id ? "…" : "Release"}
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const TONES = {
  teal: { bg: "#E5F4F2", fg: "#0F6B6B" },
  sand: { bg: "#F8EBD4", fg: "#8A5A12" },
  green: { bg: "#E5F6EC", fg: "#146C43" },
};

function Stat({ label, value, tone = "sand" }) {
  const color = TONES[tone] || TONES.sand;
  return (
    <div className="rounded px-2 py-1.5" style={{ background: color.bg }}>
      <p className="text-[9px] font-extrabold uppercase tracking-wide" style={{ color: color.fg }}>{label}</p>
      <p className="text-sm font-black leading-tight" style={{ color: color.fg }}>{value}</p>
    </div>
  );
}
