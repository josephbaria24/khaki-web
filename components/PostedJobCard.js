"use client";

import Link from "next/link";
import StatusPill from "@/components/StatusPill";
import StarRating from "@/components/StarRating";
import { formatPHP } from "@/lib/khaki";
import { LANDING } from "@/lib/landingContent";

export default function PostedJobCard({ task, tasker, review, onCancel }) {
  const hired = tasker || (task.accepted_tasker_id ? { id: task.accepted_tasker_id, full_name: "Tasker" } : null);
  const canEdit = task.status === "open";
  const canRate = task.status === "released" && hired && !review;
  const canCancel = task.status === "open" && typeof onCancel === "function";

  return (
    <article className="rounded-[1.5rem] bg-[#FFFCF7] p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={task.status} />
            <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: LANDING.olive }}>
              {task.category?.replace(/\s*\(.*\)/, "")}
            </span>
          </div>
          <h3 className="mt-2 text-lg font-black leading-snug text-foreground">{task.title}</h3>
          <p className="mt-1 text-sm font-black">{formatPHP(task.budget_php)}</p>
        </div>
        <p className="text-xs font-semibold text-muted-foreground">
          {task.offer_count ? `${task.offer_count} bid${task.offer_count === 1 ? "" : "s"}` : "Walang bid pa"}
        </p>
      </div>

      {hired ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Kumuha:{" "}
          <Link href={`/u/${hired.id}`} className="font-bold text-foreground underline-offset-2 hover:underline">
            {hired.full_name}
          </Link>
        </p>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">Waiting pa sa mag-a-accept.</p>
      )}

      {review ? (
        <div className="mt-3">
          <StarRating value={review.rating} readOnly size="sm" />
          {review.comment ? <p className="mt-1 text-xs text-muted-foreground">{review.comment}</p> : null}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={`/task/${task.id}`} className="btn-olive inline-flex h-10 items-center px-4 text-xs">
          Tingnan
        </Link>
        {canEdit ? (
          <Link href={`/task/${task.id}#edit`} className="inline-flex h-10 items-center rounded-full bg-[#C9D6E0] px-4 text-xs font-bold text-[#2A3F4D]">
            I-edit
          </Link>
        ) : null}
        {canCancel ? (
          <button
            type="button"
            onClick={() => {
              const ok = window.confirm("Cancel this gawain? It will leave Browse and pending bids will be declined. The 2% posting fee is not refunded.");
              if (!ok) return;
              onCancel?.(task);
            }}
            className="inline-flex h-10 items-center rounded-full border-2 border-destructive px-4 text-xs font-bold text-destructive"
          >
            Cancel
          </button>
        ) : null}
        {canRate ? (
          <Link href={`/task/${task.id}#rate`} className="inline-flex h-10 items-center rounded-full bg-[#E8DCC4] px-4 text-xs font-bold text-[#2A3F4D]">
            I-rate ang tasker
          </Link>
        ) : null}
      </div>
    </article>
  );
}
