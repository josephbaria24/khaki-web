"use client";

import { useEffect, useState } from "react";
import { formatDateTime, formatPHP } from "@/lib/khaki";
import { api } from "@/lib/store";
import { DEFAULT_FLOW_SETTINGS } from "@/lib/taskFlow";
import { toast } from "@/lib/toast";

const FIELDS = [
  { key: "tasker_fee_rate", label: "Tasker fee", suffix: "%", toInput: (v) => String(Math.round(Number(v) * 1000) / 10), fromInput: (v) => Number(v) / 100, min: 0, max: 50 },
  { key: "auto_release_hours", label: "Auto-release", suffix: "hrs", toInput: String, fromInput: Number, min: 1, max: 720 },
  { key: "withdraw_min_php", label: "Min withdraw", suffix: "₱", toInput: String, fromInput: Number, min: 1, max: 100000 },
];

export default function TaskFlowAdmin() {
  const [values, setValues] = useState(() => Object.fromEntries(FIELDS.map((f) => [f.key, f.toInput(DEFAULT_FLOW_SETTINGS[f.key])])));
  const [saving, setSaving] = useState("");
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState("");

  const loadRows = () => api.wallet.adminList().then(setRows).catch(() => setRows([]));

  useEffect(() => {
    api.flow.settings().then((s) => setValues(Object.fromEntries(FIELDS.map((f) => [f.key, f.toInput(s[f.key])])))).catch(() => {});
    loadRows();
  }, []);

  const save = async (field) => {
    const n = field.fromInput(values[field.key]);
    const shown = Number(values[field.key]);
    if (!Number.isFinite(n) || shown < field.min || shown > field.max) {
      toast.error(`${field.label} must be ${field.min}–${field.max}`);
      return;
    }
    setSaving(field.key);
    try {
      await api.admin.setSetting(field.key, n);
      toast.success(`${field.label} saved`);
    } catch (err) {
      toast.error(err.message || "Could not save");
    } finally {
      setSaving("");
    }
  };

  const decide = async (row, decision) => {
    const note = decision === "rejected" ? window.prompt("Reason for declining (optional)") ?? "" : "";
    setBusy(row.id);
    try {
      await api.wallet.adminDecide(row.id, decision, note);
      await loadRows();
    } catch (err) {
      toast.error(err.message || "Could not update");
    } finally {
      setBusy("");
    }
  };

  const pending = rows.filter((row) => row.status === "pending");

  return (
    <div className="space-y-2">
      <h2 className="text-base font-black text-[#163044]">Task flow</h2>
      <div className="grid grid-cols-3 gap-1.5">
        {FIELDS.map((field) => (
          <div key={field.key} className="rounded-xl border border-[#E6D9C4] bg-[#FFFCF7] p-2">
            <p className="text-[9px] font-extrabold uppercase tracking-wide text-[#163044]/55">{field.label}</p>
            <div className="mt-1 flex items-center gap-1">
              <input
                type="number"
                min={field.min}
                max={field.max}
                value={values[field.key]}
                onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                className="h-8 w-full min-w-0 rounded-lg border border-[#E6D9C4] bg-white px-2 text-sm font-black text-[#163044]"
              />
              <span className="text-[11px] font-black text-[#163044]/55">{field.suffix}</span>
            </div>
            <button
              type="button"
              disabled={saving === field.key}
              onClick={() => save(field)}
              className="mt-1.5 h-7 w-full rounded-lg bg-[#0F6B6B] text-[11px] font-black text-white disabled:opacity-50"
            >
              {saving === field.key ? "…" : "Save"}
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-baseline justify-between gap-3 pt-2">
        <h2 className="text-base font-black text-[#163044]">Withdrawals</h2>
        <p className="text-[11px] font-semibold text-[#163044]/50">{pending.length} pending · send the money, then mark sent</p>
      </div>
      <div className="overflow-hidden rounded-xl border border-[#E6D9C4] bg-white">
        {rows.length === 0 ? (
          <p className="px-3 py-4 text-center text-xs text-muted-foreground">No withdrawal requests yet.</p>
        ) : rows.map((row) => (
          <div key={row.id} className="flex items-center gap-2 border-t border-[#EFE7DA] px-3 py-2 first:border-t-0">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black text-[#163044]">
                {row.user_name || "Tasker"} · {formatPHP(row.amount)}
              </p>
              <p className="truncate text-[11px] font-semibold text-[#163044]/55">
                {String(row.method || "gcash").toUpperCase()}
                {row.bank_name ? ` ${row.bank_name}` : ""} · {row.account_name || "—"} · {row.account_number || row.gcash_number || "—"} · {formatDateTime(row.created_at)}
              </p>
            </div>
            {row.status === "pending" ? (
              <div className="flex shrink-0 gap-1">
                <button type="button" disabled={busy === row.id} onClick={() => decide(row, "rejected")} className="h-8 rounded-lg border border-[#E6D9C4] px-2 text-[11px] font-black text-[#B42318] disabled:opacity-40">
                  Decline
                </button>
                <button type="button" disabled={busy === row.id} onClick={() => decide(row, "approved")} className="h-8 rounded-lg bg-[#0F6B6B] px-2.5 text-[11px] font-black text-white disabled:opacity-40">
                  Mark sent
                </button>
              </div>
            ) : (
              <span className="shrink-0 rounded-full bg-[#F3EFE3] px-2 py-0.5 text-[10px] font-black text-[#163044]">
                {row.status === "approved" ? "SENT" : "DECLINED"}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
