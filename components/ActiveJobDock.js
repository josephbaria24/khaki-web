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
  /** In DOM while opening/open/closing */
  const [panelShown, setPanelShown] = useState(false);
  /** True only after mount paint so CSS transition always runs */
  const [panelActive, setPanelActive] = useState(false);
  const [bids, setBids] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [tablet, setTablet] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dockRef = useRef(null);
  const dragRef = useRef(null);
  const offsetRef = useRef({ x: 0, y: 0 });
  const animTimers = useRef({ leave: null, raf1: 0, raf2: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => {
      const next = mq.matches;
      setTablet(next);
      // Reset drag offset when crossing breakpoints so default tablet corner sticks.
      offsetRef.current = { x: 0, y: 0 };
      setOffset({ x: 0, y: 0 });
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const timers = animTimers.current;
    if (timers.leave) {
      clearTimeout(timers.leave);
      timers.leave = null;
    }
    cancelAnimationFrame(timers.raf1);
    cancelAnimationFrame(timers.raf2);

    if (open) {
      setPanelShown(true);
      setPanelActive(false);
      // Double rAF: first paint closed, second frame apply open styles → transition fires.
      timers.raf1 = requestAnimationFrame(() => {
        timers.raf2 = requestAnimationFrame(() => setPanelActive(true));
      });
      return () => {
        cancelAnimationFrame(timers.raf1);
        cancelAnimationFrame(timers.raf2);
      };
    }

    setPanelActive(false);
    timers.leave = setTimeout(() => {
      setPanelShown(false);
      timers.leave = null;
    }, 340);
    return () => {
      if (timers.leave) clearTimeout(timers.leave);
    };
  }, [open]);

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
  const ease = "duration-[340ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none";

  const dock = (
    <div
      ref={dockRef}
      className={cn(
        "pointer-events-auto z-30 flex w-max max-w-[min(100%,320px)] flex-col items-end",
        tablet
          ? "fixed bottom-5 right-5 z-50 md:bottom-6 md:right-6"
          : "absolute bottom-[calc(100%+10px)] right-1"
      )}
      style={{ transform: `translate3d(${offset.x}px, ${offset.y}px, 0)` }}
    >
      <div
        className={cn(
          "grid w-[min(78vw,320px)] origin-bottom-right transition-[grid-template-rows,opacity] ",
          ease,
          panelShown ? "mb-2" : "mb-0",
          panelActive ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
        aria-hidden={!panelActive}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className={cn(
              "max-h-[min(46vh,300px)] origin-bottom-right overflow-y-auto rounded-[1.35rem] bg-white p-4 shadow-[0_16px_40px_rgba(42,63,77,0.16)] transition-transform ",
              ease,
              panelActive ? "translate-y-0 scale-100" : "translate-y-3 scale-[0.94]"
            )}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#3D5C6E]">
              {displayTaskCategory(task)}
            </p>
            <p className="mt-1 text-base font-black leading-snug text-[#2A3F4D]">{task.title}</p>
            <p className="mt-0.5 text-xs font-semibold text-[#2A3F4D]/55">{timeAgo(task.created_at)}</p>
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
              className="mt-4 flex h-10 items-center justify-center rounded-full bg-[#3D5C6E] text-xs font-bold text-[#F7F4EC] transition-transform duration-200 active:scale-[0.98]"
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
        className={cn(
          "relative flex h-10 max-w-[240px] cursor-grab touch-none items-center gap-2 rounded-full bg-[#2A3F4D] px-3 text-left text-[#F7F4EC] shadow-[0_10px_24px_rgba(42,63,77,0.28)] transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] active:cursor-grabbing active:scale-[0.97]",
          panelActive && "scale-[0.98]"
        )}
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
  );

  return (
    <>
      {panelShown && typeof document !== "undefined"
        ? createPortal(
            <button
              type="button"
              aria-label="Close job details"
              className={cn(
                "fixed inset-0 z-30 border-0 bg-[#163044]/30 transition-opacity",
                ease,
                panelActive ? "opacity-100" : "opacity-0 pointer-events-none"
              )}
              onClick={() => setOpen(false)}
            />,
            document.body
          )
        : null}
      {tablet && mounted && typeof document !== "undefined" ? createPortal(dock, document.body) : dock}
    </>
  );
}
