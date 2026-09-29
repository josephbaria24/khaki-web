"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import Container from "@/components/Container";
import { NoticeSkeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/lib/AuthContext";
import { timeAgo } from "@/lib/khaki";
import { api } from "@/lib/store";
import { isVerificationSeen, markVerificationSeen, mergeNotificationFeed, noticeHref, verificationNotice } from "@/lib/verificationNotice";

export default function NotificationsPage() {
  const { user } = useAuth();
  const cached = api.notifications.peek();
  const [notes, setNotes] = useState(() => cached || []);
  const [ready, setReady] = useState(() => cached != null);
  const [freshIds, setFreshIds] = useState(() => new Set());

  useEffect(() => {
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
  }, [user]);

  const feed = mergeNotificationFeed(user, notes);

  return (
    <AppShell>
      <Container className="py-6 lg:py-10">
        <h1 className="page-title">Notifications</h1>
        <p className="page-sub">Offers, chat, verification, and task updates.</p>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {!ready ? (
            <>
              <NoticeSkeleton />
              <NoticeSkeleton />
              <NoticeSkeleton />
              <NoticeSkeleton />
            </>
          ) : feed.length === 0 ? (
            <p className="col-span-full rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
              You&apos;re all caught up.
            </p>
          ) : (
            feed.map((n) => {
              const verification = n.kind === "verification" || n.id === "verification-status";
              const unread = freshIds.has(n.id);
              return (
                <Link
                  key={n.id}
                  href={noticeHref(n)}
                  className={`rounded-2xl border p-5 ${
                    unread ? "border-[#0D666A] bg-[#D5EFEF]" : "border-[#0D666A]/10 bg-[#F4F7F7]"
                  }`}
                >
                  {verification ? (
                    <p className={`text-[11px] font-bold uppercase tracking-[0.14em] ${unread ? "text-[#0D666A]" : "text-[#0D666A]/45"}`}>
                      {n.title || "Verification"}
                    </p>
                  ) : null}
                  <p className={`text-sm ${verification ? "mt-1" : ""} ${unread ? "font-semibold text-[#163044]" : "font-medium text-[#2A3F4D]/50"}`}>{n.text}</p>
                  <p className={`mt-1 text-[11px] ${unread ? "text-[#2A3F4D]/70" : "text-[#2A3F4D]/35"}`}>{timeAgo(n.created_at)}</p>
                </Link>
              );
            })
          )}
        </div>
      </Container>
    </AppShell>
  );
}
