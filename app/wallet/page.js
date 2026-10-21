"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import ChatAvatar from "@/components/chat/Avatar";
import Reicon from "@/components/icons/Reicon";
import { useAuth } from "@/lib/AuthContext";
import { cn, formatPHP, timeAgo } from "@/lib/khaki";
import { api } from "@/lib/store";
import { PageSkeleton } from "@/components/ui/Skeleton";

function firstName(user) {
  const name = String(user?.full_name || "there").trim();
  return name.split(/\s+/)[0] || "there";
}

function formatClock(dateStr) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function WalletPage() {
  const { user } = useAuth();
  const search = useSearchParams();
  const focusTask = search?.get("task") || "";
  const [tab, setTab] = useState("balance");
  const [fees, setFees] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let live = true;
    Promise.all([api.fees.mine().catch(() => []), api.escrow.minePayouts().catch(() => [])])
      .then(([feeRows, payoutRows]) => {
        if (!live) return;
        setFees(feeRows || []);
        setPayouts(payoutRows || []);
      })
      .catch((e) => {
        if (!live) return;
        setError(e.message || "Could not load wallet.");
      })
      .finally(() => {
        if (live) setReady(true);
      });
    return () => {
      live = false;
    };
  }, []);

  const feeTotal = fees.reduce((sum, row) => sum + Number(row.fee_php || 0), 0);
  const released = useMemo(() => payouts.filter((row) => row.status === "released"), [payouts]);
  const onHold = useMemo(() => payouts.filter((row) => row.status === "locked"), [payouts]);
  const releasedTotal = released.reduce((sum, row) => sum + Number(row.tasker_payout || 0), 0);
  const holdTotal = onHold.reduce((sum, row) => sum + Number(row.tasker_payout || 0), 0);

  const history = useMemo(() => {
    const payoutRows = (payouts || []).map((row) => ({
      id: `payout-${row.id}`,
      kind: row.status === "released" ? "in" : "hold",
      title: row.status === "released" ? `Payout · ${row.task?.title || "Gawain"}` : `On hold · ${row.task?.title || "Gawain"}`,
      sub: row.client_name ? `From ${row.client_name}` : "Tasker payout",
      when: row.released_at || row.updated_at || row.created_at,
      amount: Number(row.tasker_payout || 0),
      href: row.task_id ? `/task/${row.task_id}` : null,
      taskId: row.task_id || "",
      name: row.client_name || row.task?.title || "K",
    }));
    const feeRows = (fees || []).map((row) => ({
      id: `fee-${row.id}`,
      kind: "out",
      title: "Posting fee",
      sub: row.task_id ? "Posted gawain" : "Khaki fee",
      when: row.created_at,
      amount: Number(row.fee_php || 0),
      href: row.task_id ? `/task/${row.task_id}` : null,
      taskId: row.task_id || "",
      name: "Fee",
    }));
    return [...payoutRows, ...feeRows].sort(
      (a, b) => new Date(b.when || 0).getTime() - new Date(a.when || 0).getTime()
    );
  }, [payouts, fees]);

  useEffect(() => {
    if (!ready || !focusTask) return;
    setTab("activity");
    const el = document.getElementById(`tx-${focusTask}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [ready, focusTask, history]);

  const actions = [
    { href: "/my-jobs", label: "My jobs", icon: "briefcase" },
    { href: "/browse", label: "Browse", icon: "search" },
    { href: "/post", label: "Post", icon: "add-square" },
    { href: "/profile", label: "Profile", icon: "user" },
  ];

  return (
    <AppShell>
      <div className="min-h-full bg-[#FBF8F1] dark:bg-[#11141A]">
        <div className="mx-auto w-full max-w-lg px-4 pb-10 pt-5 sm:px-6 lg:pt-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <ChatAvatar
                name={user?.full_name || "K"}
                src={user?.avatar_url}
                size="sm"
                className="h-11 w-11 text-sm ring-2 ring-[#163044]/10 dark:ring-white/10"
              />
              <div className="min-w-0">
                <p className="truncate text-base font-black text-[#163044] dark:text-white">
                  Welcome, {firstName(user)}
                </p>
                <p className="text-xs font-semibold text-[#2A3F4D]/50 dark:text-white/45">Khaki wallet</p>
              </div>
            </div>
          </div>

          <div className="mt-5 inline-flex rounded-full bg-[#E8E0D2] p-1 dark:bg-[#232833]">
            {[
              { id: "balance", label: "Balance" },
              { id: "activity", label: "Activity" },
            ].map((item) => {
              const on = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={cn(
                    "rounded-full px-5 py-2 text-sm font-black transition-colors",
                    on
                      ? "bg-white text-[#11141A] shadow-sm dark:bg-white dark:text-[#11141A]"
                      : "text-[#163044]/55 hover:text-[#163044] dark:text-white/55 dark:hover:text-white"
                  )}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {error ? (
            <p className="mt-4 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:bg-red-500/15 dark:text-red-300">
              {error}
            </p>
          ) : null}

          {tab === "balance" ? (
            <>
              <div className="wallet-balance-card relative mt-5 overflow-hidden rounded-[28px] bg-[#C8F560] px-6 py-7 shadow-[0_18px_40px_rgba(22,48,68,0.12)] dark:shadow-[0_24px_48px_rgba(0,0,0,0.35)]">
                <div
                  className="pointer-events-none absolute inset-0 opacity-30"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 20% 20%, rgba(22,48,68,0.18), transparent 45%), radial-gradient(circle at 85% 70%, rgba(22,48,68,0.22), transparent 40%)",
                  }}
                />
                <div className="relative text-[#163044]">
                  <p className="text-sm font-bold text-[#163044]/70">Total balance</p>
                  <p className="mt-2 text-4xl font-black tracking-tight text-[#163044] sm:text-5xl">
                    {!ready ? "…" : formatPHP(releasedTotal)}
                  </p>
                  <p className="mt-2 text-xs font-semibold text-[#163044]/70">
                    Released payouts · {released.length} job{released.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white px-4 py-3 shadow-card dark:bg-[#1A1E27] dark:shadow-none">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[#163044]/40 dark:text-white/40">On hold</p>
                  <p className="mt-1 text-lg font-black text-[#D97706] dark:text-[#FBBF24]">{formatPHP(holdTotal)}</p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3 shadow-card dark:bg-[#1A1E27] dark:shadow-none">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[#163044]/40 dark:text-white/40">Posting fees</p>
                  <p className="mt-1 text-lg font-black text-[#DC2626] dark:text-[#F87171]">{formatPHP(feeTotal)}</p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-4 gap-2">
                {actions.map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="flex flex-col items-center gap-2 rounded-2xl px-1 py-2 text-center transition hover:bg-[#163044]/5 dark:hover:bg-white/5"
                  >
                    <span className="grid h-14 w-14 place-items-center rounded-full bg-[#163044] text-white shadow-sm dark:bg-[#1A1E27] dark:shadow-none">
                      <Reicon name={action.icon} className="h-6 w-6 text-white" />
                    </span>
                    <span className="text-[11px] font-bold text-[#163044]/70 dark:text-white/70">{action.label}</span>
                  </Link>
                ))}
              </div>
            </>
          ) : null}

          <section
            className={cn(
              "mt-6 rounded-t-[32px] border border-[#E6DDD0] bg-white px-4 pb-6 pt-5 shadow-[0_-8px_28px_rgba(22,48,68,0.06)] sm:rounded-[32px] sm:px-5 dark:border-white/10 dark:bg-[#151922] dark:shadow-none",
              tab === "activity" && "mt-5"
            )}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-base font-black text-[#163044] dark:text-[#F5F3EE]">Transaction history</h2>
              {tab === "balance" ? (
                <button
                  type="button"
                  onClick={() => setTab("activity")}
                  className="text-sm font-black text-[#5A9A12] dark:text-[#C8F560]"
                >
                  View all
                </button>
              ) : null}
            </div>

            {!ready ? <PageSkeleton rows={4} /> : null}
            {ready && history.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-[#D9D0C2] px-4 py-10 text-center text-sm text-[#2A3F4D]/55 dark:border-white/15 dark:text-[#F5F3EE]/50">
                No transactions yet. Finish a job or post a gawain to see activity here.
              </p>
            ) : null}

            <div className="space-y-1">
              {(tab === "balance" ? history.slice(0, 6) : history).map((row) => {
                const focused = focusTask && focusTask === row.taskId;
                const amountClass =
                  row.kind === "in"
                    ? "text-[#16A34A] dark:text-[#4ADE80]"
                    : row.kind === "hold"
                      ? "text-[#D97706] dark:text-[#FBBF24]"
                      : "text-[#DC2626] dark:text-[#F87171]";
                const prefix = row.kind === "out" ? "−" : row.kind === "in" ? "+" : "";
                const body = (
                  <>
                    {row.kind === "out" ? (
                      <span className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#163044] dark:bg-[#252A35]">
                        <Reicon name="wallet" className="h-5 w-5 text-white" />
                      </span>
                    ) : (
                      <ChatAvatar name={row.name} size="sm" className="mt-0.5 h-11 w-11 text-xs" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-black text-[#163044] dark:text-[#F5F3EE]">{row.title}</span>
                      <span className="mt-0.5 block text-[11px] font-semibold text-[#2A3F4D]/45 dark:text-[#F5F3EE]/45">
                        {formatClock(row.when) || timeAgo(row.when)}
                        {row.sub ? ` · ${row.sub}` : ""}
                      </span>
                    </span>
                    <span className={cn("shrink-0 text-sm font-black", amountClass)}>
                      {prefix}
                      {formatPHP(row.amount)}
                    </span>
                  </>
                );
                const className = cn(
                  "flex w-full items-start gap-3 rounded-2xl px-2 py-3 text-left transition",
                  focused && "bg-[#E7F4F4] ring-2 ring-[#0D666A]/25 dark:bg-[#163044]/40 dark:ring-[#C8F560]/30",
                  row.href && "hover:bg-[#F3EFE3] dark:hover:bg-white/5"
                );
                if (row.href) {
                  return (
                    <Link key={row.id} id={row.taskId ? `tx-${row.taskId}` : undefined} href={row.href} className={className}>
                      {body}
                    </Link>
                  );
                }
                return (
                  <div key={row.id} id={row.taskId ? `tx-${row.taskId}` : undefined} className={className}>
                    {body}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
