"use client";

import { useRef, useState } from "react";

const REVEAL = 88;
const THRESHOLD = 8;

export default function SwipeToDelete({ disabled = false, onDelete, children, className = "" }) {
  const startRef = useRef(null);
  const offsetRef = useRef(0);
  const [offset, setOffset] = useState(0);
  const [open, setOpen] = useState(false);

  const applyOffset = (next) => {
    offsetRef.current = next;
    setOffset(next);
  };

  if (disabled) return <div className={className}>{children}</div>;

  const onPointerDown = (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    // Don't capture yet — a plain tap must still fire the card expand click.
    startRef.current = {
      x: event.clientX,
      y: event.clientY,
      origin: open ? -REVEAL : offsetRef.current,
      dragging: false,
      pointerId: event.pointerId,
    };
  };

  const onPointerMove = (event) => {
    if (!startRef.current) return;
    const dx = event.clientX - startRef.current.x;
    const dy = event.clientY - startRef.current.y;

    if (!startRef.current.dragging) {
      if (Math.abs(dx) < THRESHOLD && Math.abs(dy) < THRESHOLD) return;
      if (Math.abs(dy) >= Math.abs(dx)) {
        startRef.current = null;
        return;
      }
      startRef.current.dragging = true;
      event.currentTarget.setPointerCapture?.(event.pointerId);
    }

    const next = Math.max(-REVEAL, Math.min(0, startRef.current.origin + dx));
    applyOffset(next);
  };

  const endGesture = (target) => {
    const start = startRef.current;
    startRef.current = null;
    if (!start) return;
    if (start.dragging && target?.hasPointerCapture?.(start.pointerId)) {
      target.releasePointerCapture?.(start.pointerId);
    }
    if (!start.dragging) return;
    const shouldOpen = offsetRef.current < -REVEAL * 0.45;
    setOpen(shouldOpen);
    applyOffset(shouldOpen ? -REVEAL : 0);
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl ${className}`}>
      <button
        type="button"
        onClick={() => {
          setOpen(false);
          applyOffset(0);
          onDelete?.();
        }}
        className="absolute inset-y-0 right-0 flex w-[88px] items-center justify-center bg-[#B42318] text-xs font-black uppercase tracking-[0.08em] text-white"
      >
        Delete
      </button>
      <div
        className="relative touch-pan-y bg-transparent transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ transform: `translateX(${offset}px)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(event) => endGesture(event.currentTarget)}
        onPointerCancel={(event) => endGesture(event.currentTarget)}
      >
        {children}
      </div>
    </div>
  );
}
