"use client";

import { useEffect, useState } from "react";
import { escrowSplit, formatPHP, PAYMENT_METHODS } from "@/lib/khaki";
import { confirmGcashCheckout, simulateEscrowPayment, startGcashCheckout } from "@/lib/paymongoClient";
import { api } from "@/lib/store";

const TEAL = "#0F6B6B";
const BEIGE = "#D9C5A0";

function StatusPill({ status }) {
  const hold = status === "locked";
  const released = status === "released";
  const label = hold ? "HOLD" : released ? "RELEASED" : "UNPAID";
  return (
    <span
      className="inline-flex h-6 items-center rounded-full px-2.5 text-[10px] font-black tracking-wide"
      style={{ background: hold || !released ? BEIGE : "#C8F0D8", color: "#163044" }}
    >
      {label}
    </span>
  );
}

function FakeQr({ method, amount }) {
  const cells = Array.from({ length: 36 }, (_, i) => ((i * 17 + method.length) % 7) > 2);
  return (
    <div className="mt-3 flex flex-col items-center rounded-xl border border-[#E6D9C4] bg-white p-4">
      <div className="grid h-36 w-36 grid-cols-6 gap-0.5 rounded-lg bg-[#F6F1E6] p-2">
        {cells.map((on, i) => (
          <div key={i} className={on ? "bg-[#163044]" : "bg-transparent"} />
        ))}
      </div>
      <p className="mt-2 text-xs font-semibold text-[#163044]">
        {method === "gcash" ? "GCash" : method === "qrph" ? "QR Ph" : method} · Pay {formatPHP(amount)}
      </p>
      <p className="text-[10px] font-semibold text-[#163044]/55">Simulation QR · not a real payment</p>
    </div>
  );
}

