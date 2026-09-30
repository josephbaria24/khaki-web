import { STATUS_CONFIG } from "@/lib/khaki";

const OUTLINE = {
  open: "border-status-open text-status-open",
  offer_accepted: "border-emerald-600 text-emerald-700",
  escrow_locked: "border-blue-600 text-blue-700",
  in_progress: "border-status-progress text-status-progress",
  completed_pending_review: "border-purple-500 text-purple-700",
  disputed: "border-amber-600 text-amber-700",
  released: "border-status-done text-status-done",
  cancelled: "border-destructive text-destructive",
};

function StatusMark({ status }) {
  const common = {
    viewBox: "0 0 16 16",
    className: "h-3 w-3 shrink-0",
    fill: "none",
    "aria-hidden": true,
  };
  if (status === "released") {
    return (
      <svg {...common}>
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.6" />
        <path d="M5 8.2 7 10.2 11 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (status === "cancelled" || status === "disputed") {
    return (
      <svg {...common}>
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.6" />
        <path d="M8 5v3.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="8" cy="11" r="0.7" fill="currentColor" />
      </svg>
    );
  }
  if (status === "in_progress" || status === "offer_accepted" || status === "completed_pending_review") {
    return (
      <svg {...common}>
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.6" />
        <path d="M8 5.2V8l2 1.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (status === "escrow_locked") {
    return (
      <svg {...common}>
        <rect x="4" y="7" width="8" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M6 7V5.5a2 2 0 0 1 4 0V7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="8" cy="8" r="2.2" fill="currentColor" />
    </svg>
  );
}

export default function StatusPill({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.open;
  const outline = OUTLINE[status] || OUTLINE.open;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border bg-transparent px-2 py-0.5 text-[11px] font-bold ${outline}`}>
      <StatusMark status={OUTLINE[status] ? status : "open"} />
      {cfg.label}
    </span>
  );
}
