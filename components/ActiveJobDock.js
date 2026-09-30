"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn, displayTaskCategory, formatPHP, STATUS_CONFIG, timeAgo } from "@/lib/khaki";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/store";

const RANK = {
  in_progress: 0,
  offer_accepted: 1,
  escrow_locked: 2,
  disputed: 3,
  completed_pending_review: 4,
  open: 5,
};

const BID_LABEL = {
  pending: "Pending",
  accepted: "Accepted",
  declined: "Declined",
};

function pickActive(tasks, userId, myOffers) {
  if (!userId) return null;
  const bidIds = new Set((myOffers || []).filter((o) => o.status === "pending").map((o) => o.task_id));
  const rows = (tasks || []).filter((task) => {
    if (!(task.status in RANK)) return false;
    if (task.client_id === userId || task.accepted_tasker_id === userId) return true;
    return bidIds.has(task.id) && task.status === "open";
  });
  rows.sort((a, b) => {
    const rank = (RANK[a.status] ?? 9) - (RANK[b.status] ?? 9);
    if (rank) return rank;
    return new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0);
  });
  return rows[0] || null;
}

export default function ActiveJobDock() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [myOffers, setMyOffers] = useState([]);
  const [open, setOpen] = useState(false);
  const [bids, setBids] = useState([]);
  const [updates, setUpdates] = useState([]);
  const dockRef = useRef(null);
  const dragRef = useRef(null);
  const offsetRef = useRef({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const place = (next) => {
    offsetRef.current = next;
    setOffset(next);
  };

  const clamp = (x, y) => {
    const node = dockRef.current;
    if (!node || typeof window === "undefined") return { x, y };
    const rect = node.getBoundingClientRect();
    const baseLeft = rect.left - offsetRef.current.x;
    const baseTop = rect.top - offsetRef.current.y;
    const minX = 8 - baseLeft;
    const maxX = window.innerWidth - 8 - rect.width - baseLeft;
    const minY = 8 - baseTop;
    const maxY = window.innerHeight - 8 - rect.height - baseTop;
    return {
      x: Math.min(maxX, Math.max(minX, x)),
      y: Math.min(maxY, Math.max(minY, y)),
    };
  };

  const onPointerDown = (event) => {
    if (event.button != null && event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      id: event.pointerId,
      sx: event.clientX,
      sy: event.clientY,
      ox: offsetRef.current.x,
      oy: offsetRef.current.y,
      moved: false,
    };
  };

  const onPointerMove = (event) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    const dx = event.clientX - drag.sx;
    const dy = event.clientY - drag.sy;
    if (Math.hypot(dx, dy) > 5) drag.moved = true;
    place(clamp(drag.ox + dx, drag.oy + dy));
  };

  const onPointerUp = (event) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    dragRef.current = null;
    if (!drag.moved) setOpen((value) => !value);
  };

  const hidden = pathname.startsWith("/task/") || pathname.startsWith("/chat");

  useEffect(() => {
    if (!user || hidden) return undefined;
    const stop = api.tasks.subscribeMine(setTasks);
    api.offers.listMine().then(setMyOffers).catch(() => setMyOffers([]));
    return stop;
  }, [user, hidden]);

  const task = useMemo(() => pickActive(tasks, user?.id, myOffers), [tasks, user?.id, myOffers]);

  useEffect(() => {
    setOpen(false);
  }, [pathname, task?.id]);

  useEffect(() => {
    if (!task?.id || hidden) return undefined;
    let live = true;
    Promise.all([
      api.offers.listByTask(task.id).catch(() => []),
      api.messages.listByTask(task.id).catch(() => []),
    ]).then(([offerRows, messages]) => {
      if (!live) return;
      setBids(offerRows);
      setUpdates([...messages].slice(-4).reverse());
    });
    return () => {
      live = false;
    };
  }, [task?.id, hidden]);

  if (!user || hidden || !task) return null;

  const status = STATUS_CONFIG[task.status]?.label || task.status;

  return (
    <>
      {open && typeof document !== "undefined"
        ? createPortal(
            <button
              type="button"
              aria-label="Close job details"
              className="fixed inset-0 z-30 border-0 bg-[#163044]/30"
              onClick={() => setOpen(false)}
            />,
            document.body
          )
        : null}
    <div
      ref={dockRef}
      className="pointer-events-auto absolute bottom-[calc(100%+10px)] right-1 z-30 flex w-max max-w-[min(100%,320px)] flex-col items-end"
      style={{ transform: `translate3d(${offset.x}px, ${offset.y}px, 0)` }}
    >
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
          open ? "w-[min(78vw,320px)] grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
          <div className="overflow-hidden">
            <div className="mb-2 max-h-[min(46vh,300px)] overflow-y-auto rounded-[1.35rem] bg-white p-4 shadow-[0_16px_40px_rgba(42,63,77,0.16)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#3D5C6E]">
                {displayTaskCategory(task)}
              </p>
              <p className="mt-1 text-base font-black leading-snug text-[#2A3F4D]">{task.title}</p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="rounded-full bg-[#E8F6F4] px-2.5 py-1 text-[10px] font-bold text-[#0D666A]">{status}</span>
                <span className="text-sm font-black text-[#2A3F4D]">{formatPHP(task.budget_php)}</span>
              </div>

              <p className="mt-4 text-[11px] font-bold uppercase tracking-wide text-[#2A3F4D]/45">Bids</p>
              {bids.length === 0 ? (
                <p className="mt-1 text-xs text-[#2A3F4D]/55">Walang bid pa.</p>
              ) : (
                <ul className="mt-1 space-y-1.5">
                  {bids.slice(0, 4).map((bid) => (
                    <li key={bid.id} className="flex items-center justify-between gap-2 rounded-xl bg-[#FBF8F1] px-3 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-[#2A3F4D]">{bid.tasker_name || "Tasker"}</p>
                        <p className="truncate text-[11px] text-[#2A3F4D]/55">{bid.pitch || BID_LABEL[bid.status] || bid.status}</p>
                      </div>
                      <p className="shrink-0 text-xs font-black text-[#3D5C6E]">{formatPHP(bid.amount_php)}</p>
                    </li>
                  ))}
                </ul>
              )}

              <p className="mt-4 text-[11px] font-bold uppercase tracking-wide text-[#2A3F4D]/45">Updates</p>
              {updates.length === 0 ? (
                <p className="mt-1 text-xs text-[#2A3F4D]/55">Wala pang update.</p>
              ) : (
                <ul className="mt-1 space-y-1.5">
                  {updates.map((msg) => (
                    <li key={msg.id} className="rounded-xl bg-[#FBF8F1] px-3 py-2">
                      <p className="line-clamp-2 text-xs text-[#2A3F4D]">{msg.text}</p>
                      <p className="mt-1 text-[10px] font-semibold text-[#2A3F4D]/45">
                        {msg.sender_name || "Update"} · {timeAgo(msg.created_at)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}

              <Link
                href={`/task/${task.id}`}
                className="mt-4 flex h-10 items-center justify-center rounded-full bg-[#3D5C6E] text-xs font-bold text-[#F7F4EC]"
              >
                Tingnan ang buong detalye
              </Link>
            </div>
          </div>
        </div>

        <button
          type="button"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          aria-expanded={open}
          className="relative flex h-10 max-w-[240px] cursor-grab touch-none items-center gap-2 rounded-full bg-[#2A3F4D] px-3 text-left text-[#F7F4EC] shadow-[0_10px_24px_rgba(42,63,77,0.28)] active:cursor-grabbing"
        >
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="active-job-pulse absolute inset-0 rounded-full bg-[#3DDC97]" />
            <span className="relative h-2.5 w-2.5 rounded-full bg-[#3DDC97]" />
          </span>
          <span className="min-w-0 flex-1 truncate text-xs font-bold">{task.title}</span>
          {bids.length > 0 ? (
            <span className="shrink-0 rounded-full bg-white/15 px-1.5 text-[10px] font-bold">{bids.length}</span>
          ) : null}
        </button>
    </div>
    </>
  );
}
