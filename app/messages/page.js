"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import Container from "@/components/Container";
import { timeAgo } from "@/lib/khaki";
import { api } from "@/lib/store";

export default function MessagesPage() {
  const [threads, setThreads] = useState([]);

  const load = () => {
    api.messages.threads().then(setThreads).catch(() => setThreads([]));
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 12000);
    return () => clearInterval(timer);
  }, []);

  return (
    <AppShell>
      <Container className="py-6 lg:py-10">
        <h1 className="page-title">Mensahe</h1>
        <p className="page-sub">Conversations on tasks you posted or accepted.</p>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {threads.length === 0 && <p className="col-span-full rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">No conversations yet.</p>}
          {threads.map(({ task, last }) => (
            <Link key={task.id} href={`/task/${task.id}/chat`} className="rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:border-primary/30 hover:shadow-md">
              <div className="flex items-center justify-between gap-3">
                <p className="font-bold">{task.title}</p>
                <span className="shrink-0 text-[11px] text-muted-foreground">{last ? timeAgo(last.created_at) : ""}</span>
              </div>
              <p className="mt-1 truncate text-sm text-muted-foreground">{last?.text || "No messages yet"}</p>
            </Link>
          ))}
        </div>
      </Container>
    </AppShell>
  );
}
