"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import ChatAvatar from "@/components/chat/Avatar";
import { Search } from "@/components/icons";
import { JobSkeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/lib/AuthContext";
import { timeAgo } from "@/lib/khaki";
import { api } from "@/lib/store";

export default function MessagesPage() {
  const { user } = useAuth();
  const cached = api.messages.peekThreads();
  const [threads, setThreads] = useState(() => cached || []);
  const [ready, setReady] = useState(() => cached != null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const stop = api.messages.subscribeThreads((rows) => {
      setThreads(rows);
      setReady(true);
    });
    return stop;
  }, []);

  const firstName = (user?.full_name || "there").trim().split(/\s+/)[0];
  const contacts = useMemo(() => {
    const seen = new Set();
    const list = [];
    threads.forEach(({ task, last }) => {
      const name =
        last?.sender_id && last.sender_id !== user?.id
          ? last.sender_name
          : user?.id === task.client_id
            ? "Tasker"
            : task.client_name || "Poster";
      const key = `${task.id}-${name}`;
      if (seen.has(key)) return;
      seen.add(key);
      list.push({ id: task.id, name, href: `/task/${task.id}/chat` });
    });
    return list.slice(0, 8);
  }, [threads, user?.id]);

  const filtered = threads.filter(({ task, last }) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return `${task.title} ${last?.text || ""} ${task.client_name || ""}`.toLowerCase().includes(q);
  });

  return (
    <AppShell>
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#163044]">
        <div className="shrink-0 px-5 pb-4 pt-5 sm:px-8">
          <p className="text-sm font-medium text-[#F7F4EC]/75">Hi, {firstName}!</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-[#F7F4EC]">
            {threads.length} {threads.length === 1 ? "Message" : "Messages"}
          </h1>
          {contacts.length > 0 ? (
            <div className="no-scrollbar mt-5 flex gap-4 overflow-x-auto pb-1">
              {contacts.map((c) => (
                <Link key={c.id} href={c.href} className="flex w-14 shrink-0 flex-col items-center gap-1.5">
                  <ChatAvatar name={c.name} size="md" />
                  <span className="w-full truncate text-center text-[11px] font-semibold text-[#F7F4EC]/85">{c.name.split(" ")[0]}</span>
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-[1.75rem] bg-[#FFFCF7] px-4 pt-5 sm:px-6">
          <label className="flex h-11 shrink-0 items-center gap-2 rounded-full bg-[#F3EFE3] px-4">
            <Search className="h-4 w-4 shrink-0" color="#6B6558" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search conversations"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </label>

          <p className="mt-6 shrink-0 text-sm font-black text-foreground">Conversations</p>
          <div className="mt-3 min-h-0 flex-1 space-y-1 overflow-y-auto pb-8">
            {!ready ? (
              <>
                <JobSkeleton />
                <JobSkeleton />
                <JobSkeleton />
              </>
            ) : filtered.length === 0 ? (
              <p className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
                No conversations yet.
              </p>
            ) : (
              filtered.map(({ task, last }) => {
                const name =
                  last?.sender_id && last.sender_id !== user?.id
                    ? last.sender_name
                    : user?.id === task.client_id
                      ? task.client_name === user?.full_name
                        ? "Tasker"
                        : task.client_name || "Tasker"
                      : task.client_name || "Poster";
                const unread = last && last.sender_id && last.sender_id !== user?.id;
                return (
                  <Link
                    key={task.id}
                    href={`/task/${task.id}/chat`}
                    className="flex items-center gap-3 rounded-2xl px-2 py-3 hover:bg-[#F3EFE3]"
                  >
                    <ChatAvatar name={name} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-bold text-foreground">{task.title}</p>
                        <span className="shrink-0 text-[11px] text-muted-foreground">{last ? timeAgo(last.created_at) : ""}</span>
                      </div>
                      <p className="mt-0.5 truncate text-sm text-muted-foreground">{last?.text || "No messages yet"}</p>
                    </div>
                    {unread ? <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#163044]" /> : null}
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
