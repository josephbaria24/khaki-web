"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { SHARE_FIELDS, SHARE_TASK_GROUPS, shareVisibility } from "@/lib/shareVisibility";

function Toggle({ on, label, detail, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className="flex w-full items-center justify-between gap-2 rounded-xl bg-[#F4F7FA] px-2.5 py-1.5 text-left dark:bg-[#24303C]"
    >
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-black leading-tight text-[#163044] dark:text-[#F5F3EE]">{label}</span>
        {detail ? <span className="block truncate text-[10px] font-semibold leading-tight text-[#5F6B76] dark:text-[#A8B3C0]">{detail}</span> : null}
      </span>
      <span className={`relative h-5 w-9 shrink-0 rounded-full transition ${on ? "bg-[#1B6B45]" : "bg-[#C9D6E0] dark:bg-[#3A4452]"}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${on ? "left-4" : "left-0.5"}`} />
      </span>
    </button>
  );
}

export default function ShareProfileDialog({ open, profile, saving = false, confirmLabel = "Share", onClose, onConfirm }) {
  const [draft, setDraft] = useState(() => shareVisibility(profile));
  const [shown, setShown] = useState(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (open) setDraft(shareVisibility(profile));
  }, [open, profile]);

  useEffect(() => {
    let frame = 0;
    let timer = 0;
    if (open) {
      setShown(true);
      setActive(false);
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => setActive(true));
      });
    } else {
      setActive(false);
      timer = window.setTimeout(() => setShown(false), 380);
    }
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!shown || typeof document === "undefined") return null;

  const setField = (id) => setDraft((current) => ({ ...current, [id]: !current[id] }));
  const setTask = (id) => setDraft((current) => ({
    ...current,
    tasks: { ...current.tasks, [id]: !current.tasks[id] },
  }));

  return createPortal(
    <div className={`fixed inset-0 z-[120] flex items-end justify-center p-4 ${active ? "" : "pointer-events-none"}`} role="presentation">
      <button type="button" aria-label="Close" className={`share-dialog-shade absolute inset-0 bg-black/65 ${active ? "is-open" : ""}`} onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-profile-title"
        className={`share-dialog-card relative z-10 max-h-[min(86dvh,520px)] w-full max-w-md overflow-y-auto rounded-[1.35rem] bg-white p-3.5 shadow-[0_24px_60px_rgba(0,0,0,0.35)] dark:bg-[#1A1E27] ${active ? "is-open" : ""}`}
      >
        <h2 id="share-profile-title" className="text-base font-black text-[#163044] dark:text-[#F5F3EE]">Before you share</h2>
        <p className="mt-0.5 text-[12px] font-semibold leading-snug text-[#5F6B76] dark:text-[#A8B3C0]">
          People with your link can see and open only what you leave on.
        </p>

        <p className="mt-3 text-[10px] font-black uppercase tracking-[0.14em] text-[#5F6B76] dark:text-[#A8B3C0]">Profile</p>
        <div className="mt-1.5 grid grid-cols-2 gap-1.5">
          {SHARE_FIELDS.map((field) => (
            <Toggle key={field.id} on={draft[field.id]} label={field.label} onClick={() => setField(field.id)} />
          ))}
        </div>

        <p className="mt-3 text-[10px] font-black uppercase tracking-[0.14em] text-[#5F6B76] dark:text-[#A8B3C0]">Tasks they can open</p>
        <div className="mt-1.5 grid grid-cols-2 gap-1.5">
          {SHARE_TASK_GROUPS.map((group) => (
            <Toggle
              key={group.id}
              on={draft.tasks[group.id]}
              label={group.label}
              onClick={() => setTask(group.id)}
            />
          ))}
        </div>

        <div className="mt-3 flex gap-2">
          <button type="button" onClick={onClose} className="h-10 flex-1 rounded-full bg-[#E7F1FA] text-[13px] font-black text-[#163044] dark:bg-[#24303C] dark:text-[#F5F3EE]">
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => onConfirm(draft)}
            className="h-10 flex-1 rounded-full bg-[#163044] text-[13px] font-black text-[#F7F4EC] disabled:opacity-60 dark:bg-[#F5F3EE] dark:text-[#11141A]"
          >
            {saving ? "Saving" : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
