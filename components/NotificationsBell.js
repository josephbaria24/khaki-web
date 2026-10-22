"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import ChatAvatar from "@/components/chat/Avatar";
import { Bell } from "@/components/icons";
import { NoticeSkeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/lib/AuthContext";
import { cn, noticeDateLabel, timeAgo } from "@/lib/khaki";
import { api } from "@/lib/store";
import { isVerificationSeen, markVerificationSeen, mergeNotificationFeed, noticeHref, noticeParts, verificationNotice } from "@/lib/verificationNotice";

export default function NotificationsBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user?.id) return undefined;
    return api.notifications.subscribeUnread(setUnread);
  }, [user?.id]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#FFFCF7] text-[#2A3F4D] shadow-card dark:bg-[#1A1E27] dark:text-[#F5F3EE]"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" color="currentColor" />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#163044] px-1 text-[10px] font-bold text-[#F7F4EC]">
            {unread}
          </span>
        ) : null}
      </button>
      <NotificationsSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export function NotificationsSheet({ open, onClose }) {
  const { user } = useAuth();
  const router = useRouter();
  const [shown, setShown] = useState(false);
  const [visible, setVisible] = useState(false);
  const cached = api.notifications.peek();
  const [notes, setNotes] = useState(() => cached || []);
  const [ready, setReady] = useState(() => cached != null);
  const [freshIds, setFreshIds] = useState(() => new Set());
  const sheetRef = useRef(null);
  const listRef = useRef(null);
  const dragRef = useRef(null);
  const movedRef = useRef(false);
  const [dragY, setDragY] = useState(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!open) {
      setVisible(false);
      return undefined;
    }
    setShown(true);
    setDragY(null);
    setDragging(false);
    let raf2 = 0;
    const raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => setVisible(true));
    });
    return () => {
      window.cancelAnimationFrame(raf1);
      if (raf2) window.cancelAnimationFrame(raf2);
    };
  }, [open]);

  useEffect(() => {
    if (open || !shown) return undefined;
    const id = window.setTimeout(() => setShown(false), 420);
    return () => window.clearTimeout(id);
  }, [open, shown]);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return undefined;
    const stop = api.notifications.subscribe((list) => {
      setNotes(list);
      setReady(true);
      const status = verificationNotice(user);
      const ids = new Set(list.filter((n) => n.read === false).map((n) => n.id));
      if (status && !isVerificationSeen(status)) ids.add(status.id);
      setFreshIds(ids);
    });
    return stop;
  }, [open, user]);

  if (!shown || typeof document === "undefined") return null;

  const feed = mergeNotificationFeed(user, notes);

  const go = (note) => {
    onClose();
    router.push(noticeHref(note));
  };

  const markAll = () => {
    const status = verificationNotice(user);
    markVerificationSeen(status);
    setFreshIds(new Set());
    setNotes((rows) => rows.map((row) => (row.read ? row : { ...row, read: true })));
    api.notifications.markAllRead().catch(() => {});
  };

  function pointerDown(event) {
    if (event.button !== 0) return;
    movedRef.current = false;
    dragRef.current = {
      y: event.clientY,
      t: event.timeStamp,
      pointerId: event.pointerId,
      handle: Boolean(event.target.closest("[data-sheet-handle]")),
      mode: null,
      lastY: 0,
      lastT: event.timeStamp,
    };
  }

  function pointerMove(event) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dy = event.clientY - drag.y;
    if (!drag.mode) {
      if (Math.abs(dy) < 8) return;
      const atTop = !listRef.current || listRef.current.scrollTop <= 0;
      drag.mode = dy > 0 && (drag.handle || atTop) ? "sheet" : "scroll";
    }
    if (drag.mode !== "sheet") return;
    movedRef.current = true;
    if (sheetRef.current && !sheetRef.current.hasPointerCapture(event.pointerId)) {
      sheetRef.current.setPointerCapture(event.pointerId);
    }
    drag.lastY = Math.max(0, dy);
    drag.lastT = event.timeStamp;
    setDragging(true);
    setDragY(drag.lastY);
  }

  function pointerUp(event) {
    const drag = dragRef.current;
    if (!drag || (event && drag.pointerId !== event.pointerId)) return;
    dragRef.current = null;
    if (drag.mode !== "sheet") return;
    const y = drag.lastY || 0;
    const dt = Math.max(1, (drag.lastT || event.timeStamp) - drag.t);
    setDragging(false);
    if (y > 96 || (y > 36 && y / dt > 0.55)) {
      const height = sheetRef.current?.offsetHeight || 640;
      setDragY(height);
      window.setTimeout(() => onClose(), 280);
      return;
    }
    setDragY(0);
  }

  function swallowClick(event) {
    if (!movedRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    movedRef.current = false;
  }

  return createPortal(
    <div
      className={cn("notif-backdrop", visible && "is-open")}
      onClick={onClose}
      onTransitionEnd={(e) => {
        if (e.target !== e.currentTarget || e.propertyName !== "opacity") return;
        if (!open && !visible) setShown(false);
      }}
    >
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="Notifications"
        className={cn("notif-sheet", visible && "is-open", dragging && "is-dragging")}
        style={
          dragY == null
            ? undefined
            : {
                transform: `translateY(${dragY}px)`,
                transition: dragging ? "none" : "transform 0.28s cubic-bezier(0.22, 1, 0.36, 1)",
              }
        }
        onTransitionEnd={(event) => {
          if (event.target !== event.currentTarget || event.propertyName !== "transform") return;
          if (!dragging && dragY === 0) setDragY(null);
          if (!open && !visible && dragY == null) setShown(false);
        }}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={pointerUp}
        onPointerCancel={pointerUp}
        onClickCapture={swallowClick}
      >
        <div data-sheet-handle className="mx-auto mb-2 flex w-full touch-none justify-center py-1">
          <span className="h-1 w-9 rounded-full bg-[#C9D6E0] dark:bg-white/20" />
        </div>
        <div data-sheet-handle className="mb-1 flex touch-none items-center justify-between gap-2">
          <p className="text-base font-black tracking-tight text-[#163044] dark:text-[#F5F3EE]">Notifications</p>
          {freshIds.size > 0 ? (
            <button type="button" onClick={markAll} className="rounded-lg px-2 py-1 text-[12px] font-black text-[#0D666A] dark:text-[#7FD3CF]">
              Mark all as read
            </button>
          ) : null}
        </div>
        <div ref={listRef} className="min-h-0 flex-1 space-y-0.5 overflow-y-auto overscroll-contain pb-1">
          {!ready ? (
            <>
              <NoticeSkeleton />
              <NoticeSkeleton />
              <NoticeSkeleton />
            </>
          ) : feed.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-[#C9D6E0] px-4 py-10 text-center text-sm text-muted-foreground dark:border-white/15 dark:text-[#F5F3EE]/55">
              You&apos;re all caught up.
            </p>
          ) : (
            (() => {
            let prevDay = "";
            return feed.map((n) => {
              const unread = freshIds.has(n.id);
              const parts = noticeParts(n);
              const day = noticeDateLabel(n.created_at);
              const showDay = Boolean(day) && day !== prevDay;
              if (day) prevDay = day;
              return (
                <Fragment key={n.id}>
                {showDay ? (
                  <div className="flex items-center gap-2 px-2 pb-1 pt-3">
                    <span className="text-[11px] font-black uppercase tracking-[0.08em] text-[#2A3F4D]/50 dark:text-[#F5F3EE]/45">{day}</span>
                    <span className="h-px flex-1 bg-[#E6DDD0] dark:bg-white/15" />
                  </div>
                ) : null}
                <button
                  type="button"
                  onClick={() => go(n)}
                  className={cn(
                    "flex w-full items-start gap-2.5 rounded-xl px-2 py-2 text-left",
                    unread ? "bg-[#E7F4F4] dark:bg-[#252A35]" : "bg-transparent"
                  )}
                >
                  <ChatAvatar
                    name={parts.name || parts.actorName || parts.body || "K"}
                    src={parts.avatar_url || n.avatar_url}
                    size="sm"
                    className="mt-0.5 h-9 w-9 text-xs"
                  />
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block text-[13px] leading-snug",
                        unread
                          ? "text-[#163044] dark:text-[#F5F3EE]"
                          : "text-[#2A3F4D]/70 dark:text-[#F5F3EE]/70"
                      )}
                    >
                      {parts.name ? <span className="font-black">{parts.name} </span> : null}
                      {parts.body}
                    </span>
                    <span className="mt-0.5 block text-[11px] font-semibold text-[#2A3F4D]/45 dark:text-[#F5F3EE]/45">
                      {timeAgo(n.created_at)}
                    </span>
                  </span>
                  {unread ? (
                    <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[#0D666A] dark:bg-[#7FD3CF]" />
                  ) : (
                    <span className="mt-2 h-2.5 w-2.5 shrink-0" />
                  )}
                </button>
                </Fragment>
              );
            });
            })()
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
