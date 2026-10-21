"use client";

import { useState } from "react";

export default function LocationConsentDialog({ open, onAccept, onDecline }) {
  const [busy, setBusy] = useState(false);
  if (!open) return null;

  const accept = async () => {
    setBusy(true);
    try {
      await onAccept?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-[#163044]/45 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="loc-consent-title">
      <div className="w-full max-w-md rounded-[1.5rem] bg-[#FFFCF7] p-5 shadow-[0_24px_60px_rgba(22,48,68,0.28)] dark:bg-[#1A1E27]">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#163044]/50 dark:text-[#F5F3EE]/50">
          Data Privacy Act (RA 10173)
        </p>
        <h2 id="loc-consent-title" className="mt-1 text-xl font-black text-[#163044] dark:text-[#F5F3EE]">
          Share your location?
        </h2>
        <p className="mt-3 text-sm font-semibold leading-relaxed text-[#163044]/75 dark:text-[#F5F3EE]/70">
          While you are Online or on a job, Khaki can send your last known pin to your team lead and to the customer on that job.
          Sharing stops when you go Offline. The app never claims “live GPS” — only “last seen”.
        </p>
        <ul className="mt-3 space-y-1.5 text-sm font-semibold text-[#163044]/70 dark:text-[#F5F3EE]/65">
          <li>· Your lead sees you on the team map.</li>
          <li>· Your current customer sees you on job tracking.</li>
          <li>· You can turn this off anytime from Profile / Team.</li>
        </ul>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            disabled={busy}
            onClick={accept}
            className="flex h-11 flex-1 items-center justify-center rounded-xl bg-[#163044] text-sm font-black text-white disabled:opacity-60"
          >
            {busy ? "Saving…" : "Allow location sharing"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onDecline}
            className="flex h-11 flex-1 items-center justify-center rounded-xl border border-[#E6DDD0] text-sm font-bold text-[#163044] dark:border-white/15 dark:text-[#F5F3EE]"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
