"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const THUMB = 44;

export default function DeleteUserConfirm({ user, busy = false, onCancel, onConfirm }) {
  const trackRef = useRef(null);
  const dragRef = useRef(null);
  const xRef = useRef(0);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [x, setX] = useState(0);
  const [max, setMax] = useState(180);
  const [done, setDone] = useState(false);

  const setThumb = (value) => {
    xRef.current = value;
    setX(value);
  };

  useEffect(() => {
    setMounted(true);
    const frame = requestAnimationFrame(() => setOpen(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const measure = () => {
      const width = trackRef.current?.clientWidth || 220;
      setMax(Math.max(80, width - THUMB - 8));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event) => {
      if (event.key === "Escape" && !busy) onCancel?.();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [busy, onCancel]);

  const reset = () => {
    setThumb(0);
    setDone(false);
  };

  const finishIfReady = (nextX) => {
    if (nextX >= max * 0.92) {
      setThumb(max);
      setDone(true);
      onConfirm?.();
      return;
    }
    setThumb(0);
    setDone(false);
  };

  const onPointerDown = (event) => {
    if (busy || done) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragRef.current = { startX: event.clientX, origin: xRef.current };
  };

  const onPointerMove = (event) => {
    if (!dragRef.current || busy) return;
    const delta = event.clientX - dragRef.current.startX;
    setThumb(Math.max(0, Math.min(max, dragRef.current.origin + delta)));
  };

  const onPointerUp = () => {
    if (!dragRef.current || busy) return;
    dragRef.current = null;
    finishIfReady(xRef.current);
  };

  if (!mounted || typeof document === "undefined") return null;

  const name = user?.full_name || "this user";
  const progress = max ? x / max : 0;

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center p-4 sm:items-center" role="presentation">
      <button
        type="button"
        aria-label="Close"
        className={`absolute inset-0 bg-[#163044]/45 backdrop-blur-[2px] transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
        onClick={() => !busy && onCancel?.()}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-user-title"
        className={`relative z-[1] w-full max-w-md overflow-hidden rounded-[1.75rem] border border-white/40 bg-[#FBF8F1] p-5 shadow-[0_24px_60px_rgba(22,48,68,0.28)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] dark:border-white/10 dark:bg-[#151922] ${
          open ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#B42318]">Permanent delete</p>
        <h2 id="delete-user-title" className="mt-1 text-xl font-black text-[#163044] dark:text-[#F7F4EC]">
          Delete {name}?
        </h2>
        <p className="mt-2 text-sm font-semibold leading-relaxed text-[#163044]/70 dark:text-[#F7F4EC]/65">
          This removes their account, verification, and sign-in. It cannot be undone.
        </p>
        {user?.email ? (
          <p className="mt-2 truncate rounded-xl bg-[#FEE2E2] px-3 py-2 text-xs font-bold text-[#991B1B]">{user.email}</p>
        ) : null}

        <div className="mt-5">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#163044]/45">Slide to delete</p>
          <div
            ref={trackRef}
            className="relative h-14 overflow-hidden rounded-2xl bg-[#F4C7C2]"
            style={{ background: `linear-gradient(90deg, #F87171 ${progress * 100}%, #F4C7C2 ${progress * 100}%)` }}
          >
            <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs font-black uppercase tracking-[0.14em] text-[#7F1D1D]/70">
              {busy ? "Deleting…" : done ? "Deleting…" : "Slide to delete"}
            </p>
            <button
              type="button"
              aria-label="Slide to delete"
              disabled={busy}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={() => {
                dragRef.current = null;
                reset();
              }}
              className="absolute top-1.5 flex h-11 w-11 touch-none items-center justify-center rounded-xl bg-[#B42318] text-white shadow-md transition-[box-shadow] active:shadow-lg disabled:opacity-70"
              style={{ left: 6 + x }}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={() => {
            reset();
            onCancel?.();
          }}
          className="mt-4 h-11 w-full rounded-2xl border border-[#163044]/12 bg-white text-sm font-black text-[#163044] disabled:opacity-60 dark:bg-[#1A1E27] dark:text-[#F7F4EC]"
        >
          Cancel
        </button>
      </div>
    </div>,
    document.body
  );
}
