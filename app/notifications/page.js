"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import Container from "@/components/Container";
import { useAuth } from "@/lib/AuthContext";
import { timeAgo } from "@/lib/khaki";
import { api } from "@/lib/store";
import { mergeNotificationFeed, noticeHref } from "@/lib/verificationNotice";

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const list = await api.notifications.list();
        if (live) setNotes(list);
        await api.notifications.markAllRead();
      } catch {
        if (live) setNotes([]);
      }
    })();
    return () => { live = false; };
  }, []);

  const feed = mergeNotificationFeed(user, notes);

  return (
    <AppShell>
      <Container className="py-6 lg:py-10">
        <h1 className="page-title">Notifications</h1>
        <p className="page-sub">Offers, chat, verification, and task updates.</p>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {feed.length === 0 && (
            <p className="col-span-full rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
              You&apos;re all caught up.
            </p>
          )}
          {feed.map((n) => {
            const verification = n.kind === "verification" || n.id === "verification-status";
            return (
              <Link
                key={n.id}
                href={noticeHref(n)}
                className={`rounded-2xl border bg-card p-5 hover:border-primary/30 ${
                  verification ? "border-[#0D666A]/25" : "border-border"
                }`}
              >
                {verification ? (
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#0D666A]">
                    {n.title || "Verification"}
                  </p>
                ) : null}
                <p className={`text-sm font-medium ${verification ? "mt-1" : ""}`}>{n.text}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{timeAgo(n.created_at)}</p>
              </Link>
            );
          })}
        </div>
      </Container>
    </AppShell>
  );
}
