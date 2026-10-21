"use client";

import { useEffect, useState } from "react";
import { escrowSplit, formatPHP } from "@/lib/khaki";
import { uploadToCloudinary } from "@/lib/uploadFile";
import { api } from "@/lib/store";

const TEAL = "#0F6B6B";
const BEIGE = "#E7D3B0";

export default function RiderPayoutCard({ task, amount }) {
  const split = escrowSplit(amount);
  const [hold, setHold] = useState(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const load = () => api.escrow.forTask(task.id).then(setHold).catch(() => setHold(null));

  useEffect(() => {
    load();
  }, [task.id, task.status, task.extras]);

  const proof = task.extras?.progress?.proof_url || "";
  const delivered = Boolean(task.extras?.progress?.times?.delivered);
  const payout = hold?.tasker_payout ?? split.payout;
  const onHold = hold?.status === "locked";
  const released = hold?.status === "released";

  const onProof = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusy("photo");
    setError("");
    try {
      const uploaded = await uploadToCloudinary(file, "khaki/proof");
      await api.escrow.saveProof(task.id, uploaded.url || uploaded.secure_url);
      await load();
    } catch (err) {
      setError(err.message || "Could not upload the photo.");
    } finally {
      setBusy("");
    }
  };

  const markDelivered = async () => {
    setBusy("delivered");
    setError("");
    try {
      await api.escrow.markDelivered(task.id);
      await load();
    } catch (err) {
      setError(err.message || "Could not mark this delivered.");
    } finally {
      setBusy("");
    }
  };

  return (
    <section className="rounded-xl border border-[#E6D9C4] bg-white p-4 shadow-[0_10px_28px_rgba(42,63,77,0.08)]">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#163044]/50">Payout</p>
      <p className="mt-1 text-3xl font-black" style={{ color: TEAL }}>{formatPHP(payout)}</p>
      <p className="mt-1 text-xs font-semibold text-[#163044]/60">
        {released ? "Released by admin." : onHold ? "On hold until an admin releases it after delivery." : "Waiting for the client to pay via GCash."}
      </p>
      {error ? <p className="mt-3 rounded-lg bg-destructive/10 p-2 text-xs text-destructive">{error}</p> : null}
      {onHold && task.status === "in_progress" ? (
        <div className="mt-4 space-y-2.5">
          <label
            className="flex h-11 cursor-pointer items-center justify-center rounded-xl text-sm font-black"
            style={{ background: BEIGE, color: "#163044" }}
          >
            {busy === "photo" ? "Uploading…" : proof ? "Photo proof uploaded" : "Photo proof upload"}
            <input type="file" accept="image/*" className="hidden" onChange={onProof} disabled={busy === "photo"} />
          </label>
          {proof ? <img src={proof} alt="Delivery proof" className="h-28 w-full rounded-xl object-cover" /> : null}
          <button
            type="button"
            onClick={markDelivered}
            disabled={Boolean(busy) || delivered}
            className="flex h-11 w-full items-center justify-center rounded-xl text-sm font-black text-white disabled:opacity-60"
            style={{ background: TEAL }}
          >
            {delivered ? "Delivered" : busy === "delivered" ? "Saving…" : "Delivered"}
          </button>
        </div>
      ) : null}
    </section>
  );
}
