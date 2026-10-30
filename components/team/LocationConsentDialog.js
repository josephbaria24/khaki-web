"use client";

import { useState } from "react";

export default function LocationConsentDialog({ open, onAccept, onDecline }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!open) return null;

  const accept = async () => {
    setBusy(true);
    setError("");
    try {
      await onAccept?.();
    } catch (err) {
      setError(err?.message || "Could not save location consent.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-[#163044]/45 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="loc-consent-title">
      <div className="w-full max-w-sm overflow-hidden rounded-[1.75rem] bg-[#FFFCF7] text-center shadow-[0_24px_60px_rgba(22,48,68,0.28)] dark:bg-[#1A1E27]">
        <div className="bg-[#E7F6F1] px-6 pb-2 pt-5 dark:bg-[#163044]">
          <img
            src="/images/Smartphone%20map%2C%20pin%2C%20and%20shield.png"
            alt=""
            className="mx-auto h-40 w-full object-contain"
          />
        </div>
        <div className="px-5 pb-5 pt-4">
          <h2 id="loc-consent-title" className="text-xl font-black text-[#163044] dark:text-[#F5F3EE]">
            Share your location?
          </h2>
          <p className="mx-auto mt-2 max-w-[18rem] text-sm font-semibold leading-snug text-[#163044]/70 dark:text-[#F5F3EE]/70">
            Your team and customer see your last pin while you're on a job.
          </p>
          {error ? <p className="mt-3 text-sm font-semibold text-[#B42318]">{error}</p> : null}
          <button
            type="button"
            disabled={busy}
            onClick={accept}
            className="mt-5 flex h-11 w-full items-center justify-center rounded-full bg-[#163044] text-sm font-black text-white disabled:opacity-60"
          >
            {busy ? "Saving…" : "Allow"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onDecline}
            className="mt-2 flex h-11 w-full items-center justify-center rounded-full text-sm font-bold text-[#163044]/70 disabled:opacity-60 dark:text-[#F5F3EE]/70"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
