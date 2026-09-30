"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import StatusPill from "@/components/StatusPill";
import StarRating from "@/components/StarRating";
import { displayTaskCategory, formatPHP, timeAgo } from "@/lib/khaki";
import { graphicForTask } from "@/lib/catalog";

export default function PostedJobCard({ task, tasker, review, onCancel, bidCount }) {
  const hired = tasker || (task.accepted_tasker_id ? { id: task.accepted_tasker_id, full_name: "Tasker" } : null);
  const canEdit = task.status === "open" && !task.accepted_tasker_id;
  const canRate = task.status === "released" && hired && !review;
  const canCancel = task.status === "open" && typeof onCancel === "function";
  const bids = Number(bidCount ?? task.offer_count) || 0;
  const tone = graphicForTask(task);
  const [phase, setPhase] = useState("idle");
  const [secondsLeft, setSecondsLeft] = useState(3);
  const timerRef = useRef(null);
  const tickRef = useRef(null);
  const onCancelRef = useRef(onCancel);
  const taskRef = useRef(task);
  onCancelRef.current = onCancel;
  taskRef.current = task;

  useEffect(() => () => {
    const pending = timerRef.current;
    if (timerRef.current) clearTimeout(timerRef.current);
    if (tickRef.current) clearInterval(tickRef.current);
    timerRef.current = null;
    tickRef.current = null;
    if (pending) onCancelRef.current?.(taskRef.current);
  }, []);

  const confirmCancel = () => {
    setPhase("undo");
    setSecondsLeft(3);
    const started = Date.now();
    tickRef.current = setInterval(() => {
      const left = Math.ceil((3000 - (Date.now() - started)) / 1000);
      setSecondsLeft(Math.max(0, left));
    }, 200);
    timerRef.current = setTimeout(() => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (tickRef.current) clearInterval(tickRef.current);
      timerRef.current = null;
      tickRef.current = null;
      setPhase("idle");
      onCancelRef.current?.(taskRef.current);
    }, 3000);
  };

  const undoCancel = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (tickRef.current) clearInterval(tickRef.current);
    timerRef.current = null;
    tickRef.current = null;
    setPhase("idle");
  };
  const note = hired
    ? `Kumuha: ${hired.full_name}`
    : task.status === "cancelled"
      ? "Cancelled. Off Browse."
      : "Waiting pa sa mag-a-accept.";

  return (
    <article className="relative overflow-hidden rounded-2xl bg-[#FFFCF7] py-3 pl-4 pr-3 shadow-card">
      <span className="absolute inset-y-0 left-0 w-1.5" style={{ backgroundColor: tone.ink }} />

      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <StatusPill status={task.status} />
          <span
            className="truncate rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
            style={{ backgroundColor: tone.bg, color: tone.ink }}
          >
            {displayTaskCategory(task)}
          </span>
        </div>
        <span className="shrink-0 text-sm font-black" style={{ color: tone.ink }}>
          {formatPHP(task.budget_php)}
        </span>
      </div>

      <div className="mt-1.5 flex items-baseline justify-between gap-3">
        <h3 className="min-w-0 truncate text-base font-black leading-tight text-foreground">{task.title}</h3>
        <span className="shrink-0 text-[11px] font-semibold text-muted-foreground">{timeAgo(task.created_at)}</span>
      </div>

      <p className="mt-1 truncate text-xs font-medium text-muted-foreground">
        {bids > 0 ? (
          <span className="font-bold text-[#1F9D6A]">{bids} {bids === 1 ? "bid" : "bids"}</span>
        ) : (
          "Walang bid pa"
        )}
        {" · "}
        {hired ? (
          <Link href={`/u/${hired.id}`} className="font-bold text-foreground underline-offset-2 hover:underline">
            {note}
          </Link>
        ) : (
          note
        )}
      </p>

      {review ? (
        <div className="mt-1.5">
          <StarRating value={review.rating} readOnly size="sm" />
          {review.comment ? <p className="mt-0.5 truncate text-xs text-muted-foreground">{review.comment}</p> : null}
        </div>
      ) : null}

      {phase === "confirm" ? (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <p className="w-full text-xs font-semibold text-destructive">Cancel this gawain? The posting fee is not refunded.</p>
          <button
            type="button"
            onClick={confirmCancel}
            className="inline-flex h-8 items-center rounded-full bg-destructive px-3 text-xs font-bold text-white"
          >
            Yes, cancel
          </button>
          <button
            type="button"
            onClick={() => setPhase("idle")}
            className="inline-flex h-8 items-center rounded-full bg-[#C9D6E0] px-3 text-xs font-bold text-[#2A3F4D]"
          >
            Keep
          </button>
        </div>
      ) : phase === "undo" ? (
        <div className="mt-2.5 flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-destructive">Cancelling in {secondsLeft}s</p>
          <button
            type="button"
            onClick={undoCancel}
            className="inline-flex h-8 items-center rounded-full bg-[#163044] px-3 text-xs font-bold text-[#F7F4EC]"
          >
            Undo
          </button>
        </div>
      ) : (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <Link href={`/task/${task.id}`} className="btn-olive inline-flex !h-8 items-center !px-3 !py-0 text-xs">
            Tingnan
          </Link>
          {canEdit ? (
            <Link href={`/task/${task.id}#edit`} className="inline-flex h-8 items-center rounded-full bg-[#C9D6E0] px-3 text-xs font-bold text-[#2A3F4D]">
              I-edit
            </Link>
          ) : null}
          {canCancel ? (
            <button
              type="button"
              onClick={() => setPhase("confirm")}
              className="inline-flex h-8 items-center rounded-full border border-destructive px-3 text-xs font-bold text-destructive"
            >
              Cancel
            </button>
          ) : null}
          {canRate ? (
            <Link href={`/task/${task.id}#rate`} className="inline-flex h-8 items-center rounded-full bg-[#E8DCC4] px-3 text-xs font-bold text-[#2A3F4D]">
              I-rate ang tasker
            </Link>
          ) : null}
        </div>
      )}
    </article>
  );
}
