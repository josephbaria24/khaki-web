"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Bell, X } from "@/components/icons";
import { NoticeSkeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/lib/AuthContext";
import { cn, timeAgo } from "@/lib/khaki";
import { api } from "@/lib/store";
import { isVerificationSeen, markVerificationSeen, mergeNotificationFeed, noticeHref, verificationNotice } from "@/lib/verificationNotice";

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
  const [shown, setShown] = useState(open);
  const cached = api.notifications.peek();
  const [notes, setNotes] = useState(() => cached || []);
  const [ready, setReady] = useState(() => cached != null);
  const [freshIds, setFreshIds] = useState(() => new Set());

  useEffect(() => {
    if (open) {
      setShown(true);
      return undefined;
    }
    if (!shown) return undefined;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const id = window.setTimeout(() => setShown(false), reduced ? 0 : 240);
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
    let marked = false;
    const stop = api.notifications.subscribe((list) => {
      setNotes(list);
      setReady(true);
      if (marked) return;
      marked = true;
      const status = verificationNotice(user);
      const ids = new Set(list.filter((n) => n.read === false).map((n) => n.id));
      if (status && !isVerificationSeen(status)) ids.add(status.id);
      setFreshIds(ids);
      markVerificationSeen(status);
      api.notifications.markAllRead().catch(() => {});
    });
    return stop;
  }, [open, user]);

  if (!shown || typeof document === "undefined") return null;

  const feed = mergeNotificationFeed(user, notes);

  const go = (note) => {
    onClose();
    router.push(noticeHref(note));
  };

  return createPortal(
    <div
      className={cn("notif-backdrop", !open && "is-leaving")}
      onClick={onClose}
      onAnimationEnd={(e) => {
        if (e.target !== e.currentTarget) return;
        if (!open) setShown(false);
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Notifications"
        className={cn("notif-sheet", !open && "is-leaving")}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-[#C9D6E0]" />
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-lg font-black tracking-tight text-[#163044]">Notifications</p>
            <p className="text-[12px] text-[#2A3F4D]/65">Offers, chat, verification, and task updates.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F3EFE3] text-[#163044]"
            aria-label="Close"
          >
            <X className="h-4 w-4" color="#163044" />
          </button>
        </div>
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pb-2">
          {!ready ? (
            <>
              <NoticeSkeleton />
              <NoticeSkeleton />
              <NoticeSkeleton />
            </>
          ) : feed.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-[#C9D6E0] px-4 py-10 text-center text-sm text-muted-foreground">
              You&apos;re all caught up.
            </p>
          ) : (
            feed.map((n) => {
              const verification = n.kind === "verification" || n.id === "verification-status";
              const unread = freshIds.has(n.id);
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => go(n)}
                  className={cn(
                    "w-full rounded-2xl border p-4 text-left",
                    unread
                      ? "border-[#0D666A] bg-[#D5EFEF]"
                      : "border-[#0D666A]/10 bg-[#F4F7F7]"
                  )}
                >
                  {verification ? (
                    <p className={cn(
                      "text-[11px] font-bold uppercase tracking-[0.14em]",
                      unread ? "text-[#0D666A]" : "text-[#0D666A]/45"
                    )}>
                      {n.title || "Verification"}
                    </p>
                  ) : null}
                  <p className={cn(
                    "text-sm",
                    verification && "mt-1",
                    unread ? "font-semibold text-[#163044]" : "font-medium text-[#2A3F4D]/50"
                  )}>{n.text}</p>
                  <p className={cn("mt-1 text-[11px]", unread ? "text-[#2A3F4D]/70" : "text-[#2A3F4D]/35")}>{timeAgo(n.created_at)}</p>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
