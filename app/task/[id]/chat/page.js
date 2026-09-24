"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft } from "@/components/icons";
import AppShell from "@/components/AppShell";
import Container from "@/components/Container";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/store";
import { toast } from "@/lib/toast";

export default function TaskChatPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [task, setTask] = useState(null);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!id) return undefined;
    api.tasks.get(id).then(setTask).catch(() => setTask(null));
    const stop = api.messages.subscribe(id, setMessages);
    return stop;
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

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

  return (
    <AppShell>
      <Container className="py-6 lg:py-8">
        <button onClick={() => router.back()} className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        <h1 className="page-title">{task?.title || "Chat"}</h1>
        <p className="page-sub">Live thread. New messages show up here and as a notification.</p>
        <div className="mt-4 flex min-h-[60vh] flex-col rounded-2xl border border-border bg-card p-4 sm:p-6">
          <div className="flex-1 space-y-2 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">No messages yet. Mag-usap kayo sa bayad at schedule.</p>
            ) : null}
            {messages.map((m) => {
              const mine = m.sender_id === user?.id;
              return (
                <div key={m.id} className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.sender_id == null ? "mx-auto bg-muted text-center text-xs text-muted-foreground" : mine ? "ml-auto bg-primary text-white" : "border bg-background"}`}>
                  {m.sender_id != null && <p className={`mb-0.5 text-[10px] ${mine ? "text-white/70" : "text-muted-foreground"}`}>{m.sender_name}</p>}
                  {m.text}
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
          {error ? <p className="mt-3 text-xs font-semibold text-destructive">{error}</p> : null}
          <form onSubmit={send} className="mt-4 flex gap-2">
            <input className="h-11 flex-1 rounded-xl border px-3" value={text} onChange={(e) => setText(e.target.value)} placeholder="Message..." />
            <button disabled={sending} className="h-11 rounded-xl bg-primary px-5 font-bold text-white disabled:opacity-60">
              {sending ? "…" : "Send"}
            </button>
          </form>
        </div>
      </Container>
    </AppShell>
  );
}
