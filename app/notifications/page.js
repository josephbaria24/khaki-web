"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import Container from "@/components/Container";
import { NoticeSkeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/lib/AuthContext";
import { noticeDateLabel, timeAgo } from "@/lib/khaki";
import { api } from "@/lib/store";
import { isVerificationSeen, markVerificationSeen, mergeNotificationFeed, noticeHref, noticeParts, verificationNotice } from "@/lib/verificationNotice";

export default function NotificationsPage() {
  const { user } = useAuth();
  const cached = api.notifications.peek();
  const [notes, setNotes] = useState(() => cached || []);
  const [ready, setReady] = useState(() => cached != null);
  const [freshIds, setFreshIds] = useState(() => new Set());

  useEffect(() => {
    const stop = api.notifications.subscribe((list) => {
      setNotes(list);
      setReady(true);
      const status = verificationNotice(user);
      const ids = new Set(list.filter((n) => n.read === false).map((n) => n.id));
      if (status && !isVerificationSeen(status)) ids.add(status.id);
      setFreshIds(ids);
    });
    return stop;
  }, [user]);

  const feed = mergeNotificationFeed(user, notes);

  return (
    <AppShell>
      <Container className="py-6 lg:py-10">
        <div className="flex items-center justify-between gap-3">
          <h1 className="page-title">Notifications</h1>
          {freshIds.size > 0 ? (
            <button
              type="button"
              onClick={() => {
                markVerificationSeen(verificationNotice(user));
                setFreshIds(new Set());
                setNotes((rows) => rows.map((row) => (row.read ? row : { ...row, read: true })));
                api.notifications.markAllRead().catch(() => {});
              }}
              className="text-sm font-black text-[#0D666A]"
            >
              Mark all as read
            </button>
          ) : null}
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl bg-white py-1 dark:bg-[#1A1E27]">
          {!ready ? (
            <>
              <NoticeSkeleton />
              <NoticeSkeleton />
              <NoticeSkeleton />
              <NoticeSkeleton />
            </>
          ) : feed.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
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
                  <div className="flex items-center gap-2 px-3 pb-1 pt-3">
                    <span className="text-[11px] font-black uppercase tracking-[0.08em] text-[#2A3F4D]/50">{day}</span>
                    <span className="h-px flex-1 bg-[#E6DDD0] dark:bg-white/15" />
                  </div>
                ) : null}
                <Link
                  href={noticeHref(n)}
                  className={`flex items-start gap-2.5 px-3 py-2.5 ${unread ? "bg-[#E7F4F4]" : ""}`}
                >
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#163044] text-xs font-black text-white">{parts.initial}</span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-[13px] leading-snug ${unread ? "text-[#163044]" : "text-[#2A3F4D]/70"}`}>
                      {parts.name ? <span className="font-black">{parts.name} </span> : null}
                      {parts.body}
                    </span>
                    <span className="mt-0.5 block text-[11px] font-semibold text-[#2A3F4D]/45">{timeAgo(n.created_at)}</span>
                  </span>
                  {unread ? <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[#0D666A]" /> : null}
                </Link>
                </Fragment>
              );
            });
            })()
          )}
        </div>
      </Container>
    </AppShell>
  );
}
