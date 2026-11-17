import { ESCROW_PLATFORM_RATE, escrowSplit, scheduleLabel, serviceForTask } from "@/lib/khaki";
import { describeExtras } from "@/lib/serviceTemplates";

export const DEFAULT_FLOW_SETTINGS = {
  tasker_fee_rate: ESCROW_PLATFORM_RATE,
  auto_release_hours: 48,
  withdraw_min_php: 100,
};

const DEFAULT_CHECKLISTS = {
  transport: ["Confirm pickup point", "Pick up", "On the way", "Drop off"],
  tourism: ["Confirm meeting point", "Meet the guest", "Run the tour", "Return safely"],
  repair: ["Inspect the problem", "Do the repair", "Test that it works", "Clean the work area"],
  cleaning: ["Walk through the space", "Deep clean", "Final check with client", "Take out the trash"],
  digital: ["Confirm the brief", "First draft", "Revisions", "Send final files"],
  salon: ["Set up the station", "Do the service", "Clean up"],
  pets: ["Meet the pet", "Feed and care", "Walk or play", "Send an update"],
  other: ["Confirm the details", "Do the errand", "Send proof"],
};

export const FLOW_STEPS = [
  { key: "open", label: "Open" },
  { key: "assigned", label: "Assigned" },
  { key: "in_progress", label: "In progress" },
  { key: "review", label: "Completed" },
  { key: "paid", label: "Paid" },
];

export function flowSettings(raw) {
  const out = { ...DEFAULT_FLOW_SETTINGS };
  for (const key of Object.keys(out)) {
    const n = Number(raw?.[key]);
    if (Number.isFinite(n) && n >= 0) out[key] = n;
  }
  return out;
}

export function priceRange(task) {
  const budget = Number(task?.budget_php || 0);
  const min = Number(task?.extras?.price_range?.min);
  const max = Number(task?.extras?.price_range?.max);
  const lo = Number.isFinite(min) && min > 0 ? min : budget;
  const hi = Number.isFinite(max) && max >= lo ? max : budget;
  return { min: lo, max: Math.max(hi, budget), fixed: budget, flexible: hi > lo };
}

// Returns { range } to save, null when it adds nothing, or { error }.
export function cleanPriceRange(raw, budget) {
  const price = Number(budget || 0);
  const min = raw?.min === "" || raw?.min == null ? price : Number(raw.min);
  const max = raw?.max === "" || raw?.max == null ? price : Number(raw.max);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return { error: "Enter numbers for the price range." };
  if (min > price) return { error: "The range has to start at or below your price." };
  if (max < price) return { error: "The range has to end at or above your price." };
  if (min < 15) return { error: "The range starts at ₱15." };
  if (min === price && max === price) return null;
  return { range: { min: Math.round(min), max: Math.round(max) } };
}

export function taskChecklist(task) {
  const own = Array.isArray(task?.extras?.checklist)
    ? task.extras.checklist.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
  if (own.length) return own;
  return DEFAULT_CHECKLISTS[serviceForTask(task)?.key] || DEFAULT_CHECKLISTS.other;
}

export function checklistDone(task) {
  return task?.extras?.progress?.checklist || {};
}

export function flowStage(task, hold) {
  const status = task?.status;
  if (status === "open") return "open";
  if (status === "cancelled") return "cancelled";
  if (status === "offer_accepted" || status === "escrow_locked") {
    return hold?.status === "locked" ? "assigned" : "awaiting_payment";
  }
  if (status === "in_progress") return "in_progress";
  if (status === "completed_pending_review") return "review";
  if (status === "disputed") return "disputed";
  if (status === "released") return "paid";
  return "open";
}

export function stepIndex(stage) {
  if (stage === "awaiting_payment" || stage === "assigned") return 1;
  if (stage === "in_progress") return 2;
  if (stage === "review" || stage === "disputed") return 3;
  if (stage === "paid") return 4;
  return 0;
}

export function timelineSteps(task, hold) {
  const stage = flowStage(task, hold);
  const at = stepIndex(stage);
  const times = task?.extras?.progress?.times || {};
  const stamps = [task?.created_at, times.accepted, times.preparing, times.delivered, times.released || hold?.released_at];
  return FLOW_STEPS.map((step, i) => ({
    ...step,
    at: stamps[i] || null,
    state: i < at || (i === at && stage === "paid") ? "done" : i === at ? "current" : "todo",
  }));
}

export function autoReleaseAt(task) {
  const raw = task?.extras?.progress?.auto_release_at;
  if (!raw) return null;
  const t = new Date(raw).getTime();
  return Number.isFinite(t) ? t : null;
}

export function countdownLabel(ms) {
  if (ms == null) return "";
  if (ms <= 0) return "Releasing now";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${Math.max(1, m)}m`;
}

export function payoutBreakdown(amount, rate = ESCROW_PLATFORM_RATE, hold = null) {
  const split = escrowSplit(amount, rate);
  return {
    price: hold?.amount_held != null ? Number(hold.amount_held) : split.total,
    fee: hold?.platform_fee != null ? Number(hold.platform_fee) : split.platform,
    payout: hold?.tasker_payout != null ? Number(hold.tasker_payout) : split.payout,
    rate,
  };
}

export function feePercent(rate) {
  const pct = Number(rate || 0) * 100;
  return `${Number.isInteger(pct) ? pct : pct.toFixed(1)}%`;
}

export function shortStamp(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";
  if (date.toDateString() === new Date().toDateString()) {
    return date.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit", hour12: true });
  }
  return date.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

export function approximateArea(task) {
  if (task?.is_remote) return "Remote";
  return [task?.barangay, task?.location_area].filter(Boolean).join(", ") || "Palawan";
}

/** Compact key/value rows for the Open task hero (schedule + extras). */
export function openDetailRows(task, extras) {
  const rows = [];
  const schedule = scheduleLabel(task);
  if (schedule) rows.push({ label: "Date", value: schedule });
  if (task?.schedule_time) rows.push({ label: "Time", value: String(task.schedule_time) });
  for (const row of extras || []) {
    if (rows.length >= 6) break;
    if (!row?.label || !row?.value) continue;
    if (/location|address|pin/i.test(row.label)) continue;
    rows.push({ label: row.label, value: row.value });
  }
  return rows;
}

/** Three confirmations for AcceptTaskSheet, tailored to the task when possible. */
export function acceptConfirmations(task) {
  const terms = [];
  const schedule = scheduleLabel(task);
  const time = task?.schedule_time ? String(task.schedule_time) : "";
  if (time) terms.push(`I will arrive at ${time}.`);
  else if (schedule && schedule !== "Flexible") terms.push(`I can do this on the posted schedule (${schedule}).`);
  else terms.push("I can do this task on the posted schedule.");

  const extras = describeExtras(task);
  const supplies = extras.find((row) => /supplies|bring|tools|kit/i.test(row.label));
  if (supplies) terms.push(`I understand supplies: ${supplies.value}.`);
  else terms.push("I'll bring what I need, or confirm supplies with the client.");

  terms.push("I'll complete all listed tasks and upload before & after photos.");
  return terms.slice(0, 3);
}
