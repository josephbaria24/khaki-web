"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import ChatAvatar from "@/components/chat/Avatar";
import { Mail, Plus, Search, X } from "@/components/icons";
import Refreshable from "@/components/Refreshable";
import { JobSkeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/lib/AuthContext";
import { timeAgo } from "@/lib/khaki";
import { api } from "@/lib/store";
import { toast } from "@/lib/toast";

const HIDDEN_THREADS_KEY = "khaki.hiddenMessageThreads";

function readHiddenThreads() {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = JSON.parse(window.localStorage.getItem(HIDDEN_THREADS_KEY) || "[]");
    return new Set(Array.isArray(raw) ? raw : []);
  } catch {
    return new Set();
  }
}

function threadOtherId(task, userId) {
  if (!task || !userId) return null;
  return userId === task.client_id ? task.accepted_tasker_id : task.client_id;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const cached = api.messages.peekThreads();
  const [threads, setThreads] = useState(() => cached || []);
  const [ready, setReady] = useState(() => cached != null);
  const [query, setQuery] = useState("");
  const [avatars, setAvatars] = useState({});
  const [hidden, setHidden] = useState(readHiddenThreads);
  const [compose, setCompose] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState(() => new Set());

  useEffect(() => {
    const stop = api.messages.subscribeThreads((rows) => {
      setThreads(rows);
      setReady(true);
    });
    return stop;
  }, []);

  useEffect(() => {
    if (!user?.id || !threads.length) {
      setAvatars({});
      return undefined;
    }
    const ids = threads.map(({ task }) => threadOtherId(task, user.id)).filter(Boolean);
    if (!ids.length) {
      setAvatars({});
      return undefined;
    }
    let cancelled = false;
    api.profile
      .getMany(ids)
      .then((map) => {
        if (!cancelled) setAvatars(map || {});
      })
      .catch(() => {
        if (!cancelled) setAvatars({});
      });
    return () => {
      cancelled = true;
    };
  }, [threads, user?.id]);

  const firstName = (user?.full_name || "there").trim().split(/\s+/)[0];
  const inbox = threads.filter(({ task }) => !hidden.has(task.id));
  const unreadCount = inbox.filter(({ last }) => last?.sender_id && last.sender_id !== user?.id).length;
  const filtered = inbox.filter(({ task, last }) => {
    if (unreadOnly && !(last?.sender_id && last.sender_id !== user?.id)) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return `${task.title} ${last?.text || ""} ${task.client_name || ""}`.toLowerCase().includes(q);
  });

  const hideSelected = () => {
    if (!selected.size) {
      setSelecting(false);
      return;
    }
    const next = new Set(hidden);
    selected.forEach((id) => next.add(id));
    setHidden(next);
    window.localStorage.setItem(HIDDEN_THREADS_KEY, JSON.stringify([...next]));
    setSelected(new Set());
    setSelecting(false);
    toast.success("Removed from your inbox. The chat stays on the job.");
  };

  const toggleSelected = (id) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <AppShell>
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#163044]">
        <div className="shrink-0 px-5 pb-3 pt-3 sm:px-8">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold leading-none text-[#F7F4EC]/70">Hi, {firstName}</p>
              <h1 className="mt-1 text-lg font-black tracking-tight text-[#F7F4EC]">Messages</h1>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <span className="inline-flex h-6 items-center rounded-full bg-[#D4E6FF] px-2.5 text-[10px] font-extrabold text-[#3A73C4]">
                {threads.length}
              </span>
              {unreadCount > 0 ? (
                <span className="inline-flex h-6 items-center rounded-full bg-[#F8D5E0] px-2.5 text-[10px] font-extrabold text-[#C94B78]">
                  {unreadCount} new
                </span>
              ) : (
                <span className="inline-flex h-6 items-center rounded-full bg-[#CFF5D6] px-2.5 text-[10px] font-extrabold text-[#1B6B45]">
                  All read
                </span>
              )}
            </div>
          </div>
          <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-0.5 pt-1">
            <button
              type="button"
              onClick={() => {
                setCompose((open) => !open);
                setSelecting(false);
                setSelected(new Set());
              }}
              className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12px] font-black ${compose ? "bg-[#F7F4EC] text-[#163044]" : "bg-white/10 text-[#F7F4EC]"}`}
            >
              <Plus className="h-3.5 w-3.5" />
              New
            </button>
            <button
              type="button"
              onClick={() => setUnreadOnly((on) => !on)}
              className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12px] font-black ${unreadOnly ? "bg-[#F8D5E0] text-[#C94B78]" : "bg-white/10 text-[#F7F4EC]"}`}
            >
              <Mail className="h-3.5 w-3.5" />
              Unread
            </button>
            <button
              type="button"
              onClick={() => {
                if (selecting) hideSelected();
                else {
                  setSelecting(true);
                  setCompose(false);
                }
              }}
              className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12px] font-black ${selecting ? "bg-[#F8D5E0] text-[#C94B78]" : "bg-white/10 text-[#F7F4EC]"}`}
            >
              <X className="h-3.5 w-3.5" />
              {selecting && selected.size ? `Delete ${selected.size}` : "Delete"}
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-[1.75rem] bg-white px-4 pt-5 sm:px-6 dark:bg-[#1A1E27]">
          <label className="flex h-11 shrink-0 items-center gap-2 rounded-full bg-white px-4 shadow-[0_2px_8px_rgba(22,48,68,0.08)] dark:bg-[#252A35] dark:shadow-[0_2px_10px_rgba(0,0,0,0.28)]">
            <Search className="h-4 w-4 shrink-0" color="#6B6558" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search conversations"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </label>

          {compose ? (
            <div className="mt-4 shrink-0 rounded-2xl bg-[#E7F1FA] p-3 dark:bg-[#1B3044]">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#163044]/60 dark:text-[#E7F1FA]/70">Message a job</p>
              {inbox.length === 0 ? (
                <p className="mt-2 text-sm font-semibold text-[#163044] dark:text-[#E7F1FA]">Chats open from a job you are on.</p>
              ) : (
                <div className="mt-2 max-h-40 space-y-1 overflow-y-auto">
                  {inbox.map(({ task }) => (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => router.push(`/task/${task.id}/chat`)}
                      className="block w-full truncate rounded-xl bg-white px-3 py-2 text-left text-sm font-bold text-[#163044] dark:bg-[#1A1E27] dark:text-[#F5F3EE]"
                    >
                      {task.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : null}
          <p className="mt-6 shrink-0 text-sm font-black text-foreground">Conversations</p>
          <Refreshable className="mt-3 min-h-0 flex-1 space-y-1 overflow-y-auto pb-8">
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
                const otherId = threadOtherId(task, user?.id);
                const profile = otherId ? avatars[otherId] : null;
                const name =
                  last?.sender_id && last.sender_id !== user?.id
                    ? last.sender_name
                    : profile?.full_name ||
                      (user?.id === task.client_id
                        ? task.client_name === user?.full_name
                          ? "Tasker"
                          : task.client_name || "Tasker"
                        : task.client_name || "Poster");
                const unread = last && last.sender_id && last.sender_id !== user?.id;
                const row = (
                  <>
                    {selecting ? (
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-black ${selected.has(task.id) ? "border-[#C94B78] bg-[#F8D5E0] text-[#C94B78]" : "border-[#C9D6E0] text-transparent"}`}>
                        ✓
                      </span>
                    ) : null}
                    <ChatAvatar name={name} src={profile?.avatar_url} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-bold text-foreground">{task.title}</p>
                        <span className="shrink-0 text-[11px] text-muted-foreground">{last ? timeAgo(last.created_at) : ""}</span>
                      </div>
                      <p className="mt-0.5 truncate text-sm text-muted-foreground">{last?.text || "No messages yet"}</p>
                    </div>
                    {unread ? (
                      <span className="shrink-0 rounded-full bg-[#F8D5E0] px-2 py-0.5 text-[10px] font-extrabold text-[#C94B78]">
                        New
                      </span>
                    ) : null}
                  </>
                );
                return selecting ? (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => toggleSelected(task.id)}
                    className="flex w-full items-center gap-3 rounded-2xl px-2 py-3 text-left hover:bg-black/[0.04] dark:hover:bg-white/5"
                  >
                    {row}
                  </button>
                ) : (
                  <Link
                    key={task.id}
                    href={`/task/${task.id}/chat`}
                    className="flex items-center gap-3 rounded-2xl px-2 py-3 hover:bg-black/[0.04] dark:hover:bg-white/5"
                  >
                    {row}
                  </Link>
                );
              })
            )}
          </Refreshable>
        </div>
      </div>
    </AppShell>
  );
}
