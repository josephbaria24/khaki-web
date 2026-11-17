"use client";

import { useState } from "react";
import { cn } from "@/lib/khaki";
import { checklistDone, taskChecklist } from "@/lib/taskFlow";
import { uploadToCloudinary } from "@/lib/uploadFile";
import { api } from "@/lib/store";
import { toast } from "@/lib/toast";
import { Card, Label } from "@/components/task-flow/parts";

export function TaskChecklist({ task, editable = false, onChange, hint }) {
  const items = taskChecklist(task);
  const done = checklistDone(task);
  const [busy, setBusy] = useState(null);
  const count = items.filter((_, i) => done[i]).length;

  const toggle = async (i) => {
    if (!editable || busy != null) return;
    setBusy(i);
    try {
      const next = await api.flow.toggleChecklist(task.id, i, !done[i]);
      onChange?.(next);
    } catch (err) {
      toast.error(err.message || "Could not update the checklist");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between">
        <Label>Progress checklist</Label>
        <span className="text-[11px] font-black text-[#5F6B76] dark:text-[#A8B3C0]">{count}/{items.length}</span>
      </div>
      {hint ? <p className="mt-1 text-[11px] font-semibold text-[#5F6B76] dark:text-[#A8B3C0]">{hint}</p> : null}
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#EFE7DA] dark:bg-white/10">
        <div className="h-full rounded-full bg-[#1F9D6A] transition-all" style={{ width: `${items.length ? (count / items.length) * 100 : 0}%` }} />
      </div>
      <ul className="mt-2 divide-y divide-[#EFE7DA] dark:divide-white/5">
        {items.map((item, i) => {
          const on = Boolean(done[i]);
          return (
            <li key={`${i}-${item}`}>
              <button
                type="button"
                disabled={!editable || busy != null}
                onClick={() => toggle(i)}
                className="flex w-full items-center gap-2.5 py-2.5 text-left disabled:cursor-default"
              >
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-black",
                    on ? "border-[#1F9D6A] bg-[#1F9D6A] text-white" : "border-[#C9D6E0] dark:border-white/20",
                    busy === i && "animate-pulse"
                  )}
                >
                  {on ? "✓" : ""}
                </span>
                <span className={cn("text-[13px] font-semibold", on ? "text-[#5F6B76] line-through dark:text-[#A8B3C0]" : "text-[#163044] dark:text-[#E7EEF4]")}>
                  {item}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

export function PhotoCompare({ task, editable = false, onChange }) {
  const progress = task?.extras?.progress || {};
  const photos = { before: progress.before_url || "", after: progress.after_url || progress.proof_url || "" };
  const [busy, setBusy] = useState("");

  const upload = async (kind, event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusy(kind);
    try {
      const uploaded = await uploadToCloudinary(file, "khaki/proof");
      const next = await api.flow.savePhoto(task.id, kind, uploaded.url || uploaded.secure_url);
      onChange?.(next);
    } catch (err) {
      toast.error(err.message || "Could not upload the photo");
    } finally {
      setBusy("");
    }
  };

  if (!editable && !photos.before && !photos.after) return null;

  return (
    <Card>
      <Label>Before & after photos</Label>
      {editable ? (
        <p className="mt-1 text-[11px] font-semibold text-[#5F6B76] dark:text-[#A8B3C0]">
          Add an after photo before you submit for approval.
        </p>
      ) : null}
      <div className="mt-2 grid grid-cols-2 gap-2">
        {["before", "after"].map((kind) => (
          <div key={kind}>
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[#F3EFE3] dark:bg-[#11141A]">
              {photos[kind] ? (
                <img src={photos[kind]} alt={`${kind} photo`} className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full items-center justify-center text-[11px] font-semibold text-[#5F6B76] dark:text-[#A8B3C0]">
                  No photo yet
                </span>
              )}
              <span className="absolute left-1.5 top-1.5 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-black capitalize text-white">{kind}</span>
            </div>
            {editable ? (
              <label className="mt-1.5 flex h-9 cursor-pointer items-center justify-center rounded-xl bg-[#E7F1FA] text-[12px] font-black text-[#163044] dark:bg-[#24303C] dark:text-[#F5F3EE]">
                {busy === kind ? "Uploading…" : photos[kind] ? "Replace" : `Add ${kind}`}
                <input type="file" accept="image/*" className="hidden" disabled={Boolean(busy)} onChange={(e) => upload(kind, e)} />
              </label>
            ) : null}
          </div>
        ))}
      </div>
    </Card>
  );
}
