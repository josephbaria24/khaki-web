"use client";

import { useState } from "react";
import { REPORT_REASONS } from "@/lib/khaki";
import { api } from "@/lib/store";
import { toast } from "@/lib/toast";

export default function ReportGawain({ taskId, alreadyReported, onDone }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("spam");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  if (alreadyReported) {
    return (
      <p className="rounded-2xl border border-border bg-card p-4 text-xs font-semibold text-muted-foreground">
        Nai-report mo na ang gawain na ito. Hinihintay ang admin.
      </p>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.reports.create(taskId, { dispute_type: type, description: note });
      setOpen(false);
      onDone?.();
      toast.success("Report submitted");
    } catch (err) {
      const msg = err.message || "Hindi ma-submit ang report.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-11 w-full rounded-xl border border-border bg-card text-sm font-bold text-muted-foreground hover:text-foreground"
      >
        I-report ang gawain
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <p className="text-sm font-black">I-report ang gawain</p>
      <p className="mt-1 text-xs text-muted-foreground">Spam, scam, or bawal na listing. Admin ang mag-review.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {REPORT_REASONS.map((reason) => (
          <button
            key={reason.id}
            type="button"
            onClick={() => setType(reason.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold ${
              type === reason.id ? "bg-[#2A3F4D] text-[#F7F4EC]" : "bg-[#F3EFE3] text-[#2A3F4D]"
            }`}
          >
            {reason.label}
          </button>
        ))}
      </div>
      <textarea
        className="mt-3 min-h-20 w-full rounded-xl border p-3 text-sm"
        placeholder={type === "other" ? "Ilagay kung bakit (required)" : "Optional details"}
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      {error ? <p className="mt-2 text-xs font-semibold text-destructive">{error}</p> : null}
      <div className="mt-3 flex gap-2">
        <button type="submit" disabled={saving} className="h-10 flex-1 rounded-xl bg-primary text-sm font-bold text-white disabled:opacity-60">
          {saving ? "Sending…" : "Submit report"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="h-10 rounded-xl border px-4 text-sm font-bold">
          Cancel
        </button>
      </div>
    </form>
  );
}
