"use client";

import { useEffect, useState } from "react";
import { cn, formatPHP } from "@/lib/khaki";
import { Button, Field, InfoCallout, Label, Sheet, softPanelClass, inputClass } from "@/components/task-flow/parts";

export const WITHDRAW_METHODS = [
  { id: "gcash", label: "GCash", hint: "09XX XXX XXXX", speed: "Fast · 1–2 hours", mark: "G" },
  { id: "maya", label: "Maya", hint: "09XX XXX XXXX", speed: "1–2 hours", mark: "M" },
  { id: "bank", label: "Bank Transfer", hint: "Account number", speed: "1–2 business days", mark: "B", bankHint: "BPI / BDO" },
];

export const WITHDRAW_STEPS = [
  { title: "Enter amount" },
  { title: "Choose method" },
  { title: "Confirm" },
];

function maskAccount(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  if (digits.length < 4) return "Add number below";
  return `${digits.slice(0, 4)} ••• ••••`;
}

export default function WithdrawSheet({
  open,
  available,
  minimum,
  defaultNumber = "",
  defaultName = "",
  fromLabel = "",
  taskerLabel = "",
  onClose,
  onSubmit,
  onViewHistory,
}) {
  const [method, setMethod] = useState("gcash");
  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [bank, setBank] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setMethod("gcash");
    setAmount(available >= minimum ? String(Math.floor(available)) : "");
    setName(defaultName);
    setNumber(defaultNumber);
    setBank("");
    setError("");
  }, [open, available, minimum, defaultName, defaultNumber]);

  const value = Number(amount);
  const tooLow = value > 0 && value < minimum;
  const tooHigh = value > available;
  const ready =
    value >= minimum &&
    !tooHigh &&
    name.trim().length > 1 &&
    number.replace(/\D/g, "").length >= 6 &&
    (method !== "bank" || bank.trim().length > 1);
  const current = WITHDRAW_METHODS.find((row) => row.id === method) || WITHDRAW_METHODS[0];

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      await onSubmit({
        amount: value,
        method,
        account_name: name.trim(),
        account_number: number.trim(),
        bank_name: method === "bank" ? bank.trim() : null,
      });
    } catch (err) {
      setError(err.message || "Could not request the withdrawal.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Withdraw"
      subtitle={`${formatPHP(available)} available · min ${formatPHP(minimum)}`}
      footer={
        <>
          <Button
            variant="outline"
            onClick={() => {
              onClose();
              onViewHistory?.();
            }}
          >
            View history
          </Button>
          <Button variant="green" disabled={!ready || busy} onClick={submit}>
            {busy ? "Sending…" : `Withdraw ${value > 0 ? formatPHP(value) : ""}`}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className={cn("rounded-2xl px-3.5 py-3", softPanelClass)}>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1F9D6A] text-sm font-black text-white">✓</span>
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#5F6B76] dark:text-[#A8B3C0]">Available balance</p>
              <p className="money text-xl font-black text-[#163044] dark:text-[#F5F3EE]">{formatPHP(available)}</p>
            </div>
          </div>
          {fromLabel || taskerLabel ? (
            <p className="mt-2 text-[11px] font-semibold text-[#5F6B76] dark:text-[#A8B3C0]">
              {[fromLabel, taskerLabel].filter(Boolean).join(" · ")}
            </p>
          ) : null}
        </div>

        <div>
          <Label>Withdraw to</Label>
          <div className="mt-1.5 space-y-1.5">
            {WITHDRAW_METHODS.map((row) => {
              const on = method === row.id;
              const detail =
                row.id === "bank"
                  ? bank.trim() || row.bankHint
                  : maskAccount(number || defaultNumber);
              return (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => setMethod(row.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition",
                    on
                      ? "border-[#1F9D6A] bg-[#EFFAF4] dark:border-[#3DDC97] dark:bg-[#132A20]"
                      : "border-[#E6DDD0] bg-white dark:border-white/10 dark:bg-transparent"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black",
                      on
                        ? "bg-[#1F9D6A] text-white"
                        : "bg-[#E8EEF3] text-[#163044] dark:bg-[#1B2430] dark:text-[#F5F3EE]"
                    )}
                  >
                    {row.mark}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-black text-[#163044] dark:text-[#F5F3EE]">{row.label}</span>
                    <span className="mt-0.5 block truncate text-[11px] font-semibold text-[#5F6B76] dark:text-[#A8B3C0]">{detail}</span>
                  </span>
                  <span className="shrink-0 rounded-full bg-[#E8EEF3] px-2 py-0.5 text-[10px] font-black text-[#163044] dark:bg-[#1B2430] dark:text-[#A8B3C0]">
                    {row.speed}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <Label>Amount to withdraw</Label>
          <div className={cn("mt-1.5 rounded-2xl px-3.5 py-3", softPanelClass)}>
            <input
              className="money w-full bg-transparent text-2xl font-black text-[#163044] outline-none dark:text-[#F5F3EE]"
              type="number"
              inputMode="numeric"
              min={minimum}
              max={available}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              aria-label="Amount"
            />
            <p className="mt-1 text-[11px] font-semibold text-[#5F6B76] dark:text-[#A8B3C0]">
              Platform fee already deducted · No extra fee
            </p>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[minimum, 500, 1000]
              .filter((n, i, list) => n <= available && list.indexOf(n) === i)
              .map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setAmount(String(n))}
                  className="h-8 rounded-full bg-[#E8EEF3] px-3 text-[11px] font-black text-[#163044] dark:bg-[#1B2430] dark:text-[#F5F3EE]"
                >
                  {formatPHP(n)}
                </button>
              ))}
            {available > 0 ? (
              <button
                type="button"
                onClick={() => setAmount(String(Math.floor(available)))}
                className="h-8 rounded-full bg-[#E8EEF3] px-3 text-[11px] font-black text-[#163044] dark:bg-[#1B2430] dark:text-[#F5F3EE]"
              >
                All
              </button>
            ) : null}
          </div>
          {tooLow ? <p className="mt-1 text-[11px] font-semibold text-[#B42318] dark:text-[#F59A9A]">The minimum is {formatPHP(minimum)}.</p> : null}
          {tooHigh ? <p className="mt-1 text-[11px] font-semibold text-[#B42318] dark:text-[#F59A9A]">You only have {formatPHP(available)}.</p> : null}
        </div>

        <div className="space-y-2.5">
          {method === "bank" ? (
            <Field label="Bank">
              <input className={inputClass} value={bank} onChange={(e) => setBank(e.target.value)} placeholder="e.g. BDO, BPI, Landbank" />
            </Field>
          ) : null}
          <div className="grid grid-cols-2 gap-2">
            <Field label="Account name">
              <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label={method === "bank" ? "Account number" : `${current.label} number`}>
              <input
                className={inputClass}
                inputMode="numeric"
                value={number}
                placeholder={current.hint}
                onChange={(e) => setNumber(e.target.value)}
              />
            </Field>
          </div>
        </div>

        <div>
          <Label>How it works</Label>
          <ol className="mt-1.5 flex items-start gap-2">
            {WITHDRAW_STEPS.map((step, i) => (
              <li key={step.title} className="flex min-w-0 flex-1 flex-col items-center text-center">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1F9D6A] text-[11px] font-black text-white">
                  {i + 1}
                </span>
                <p className="mt-1.5 text-[11px] font-black leading-tight text-[#163044] dark:text-[#F5F3EE]">{step.title}</p>
              </li>
            ))}
          </ol>
        </div>

        <InfoCallout>
          Minimum withdraw: {formatPHP(minimum)} · Earnings stay in Khaki Wallet until withdrawn.
        </InfoCallout>

        {error ? (
          <p className="rounded-xl bg-[#FDE3E3] px-3 py-2 text-xs font-semibold text-[#B42318] dark:bg-[#3A1D1D] dark:text-[#F59A9A]">
            {error}
          </p>
        ) : null}
      </div>
    </Sheet>
  );
}
