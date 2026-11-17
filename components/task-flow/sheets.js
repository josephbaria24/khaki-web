"use client";

import { useEffect, useState } from "react";
import ChatAvatar from "@/components/chat/Avatar";
import { formatPHP } from "@/lib/khaki";
import { acceptConfirmations, payoutBreakdown, priceRange } from "@/lib/taskFlow";
import { displayName } from "@/lib/taskerProfile";
import { Button, CheckRow, Field, InfoCallout, Label, PriceBreakdown, SecuredBanner, Sheet, Stars, inputClass, personBadges } from "@/components/task-flow/parts";

function useBusy() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const run = async (fn) => {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, run, setError };
}

function ErrorText({ children }) {
  if (!children) return null;
  return <p className="mt-3 rounded-xl bg-[#FDE3E3] px-3 py-2 text-xs font-semibold text-[#B42318] dark:bg-[#3A1D1D] dark:text-[#F59A9A]">{children}</p>;
}

export function AcceptTaskSheet({ open, task, rate, client, clientRating, onClose, onConfirm }) {
  const terms = acceptConfirmations(task);
  const [checks, setChecks] = useState(() => terms.map(() => false));
  const { busy, error, run } = useBusy();
  const range = priceRange(task);
  const split = payoutBreakdown(range.fixed, rate);
  const ready = checks.every(Boolean);
  const clientName = displayName(client?.full_name || task?.client_name);

  useEffect(() => {
    if (open) setChecks(acceptConfirmations(task).map(() => false));
  }, [open, task?.id]);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Accept Task — Fixed Price"
      subtitle={
        range.flexible
          ? `${task?.title} · ${formatPHP(range.fixed)} Fixed · within ${formatPHP(range.min)}–${formatPHP(range.max)}`
          : `${task?.title} · ${formatPHP(range.fixed)} Fixed`
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="green" disabled={!ready || busy} onClick={() => run(onConfirm)}>
            {busy ? "Accepting…" : `Confirm Accept at ${formatPHP(split.price)}`}
          </Button>
        </>
      }
    >
      <div className="space-y-3.5">
        <div className="rounded-2xl bg-[#F7F4EC] p-3.5 dark:bg-[#11141A]">
          <Label>Price breakdown</Label>
          <div className="mt-2">
            <PriceBreakdown {...split} payoutLabel="You will receive" />
          </div>
        </div>

        <SecuredBanner body="Payment is held securely until you complete the task and the client releases funds." />

        <div>
          <Label>Confirmations</Label>
          <div className="mt-1">
            {terms.map((term, i) => (
              <CheckRow key={term} checked={checks[i]} onChange={(value) => setChecks((list) => list.map((v, j) => (j === i ? value : v)))}>
                {term}
              </CheckRow>
            ))}
          </div>
        </div>

        {client || task?.client_name ? (
          <div>
            <Label>Client</Label>
            <div className="mt-2 flex items-center gap-3 rounded-2xl border border-[#E6DDD0] p-3 dark:border-white/10">
              <ChatAvatar name={clientName} src={client?.avatar_url || client?.profile_photo} size="sm" className="h-11 w-11 text-sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-black text-[#163044] dark:text-[#F5F3EE]">{clientName}</p>
                <p className="mt-0.5 text-[11px] font-semibold text-[#5F6B76] dark:text-[#A8B3C0]">
                  {clientRating?.count ? `★ ${clientRating.avg.toFixed(1)} · ${clientRating.count} reviews` : "Verified client"}
                </p>
                {personBadges(client).length ? (
                  <p className="mt-1 text-[10px] font-black text-[#0F6B6B] dark:text-[#7FD6CF]">
                    {personBadges(client).join(" · ")}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col items-center gap-1.5 pt-0.5">
          <div className="flex items-center gap-2 text-[11px] font-black">
            <span className="rounded-full bg-[#E7F1FA] px-2.5 py-1 text-[#5F6B76] line-through dark:bg-[#24303C] dark:text-[#A8B3C0]">Open</span>
            <span className="text-[#5F6B76]">→</span>
            <span className="rounded-full bg-[#1F9D6A] px-2.5 py-1 text-white">Assigned</span>
          </div>
          <p className="text-center text-[11px] font-semibold text-[#5F6B76] dark:text-[#A8B3C0]">Once you accept, the task is assigned to you.</p>
        </div>

        <InfoCallout>
          Once you accept, payment is held and no other Tasker can take this job. Complete the work and the client releases payment.
        </InfoCallout>

        <ErrorText>{error}</ErrorText>
      </div>
    </Sheet>
  );
}

export function ProposeSheet({ open, task, rate, mine, onClose, onSubmit }) {
  const range = priceRange(task);
  const [amount, setAmount] = useState("");
  const [pitch, setPitch] = useState("");
  const { busy, error, run, setError } = useBusy();

  useEffect(() => {
    if (!open) return;
    setAmount(String(mine?.amount_php || range.fixed));
    setPitch(mine?.pitch || "");
  }, [open]);

  const value = Number(amount);
  const inRange = value >= range.min && value <= range.max;
  const split = payoutBreakdown(inRange ? value : range.fixed, rate);

  const submit = () => {
    if (!inRange) {
      setError(`Pick an amount from ${formatPHP(range.min)} to ${formatPHP(range.max)}.`);
      return;
    }
    run(() => onSubmit({ amount: value, pitch }));
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={mine ? "Update your proposal" : "Propose a price"}
      subtitle={`The client accepts from ${formatPHP(range.min)} to ${formatPHP(range.max)}. They'll pick one proposal.`}
      footer={
        <>
          <Button variant="soft" onClick={onClose}>Cancel</Button>
          <Button disabled={busy} onClick={submit}>{busy ? "Sending…" : mine ? "Update" : "Send proposal"}</Button>
        </>
      }
    >
      <Field label="Your price (PHP)">
        <input
          className={inputClass}
          type="number"
          inputMode="numeric"
          min={range.min}
          max={range.max}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </Field>
      <input
        type="range"
        min={range.min}
        max={range.max}
        step={10}
        value={inRange ? value : range.fixed}
        onChange={(e) => setAmount(e.target.value)}
        className="mt-3 w-full accent-[#163044]"
        aria-label="Price"
      />
      <div className="mt-3">
        <Field label="Note to the client (optional)">
          <textarea
            className={`${inputClass} h-20 py-2`}
            value={pitch}
            onChange={(e) => setPitch(e.target.value)}
            placeholder="Why this price works"
          />
        </Field>
      </div>
      <div className="mt-3 rounded-2xl bg-[#F7F4EC] p-3.5 dark:bg-[#11141A]">
        <PriceBreakdown {...split} compact />
      </div>
      <ErrorText>{error}</ErrorText>
    </Sheet>
  );
}

export function RequestFixSheet({ open, onClose, onSubmit, used = 0 }) {
  const [note, setNote] = useState("");
  const { busy, error, run } = useBusy();

  useEffect(() => {
    if (open) setNote("");
  }, [open]);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Request a fix"
      subtitle={`The task goes back to the tasker and the auto-release timer stops. ${3 - used} of 3 fix requests left.`}
      footer={
        <>
          <Button variant="soft" onClick={onClose}>Cancel</Button>
          <Button disabled={busy || note.trim().length < 4} onClick={() => run(() => onSubmit(note.trim()))}>
            {busy ? "Sending…" : "Send request"}
          </Button>
        </>
      }
    >
      <Field label="What needs fixing?">
        <textarea className={`${inputClass} h-28 py-2`} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Be specific so the tasker can fix it fast" />
      </Field>
      <ErrorText>{error}</ErrorText>
    </Sheet>
  );
}

const DISPUTE_TYPES = [
  { id: "incomplete_work", label: "Work not finished" },
  { id: "item_damage", label: "Something got damaged" },
  { id: "wrong_item", label: "Wrong item or service" },
  { id: "other", label: "Something else" },
];

export function DisputeSheet({ open, onClose, onSubmit }) {
  const [type, setType] = useState("incomplete_work");
  const [description, setDescription] = useState("");
  const { busy, error, run } = useBusy();

  useEffect(() => {
    if (!open) return;
    setType("incomplete_work");
    setDescription("");
  }, [open]);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Open a dispute"
      subtitle="The payment stays held while an admin reviews both sides."
      footer={
        <>
          <Button variant="soft" onClick={onClose}>Cancel</Button>
          <Button variant="danger" disabled={busy || description.trim().length < 8} onClick={() => run(() => onSubmit({ type, description: description.trim() }))}>
            {busy ? "Sending…" : "Open dispute"}
          </Button>
        </>
      }
    >
      <Label>What happened?</Label>
      <div className="mt-1.5 grid grid-cols-2 gap-1.5">
        {DISPUTE_TYPES.map((row) => (
          <button
            key={row.id}
            type="button"
            onClick={() => setType(row.id)}
            className={`rounded-xl border px-2.5 py-2 text-left text-[12px] font-black ${
              type === row.id
                ? "border-[#163044] bg-[#163044] text-[#F7F4EC] dark:border-[#F5F3EE] dark:bg-[#F5F3EE] dark:text-[#11141A]"
                : "border-[#E6DDD0] bg-white text-[#163044] dark:border-white/10 dark:bg-transparent dark:text-[#F5F3EE]"
            }`}
          >
            {row.label}
          </button>
        ))}
      </div>
      <div className="mt-3">
        <Field label="Details">
          <textarea className={`${inputClass} h-24 py-2`} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="At least a sentence so the admin understands" />
        </Field>
      </div>
      <ErrorText>{error}</ErrorText>
    </Sheet>
  );
}

export function ReleaseSheet({ open, taskerName, amount, onClose, onConfirm }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const { busy, error, run } = useBusy();

  useEffect(() => {
    if (!open) return;
    setRating(5);
    setComment("");
  }, [open]);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Confirm & release"
      subtitle={`Khaki sends ${formatPHP(amount)} to ${taskerName || "your tasker"}. This can't be undone.`}
      footer={
        <>
          <Button variant="soft" onClick={onClose}>Cancel</Button>
          <Button variant="green" disabled={busy} onClick={() => run(() => onConfirm({ rating, comment: comment.trim() }))}>
            {busy ? "Releasing…" : "Release payment"}
          </Button>
        </>
      }
    >
      <Label>Rate {taskerName || "the tasker"}</Label>
      <div className="mt-2">
        <Stars value={rating} onChange={setRating} />
      </div>
      <div className="mt-3">
        <Field label="Comment (optional)">
          <textarea className={`${inputClass} h-20 py-2`} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="How did it go?" />
        </Field>
      </div>
      <ErrorText>{error}</ErrorText>
    </Sheet>
  );
}
