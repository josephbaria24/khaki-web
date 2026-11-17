"use client";

import { useState } from "react";
import { cn, formatDateTime, formatPHP } from "@/lib/khaki";
import { feePercent, payoutBreakdown } from "@/lib/taskFlow";
import { Button, Card, Label, Stars, inputClass, softPanelClass } from "@/components/task-flow/parts";

export function receiptNumber(hold, task) {
  const raw = String(hold?.payment_reference || hold?.id || task?.id || "");
  return `KH-${raw.replace(/[^a-z0-9]/gi, "").slice(-8).toUpperCase()}`;
}

export function ReceiptCard({ task, hold, rate, viewer = "client" }) {
  const split = payoutBreakdown(hold?.amount_held ?? task?.budget_php, rate, hold);
  const paidAt = hold?.released_at || task?.extras?.progress?.times?.released;
  const rows = [
    ["Task price", formatPHP(split.price)],
    [`Khaki fee (${feePercent(split.rate)})`, `−${formatPHP(split.fee)}`],
  ];

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <Label>Receipt</Label>
          <p className="mt-0.5 text-[13px] font-black text-[#163044] dark:text-[#F5F3EE]">{receiptNumber(hold, task)}</p>
        </div>
        <span className="rounded-full bg-[#DDF5E8] px-2.5 py-1 text-[11px] font-black text-[#146C43] dark:bg-[#173B2B] dark:text-[#7FE0B0]">Paid</span>
      </div>
      <dl className="mt-3 space-y-1.5 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between">
            <dt className="font-semibold text-[#5F6B76] dark:text-[#A8B3C0]">{k}</dt>
            <dd className="money font-black text-[#163044] dark:text-[#F5F3EE]">{v}</dd>
          </div>
        ))}
        <div className="flex justify-between border-t border-dashed border-[#E6DDD0] pt-1.5 dark:border-white/10">
          <dt className="font-black text-[#163044] dark:text-[#F5F3EE]">{viewer === "tasker" ? "You received" : "Tasker received"}</dt>
          <dd className="money text-lg font-black text-[#1F9D6A] dark:text-[#3DDC97]">{formatPHP(split.payout)}</dd>
        </div>
      </dl>
      <div className={cn("mt-3 grid grid-cols-2 gap-2 rounded-xl p-2.5 text-[11px]", softPanelClass)}>
        <div>
          <p className="font-semibold text-[#5F6B76] dark:text-[#A8B3C0]">Client paid</p>
          <p className="money font-black text-[#163044] dark:text-[#F5F3EE]">{formatPHP(split.price)}</p>
        </div>
        <div>
          <p className="font-semibold text-[#5F6B76] dark:text-[#A8B3C0]">Released</p>
          <p className="font-black text-[#163044] dark:text-[#F5F3EE]">{formatDateTime(paidAt) || "—"}</p>
        </div>
      </div>
    </Card>
  );
}

function RatingBlock({ title, review, canRate, onSubmit }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await onSubmit({ rating, comment: comment.trim() });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={cn("rounded-xl p-3", softPanelClass)}>
      <p className="text-[12px] font-black text-[#163044] dark:text-[#F5F3EE]">{title}</p>
      {review ? (
        <>
          <div className="mt-1"><Stars value={review.rating} size="sm" /></div>
          {review.comment ? <p className="mt-1 text-[12px] font-semibold text-[#5F6B76] dark:text-[#A8B3C0]">{review.comment}</p> : null}
        </>
      ) : canRate ? (
        <>
          <div className="mt-1.5"><Stars value={rating} onChange={setRating} /></div>
          <input className={`${inputClass} mt-2 h-10`} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment (optional)" />
          <Button className="mt-2 h-10 w-full" disabled={busy} onClick={submit}>{busy ? "Saving…" : "Submit rating"}</Button>
        </>
      ) : (
        <p className="mt-1 text-[12px] font-semibold text-[#5F6B76] dark:text-[#A8B3C0]">Not rated yet</p>
      )}
    </div>
  );
}

export function RatingPair({ viewer, taskerReview, clientReview, clientName, taskerName, onRateTasker, onRateClient }) {
  return (
    <Card>
      <Label>Ratings</Label>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <RatingBlock
          title={viewer === "client" ? `You rated ${taskerName || "the tasker"}` : `${clientName || "Client"} rated you`}
          review={taskerReview}
          canRate={viewer === "client"}
          onSubmit={onRateTasker}
        />
        <RatingBlock
          title={viewer === "tasker" ? `You rated ${clientName || "the client"}` : `${taskerName || "Tasker"} rated you`}
          review={clientReview}
          canRate={viewer === "tasker"}
          onSubmit={onRateClient}
        />
      </div>
    </Card>
  );
}
