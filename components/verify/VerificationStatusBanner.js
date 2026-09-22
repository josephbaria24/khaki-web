const TEAL = "#0D666A";

export function verificationStatusCopy(user) {
  const status = user?.verification_status || "unverified";
  const rejected = status === "unverified" && Boolean(user?.verification_note);
  if (status === "verified") {
    return {
      key: "verified",
      label: "Approved",
      detail: "Your account is verified. You can post gawain and accept jobs.",
      tone: "ok",
    };
  }
  if (status === "pending") {
    return {
      key: "pending",
      label: "Pending review",
      detail: "Admin is checking your application. You’ll get a notice when they decide.",
      tone: "wait",
    };
  }
  if (rejected) {
    return {
      key: "rejected",
      label: "Rejected",
      detail: user.verification_note || "Please update your application and submit again.",
      tone: "warn",
    };
  }
  return {
    key: "unverified",
    label: "Not submitted",
    detail: "Fill out the form below to send your application.",
    tone: "idle",
  };
}

export default function VerificationStatusBanner({ user }) {
  const copy = verificationStatusCopy(user);
  const palette = {
    ok: { bg: "#D7F0EA", fg: TEAL, ring: "#0D666A33" },
    wait: { bg: "#FEF3C7", fg: "#92400E", ring: "#D9770633" },
    warn: { bg: "#FEE2E2", fg: "#991B1B", ring: "#DC262633" },
    idle: { bg: "#FFFCF7", fg: TEAL, ring: "#0D666A22" },
  }[copy.tone];

  return (
    <div
      className="mt-5 rounded-2xl px-4 py-3.5 shadow-card sm:px-5"
      style={{ background: palette.bg, color: palette.fg, boxShadow: `inset 0 0 0 1px ${palette.ring}` }}
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.16em]">Application status</p>
      <p className="mt-1 text-xl font-black tracking-tight">{copy.label}</p>
      <p className="mt-1 text-sm font-medium leading-relaxed opacity-90">{copy.detail}</p>
    </div>
  );
}
