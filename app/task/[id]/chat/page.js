"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, ChevronLeft } from "@/components/icons";
import AppShell from "@/components/AppShell";
import ChatAvatar from "@/components/chat/Avatar";
import { ChatSkeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/lib/AuthContext";
import { formatClock } from "@/lib/khaki";
import { api } from "@/lib/store";
import { toast } from "@/lib/toast";

function shouldStamp(prev, current) {
  if (!prev || !current?.created_at) return true;
  const gap = new Date(current.created_at).getTime() - new Date(prev.created_at).getTime();
  return gap > 8 * 60 * 1000 || prev.sender_id !== current.sender_id;
}

export default function TaskChatPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const cachedMessages = api.messages.peek(id);
  const [text, setText] = useState("");
  const [task, setTask] = useState(() => api.tasks.peekOne(id));
  const [other, setOther] = useState(null);
  const [messages, setMessages] = useState(() => cachedMessages || []);
  const [ready, setReady] = useState(() => cachedMessages != null);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!id) return undefined;
    api.tasks.get(id).then(setTask).catch(() => setTask(null));
    const stop = api.messages.subscribe(id, (rows) => {
      setMessages(rows);
      setReady(true);
    });
    return stop;
  }, [id]);

  useEffect(() => {
    if (!task || !user?.id) return;
    const otherId = user.id === task.client_id ? task.accepted_tasker_id : task.client_id;
    if (!otherId) {
      setOther(null);
      return;
    }
    api.profile.get(otherId).then(setOther).catch(() => setOther(null));
  }, [task, user?.id]);

  useEffect(() => {
    if (!ready) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, ready]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setError("");
    setSending(true);
    try {
      const row = await api.messages.send(id, text.trim());
      if (row) {
        setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]));
      }
      setText("");
    } catch (err) {
      const msg = err.message || "Hindi ma-send ang message.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSending(false);
    }
  };

  const otherName = other?.full_name || (user?.id === task?.client_id ? "Tasker" : task?.client_name) || "Chat";

  return (
    <AppShell>
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#163044]">
        <header className="flex shrink-0 items-center gap-3 px-3 pb-5 pt-3 sm:px-5">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#F7F4EC]"
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5" color="#F7F4EC" />
          </button>
          <div className="min-w-0 flex-1 text-center">
            <p className="truncate text-sm font-black text-[#F7F4EC]">{otherName}</p>
            <p className="truncate text-[11px] font-medium text-[#F7F4EC]/70">{task?.title || "Live chat"}</p>
          </div>
          <div className="w-10 shrink-0" />
        </header>

        <div className="flex min-h-0 flex-1 flex-col rounded-t-[1.75rem] bg-[#FFFCF7]">
          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5">
            {!ready ? (
              <ChatSkeleton />
            ) : messages.length === 0 ? (
              <p className="px-4 py-16 text-center text-sm text-muted-foreground">
                No messages yet. Mag-usap kayo sa bayad at schedule.
              </p>
            ) : (
              <div className="space-y-3">
                {messages.map((m, i) => {
                  const prev = messages[i - 1];
                  const stamp = shouldStamp(prev, m);
                  const mine = m.sender_id === user?.id;
                  const system = m.sender_id == null;
                  return (
                    <div key={m.id}>
                      {stamp ? (
                        <p className="mb-2 text-center text-[11px] font-medium text-muted-foreground">
                          {formatClock(m.created_at)}
                        </p>
                      ) : null}
                      {system ? (
                        <p className="mx-auto max-w-[90%] rounded-full bg-[#F3EFE3] px-3 py-1.5 text-center text-[11px] text-muted-foreground">
                          {m.text}
                        </p>
                      ) : (
                        <div className={`flex items-end gap-2 ${mine ? "justify-end" : ""}`}>
                          {!mine ? <ChatAvatar name={m.sender_name} size="sm" /> : null}
                          <div
                            className={`max-w-[78%] rounded-[1.2rem] px-3.5 py-2.5 text-sm leading-relaxed ${
                              mine
                                ? "rounded-br-md bg-[#163044] text-[#F7F4EC]"
                                : "rounded-bl-md bg-[#F3EFE3] text-[#2C2A22]"
                            }`}
                          >
                            {m.text}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {error ? <p className="px-4 pb-1 text-xs font-semibold text-destructive">{error}</p> : null}
          <form
            onSubmit={send}
            className="flex shrink-0 items-center gap-2 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4"
          >
            <input
              className="h-11 min-w-0 flex-1 rounded-full bg-[#F3EFE3] px-4 text-sm text-foreground outline-none placeholder:text-muted-foreground"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type message"
            />
            <button
              type="submit"
              disabled={sending || !text.trim()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#163044] text-[#F7F4EC] disabled:opacity-50"
              aria-label="Send"
            >
              <ArrowRight className="h-4 w-4" color="#F7F4EC" />
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