export default function ClientPayCard({ task, amount }) {
  const split = escrowSplit(amount);
  const [hold, setHold] = useState(null);
  const [agree, setAgree] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [simulationOn, setSimulationOn] = useState(false);
  const [method, setMethod] = useState("gcash");
  const [showQr, setShowQr] = useState(false);

  const load = () => api.escrow.forTask(task.id).then(setHold).catch(() => setHold(null));

  useEffect(() => {
    let live = true;
    api.settings.paymentSimulationEnabled()
      .then((on) => { if (live) setSimulationOn(Boolean(on)); })
      .catch(() => { if (live) setSimulationOn(false); });
    return () => { live = false; };
  }, []);

  useEffect(() => {
    let live = true;
    api.escrow.ensure(task.id)
      .then((row) => { if (live) setHold(row); })
      .catch((err) => { if (live) setError(err.message || "Could not open escrow."); });
    return () => { live = false; };
  }, [task.id]);

  useEffect(() => {
    if (!hold || hold.status !== "pending_payment") return;
    const returning = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("pay") === "success";
    const session = String(hold.payment_reference || hold.paymongo_session_id || "");
    if (!returning && !session.startsWith("cs_")) return;
    confirmGcashCheckout(hold.id)
      .then((result) => {
        if (result.hold) setHold(result.hold);
        else load();
      })
      .catch((err) => setError(err.message || "Could not confirm the payment."));
  }, [hold?.id, hold?.status]);

  const payReal = async () => {
    if (!agree) {
      setError("Agree to the escrow terms before paying.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const session = await startGcashCheckout(task.id);
      if (session.already_paid) {
        await load();
        return;
      }
      if (session.checkout_url) window.location.assign(session.checkout_url);
    } catch (err) {
      setError(err.message || "Could not start GCash.");
    } finally {
      setBusy(false);
    }
  };

  const paySimulate = async () => {
    if (!agree) {
      setError("Agree to the escrow terms before paying.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await simulateEscrowPayment(task.id, method);
      if (result.hold) setHold(result.hold);
      else await load();
    } catch (err) {
      setError(err.message || "Simulation failed.");
    } finally {
      setBusy(false);
    }
  };

  const status = hold?.status || "pending_payment";
  const paid = status === "locked" || status === "released";
  const qrMethods = method === "gcash" || method === "qrph";

  return (
    <section className="mt-4 rounded-xl border border-[#E6D9C4] bg-white p-4 shadow-[0_10px_28px_rgba(42,63,77,0.08)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#163044]/50">Escrow payment</p>
        <StatusPill status={status} />
      </div>
      <p className="mt-3 text-xs font-semibold text-[#163044]/55">Amount</p>
      <p className="mt-1 text-3xl font-black" style={{ color: TEAL }}>
        {formatPHP(split.total)} <span className="text-sm font-bold tracking-wide">TOTAL</span>
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl px-3 py-2" style={{ background: "#F6F1E6" }}>
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#163044]/50">Tasker payout</p>
          <p className="text-sm font-black text-[#163044]">{formatPHP(hold?.tasker_payout ?? split.payout)}</p>
        </div>
        <div className="rounded-xl px-3 py-2" style={{ background: "#F6F1E6" }}>
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#163044]/50">Platform fee</p>
          <p className="text-sm font-black text-[#163044]">{formatPHP(hold?.platform_fee ?? split.platform)}</p>
        </div>
      </div>
      {error ? <p className="mt-3 rounded-lg bg-destructive/10 p-2 text-xs text-destructive">{error}</p> : null}
      {paid ? (
        <p className="mt-3 text-xs font-semibold leading-relaxed text-[#163044]/70">
          {status === "released"
            ? "Released. The tasker payout and the platform fee are recorded."
            : "On hold. The tasker can start. An admin releases the payout after delivery."}
        </p>
      ) : (
        <>
          {simulationOn ? (
            <div className="mt-4 rounded-xl border border-dashed border-[#C9A96E] bg-[#FFF8E8] p-3">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#8A6410]">
                Payment simulation (admin)
              </p>
              <p className="mt-1 text-[11px] font-semibold text-[#163044]/65">
                Demo only — no real money moves. Turn this off in Admin → Payments.
              </p>
              <div className="mt-3 space-y-2">
                {PAYMENT_METHODS.map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => {
                      setMethod(row.id);
                      setShowQr(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left ${
                      method === row.id ? "border-[#0F6B6B] bg-white" : "border-[#E6D9C4] bg-[#FFFCF7]"
                    }`}
                  >
                    <span>
                      <span className="block text-sm font-black text-[#163044]">{row.label}</span>
                      <span className="block text-[11px] font-semibold text-[#163044]/55">{row.description}</span>
                    </span>
                    <span className={`h-4 w-4 rounded-full border-2 ${method === row.id ? "border-[#0F6B6B] bg-[#0F6B6B]" : "border-[#C9D6E0]"}`} />
                  </button>
                ))}
              </div>
              {showQr && qrMethods ? <FakeQr method={method} amount={split.total} /> : null}
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                {qrMethods ? (
                  <button
                    type="button"
                    onClick={() => setShowQr((v) => !v)}
                    className="h-10 flex-1 rounded-xl border border-[#E6D9C4] text-xs font-black text-[#163044]"
                  >
                    {showQr ? "Hide QR" : "Show QR"}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={paySimulate}
                  disabled={busy || !agree}
                  className="h-10 flex-1 rounded-xl text-xs font-black text-white disabled:opacity-60"
                  style={{ background: TEAL }}
                >
                  {busy ? "Simulating…" : "Confirm simulated payment"}
                </button>
              </div>
            </div>
          ) : null}

          <button
            type="button"
            onClick={payReal}
            disabled={busy || !agree}
            className="mt-4 flex h-11 w-full items-center justify-center rounded-xl text-sm font-black text-white disabled:opacity-60"
            style={{ background: TEAL }}
          >
            {busy ? "Opening GCash…" : simulationOn ? "Pay via real GCash" : "Pay via GCash"}
          </button>
          <label className="mt-3 flex items-start gap-2 text-xs font-semibold text-[#163044]/75">
            <input type="checkbox" className="mt-0.5" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            I agree to the escrow agreement. Khaki holds this payment until the job is delivered and an admin releases it.
          </label>
        </>
      )}
    </section>
  );
}
