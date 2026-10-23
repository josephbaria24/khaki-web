"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabase";

const PORTALS = [
  { id: "marketing", label: "Marketing" },
  { id: "accounting", label: "Accounting" },
  { id: "it", label: "IT" },
  { id: "investor", label: "Investor" },
];

const EASE = "duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]";

export default function CreateStaffAccount({ onClose, onCreated }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [portal, setPortal] = useState("marketing");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    let frame2 = 0;
    const frame1 = window.requestAnimationFrame(() => {
      frame2 = window.requestAnimationFrame(() => setOpen(true));
    });
    return () => {
      window.cancelAnimationFrame(frame1);
      window.cancelAnimationFrame(frame2);
    };
  }, []);

  const requestClose = () => {
    if (busy) return;
    setOpen(false);
    window.setTimeout(() => onClose?.(), 280);
  };

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event) => {
      if (event.key === "Escape" && !busy) {
        setOpen(false);
        window.setTimeout(() => onClose?.(), 280);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [busy, onClose]);

  const submit = async (event) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Login required.");
      const response = await fetch("/api/admin/staff", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: fullName,
          email,
          password,
          portal,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not create the account.");
      onCreated?.(payload.account);
      setOpen(false);
      window.setTimeout(() => onClose?.(), 280);
    } catch (err) {
      setError(err.message || "Could not create the account.");
    } finally {
      setBusy(false);
    }
  };

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center" role="presentation">
      <button
        type="button"
        aria-label="Close"
        className={`absolute inset-0 bg-[#163044]/45 backdrop-blur-[2px] transition-opacity ${EASE} ${open ? "opacity-100" : "opacity-0"}`}
        onClick={requestClose}
      />
      <form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-staff-title"
        className={`relative z-[1] max-h-[min(100%,40rem)] w-full max-w-lg overflow-y-auto rounded-[1.5rem] border border-[#163044]/10 bg-card p-5 shadow-[0_24px_60px_rgba(22,48,68,0.28)] transition-[opacity,transform] ${EASE} dark:border-white/10 ${
          open ? "translate-y-0 scale-100 opacity-100" : "translate-y-5 scale-[0.96] opacity-0"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="create-staff-title" className="text-lg font-black">New staff account</h2>
            <p className="text-xs text-muted-foreground">They sign in with this email and open only their portal.</p>
          </div>
          <button type="button" onClick={requestClose} className="text-sm font-bold text-muted-foreground">Close</button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-bold">
            Name
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
              className="mt-1 h-11 w-full rounded-xl border border-[#163044]/10 bg-[#FBF8F1] px-3 text-sm font-semibold dark:border-white/10 dark:bg-[#11141A]"
            />
          </label>
          <label className="block text-sm font-bold">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="off"
              className="mt-1 h-11 w-full rounded-xl border border-[#163044]/10 bg-[#FBF8F1] px-3 text-sm font-semibold dark:border-white/10 dark:bg-[#11141A]"
            />
          </label>
          <label className="block text-sm font-bold">
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="mt-1 h-11 w-full rounded-xl border border-[#163044]/10 bg-[#FBF8F1] px-3 text-sm font-semibold dark:border-white/10 dark:bg-[#11141A]"
            />
          </label>
          <label className="block text-sm font-bold">
            Portal
            <select
              value={portal}
              onChange={(event) => setPortal(event.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-[#163044]/10 bg-[#FBF8F1] px-3 text-sm font-semibold dark:border-white/10 dark:bg-[#11141A]"
            >
              {PORTALS.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </label>
        </div>
        {error ? <p className="mt-3 text-sm font-semibold text-destructive">{error}</p> : null}
        <button
          type="submit"
          disabled={busy}
          className="mt-4 h-11 rounded-full bg-[#163044] px-5 text-sm font-black text-[#F7F4EC] disabled:opacity-60"
        >
          {busy ? "Creating…" : "Create account"}
        </button>
      </form>
    </div>,
    document.body
  );
}
