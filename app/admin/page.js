"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import Container from "@/components/Container";
import { useAuth } from "@/lib/AuthContext";
import { formatPHP, DISPUTE_STATUS_LABEL, reportReasonLabel } from "@/lib/khaki";
import { ROLE_LABELS } from "@/lib/roles";
import { api } from "@/lib/store";
import { PageSkeleton } from "@/components/ui/Skeleton";
import ApplicationReviewCard from "@/components/admin/ApplicationReviewCard";
import AdminOverview from "@/components/admin/AdminOverview";
import { toast } from "@/lib/toast";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "users", label: "Users" },
  { id: "verification", label: "Verification" },
  { id: "reports", label: "Reports" },
  { id: "transactions", label: "Transactions" },
  { id: "activity", label: "Activity" },
];
const TAB_IDS = new Set(TABS.map((item) => item.id));
const CACHE_MS = 2 * 60 * 1000;
const CACHE_KEY = "khaki.adminData";
const adminCache = { data: null, at: 0, pending: null };

function storedAdmin() {
  if (typeof window === "undefined") return null;
  try {
    const parsed = JSON.parse(sessionStorage.getItem(CACHE_KEY) || "null");
    if (!parsed?.at || Date.now() - parsed.at > CACHE_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function rememberAdmin(data) {
  const at = Date.now();
  adminCache.data = data;
  adminCache.at = at;
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ...data, at }));
  } catch {
    // Keep the in-memory copy if the browser storage is full.
  }
}

function readTab(value) {
  return TAB_IDS.has(value) ? value : "overview";
}

function loadAdmin(force) {
  if (!force && adminCache.data && Date.now() - adminCache.at < CACHE_MS) {
    return Promise.resolve(adminCache.data);
  }
  if (!force && adminCache.pending) return adminCache.pending;
  const request = Promise.all([
    api.admin.overview(),
    api.admin.users(),
    api.admin.logs(),
    api.admin.transactions(),
    api.admin.disputes().catch(() => []),
  ]).then(([overview, users, logs, transactions, disputes]) => {
    const data = { overview, users, logs, transactions, disputes };
    rememberAdmin(data);
    adminCache.pending = null;
    return data;
  }).catch((err) => {
    adminCache.pending = null;
    throw err;
  });
  if (!force) adminCache.pending = request;
  return request;
}

function AdminScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const tab = readTab(params.get("tab"));
  const [tick, setTick] = useState(0);
  const [error, setError] = useState("");
  const [overview, setOverview] = useState(() => adminCache.data?.overview ?? null);
  const [users, setUsers] = useState(() => adminCache.data?.users ?? []);
  const [logs, setLogs] = useState(() => adminCache.data?.logs ?? []);
  const [transactions, setTransactions] = useState(() => adminCache.data?.transactions ?? []);
  const [disputes, setDisputes] = useState(() => adminCache.data?.disputes ?? []);
  const [ready, setReady] = useState(() => Boolean(adminCache.data));
  const refresh = () => setTick((n) => n + 1);

  const selectTab = (id) => {
    const next = readTab(id);
    const query = new URLSearchParams(params.toString());
    if (next === "overview") query.delete("tab");
    else query.set("tab", next);
    const search = query.toString();
    router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false });
  };

  useEffect(() => {
    if (user?.role !== "admin") return;
    let live = true;
    const force = tick > 0;
    if (!force) {
      const stored = (adminCache.data && Date.now() - adminCache.at < CACHE_MS) ? adminCache.data : storedAdmin();
      if (stored) {
        setOverview(stored.overview);
        setUsers(stored.users || []);
        setLogs(stored.logs || []);
        setTransactions(stored.transactions || []);
        setDisputes(stored.disputes || []);
        setReady(true);
        return undefined;
      }
    }
    loadAdmin(force).then((data) => {
      if (!live) return;
      setOverview(data.overview);
      setUsers(data.users);
      setLogs(data.logs);
      setTransactions(data.transactions);
      setDisputes(data.disputes);
      setReady(true);
    }).catch((err) => {
      if (live) {
        setError(err.message);
        setReady(true);
      }
    });
    return () => { live = false; };
  }, [tick, user?.role]);

  if (user?.role !== "admin") {
    return (
      <AppShell>
        <p className="p-8 text-center">Admin only.</p>
      </AppShell>
    );
  }

  const needsReview = (u) => u.verification_status === "pending" || u.tasker_application?.review_state === "reverify";
  const pending = users.filter(needsReview);
  const applications = users
    .filter((u) => u.role !== "admin" && (
      u.verification_status === "pending"
      || u.verification_status === "verified"
      || u.tasker_application
      || u.id_document
      || (u.verification_documents || []).length
      || (u.credentials || []).some((item) => item?.application)
    ))
    .sort((a, b) => {
      const rankOf = (u) => (needsReview(u) ? 0 : u.verification_status === "verified" ? 2 : 1);
      return rankOf(a) - rankOf(b);
    });
  const openReports = disputes.filter((d) => ["pending_review", "under_review"].includes(d.status));

  const act = async (fn, successMessage) => {
    setError("");
    try {
      await fn();
      refresh();
      if (successMessage) toast.success(successMessage);
    } catch (err) {
      const msg = err.message || "Something went wrong";
      setError(msg);
      toast.error(msg);
    }
  };

  return (
    <AppShell>
      <Container className="space-y-6 py-6 lg:py-10">
        <div>
          <h1 className="page-title">Admin</h1>
          <p className="page-sub">Review applications, reports, users, and marketplace activity.</p>
        </div>
        {error && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => selectTab(t.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === t.id ? "bg-foreground text-background" : "bg-card text-muted-foreground"}`}
            >
              {t.label}
              {t.id === "verification" && pending.length > 0 ? ` (${pending.length})` : ""}
              {t.id === "reports" && openReports.length > 0 ? ` (${openReports.length})` : ""}
            </button>
          ))}
        </div>

        {!ready ? <PageSkeleton rows={5} /> : null}

        {ready && tab === "overview" && overview && (
          <AdminOverview
            overview={overview}
            users={users}
            logs={logs}
            transactions={transactions}
            onOpenTab={selectTab}
          />
        )}

        {ready && tab === "users" && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MiniStat label="All accounts" value={users.length} />
              <MiniStat label="Verified" value={users.filter((u) => u.verification_status === "verified").length} />
              <MiniStat label="Pending review" value={pending.length} />
              <MiniStat label="Suspended" value={users.filter((u) => u.status === "suspended").length} />
            </div>
            <div className="overflow-x-auto rounded-[1.75rem] bg-card shadow-card">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="p-4">Name</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Verification</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b last:border-0">
                      <td className="p-4">
                        <p className="font-semibold">{u.full_name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </td>
                      <td className="p-4">{ROLE_LABELS[u.role] || u.role}{u.poster_type ? ` · ${u.poster_type}` : ""}</td>
                      <td className="p-4 capitalize">{u.verification_status}</td>
                      <td className="p-4 capitalize">{u.status || "active"}</td>
                      <td className="p-4">
                        {u.role !== "admin" && (
                          <button
                            className="rounded-lg border px-3 py-1 text-xs font-bold"
                            onClick={() =>
                              act(
                                () => api.admin.setStatus(u.id, u.status === "suspended" ? "active" : "suspended"),
                                u.status === "suspended" ? "User activated" : "User suspended"
                              )
                            }
                          >
                            {u.status === "suspended" ? "Activate" : "Suspend"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {ready && tab === "verification" && (
          <div className="space-y-4">
            {applications.length === 0 && <p className="text-sm text-muted-foreground">No verification submissions yet. Forms from /verify appear here with the ID, details, and signature.</p>}
            {applications.map((u) => (
              <ApplicationReviewCard
                key={u.id}
                user={u}
                onApprove={() => act(() => api.admin.decideVerification(u.id, "verified"), "Application approved")}
                onReject={() => act(() => api.admin.decideVerification(u.id, "rejected", "Please resubmit a clearer government ID."), "Application rejected")}
              />
            ))}
          </div>
        )}

        {ready && tab === "reports" && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <MiniStat label="Open reports" value={openReports.length} />
              <MiniStat label="Taken down" value={disputes.filter((d) => d.status === "resolved_no_charge").length} />
              <MiniStat label="Dismissed" value={disputes.filter((d) => d.status === "dismissed").length} />
            </div>
            {disputes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No reports yet. Users can flag a gawain from the task page.</p>
            ) : (
              <div className="grid gap-3 xl:grid-cols-2">
                {disputes.map((d) => {
                  const open = ["pending_review", "under_review"].includes(d.status);
                  const reason = reportReasonLabel(d.item_description || d.dispute_type);
                  return (
                    <div key={d.id} className="rounded-[1.5rem] bg-card p-4 shadow-card">
                      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                        {DISPUTE_STATUS_LABEL[d.status] || d.status}
                      </p>
                      <p className="mt-1 text-base font-black">{d.task?.title || "Gawain"}</p>
                      <p className="mt-1 text-sm font-semibold">{reason}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {d.flagged_by_name} · {d.created_at ? new Date(d.created_at).toLocaleString() : ""}
                      </p>
                      {d.description ? <p className="mt-2 text-sm text-muted-foreground">{d.description}</p> : null}
                      {d.admin_notes ? <p className="mt-2 text-xs text-muted-foreground">Admin: {d.admin_notes}</p> : null}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {d.task_id ? (
                          <Link href={`/task/${d.task_id}`} className="inline-flex h-10 items-center rounded-xl border px-4 text-xs font-bold">
                            View gawain
                          </Link>
                        ) : null}
                        {open ? (
                          <>
                            <button
                              type="button"
                              onClick={() => act(() => api.admin.resolveDispute(d.id, "takedown"), "Gawain taken down")}
                              className="h-10 rounded-xl bg-destructive px-4 text-xs font-bold text-white"
                            >
                              Take down
                            </button>
                            <button
                              type="button"
                              onClick={() => act(() => api.admin.resolveDispute(d.id, "dismiss"), "Report dismissed")}
                              className="h-10 rounded-xl border px-4 text-xs font-bold"
                            >
                              Dismiss
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {ready && tab === "transactions" && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <MiniStat label="Posting fees" value={transactions.length} />
              <MiniStat label="Total recorded" value={formatPHP(transactions.reduce((s, t) => s + Number(t.amount || 0), 0))} />
              <MiniStat
                label="Average fee"
                value={formatPHP(
                  transactions.length
                    ? transactions.reduce((s, t) => s + Number(t.amount || 0), 0) / transactions.length
                    : 0
                )}
              />
            </div>
            <div className="grid gap-3 xl:grid-cols-2">
              {transactions.length === 0 && <p className="text-sm text-muted-foreground">No transactions yet.</p>}
              {transactions.map((t) => (
                <div key={t.id} className="flex flex-wrap items-center justify-between gap-2 rounded-[1.5rem] bg-card p-4 text-sm shadow-card">
                  <div>
                    <p className="font-bold capitalize">{t.kind} · {t.status}</p>
                    <p className="text-muted-foreground">{t.from} → {t.to}{t.reference ? ` · ${t.reference}` : ""}</p>
                  </div>
                  <p className="font-black">{formatPHP(t.amount)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {ready && tab === "activity" && (
          <div className="grid gap-3 xl:grid-cols-2">
            {logs.length === 0 && <p className="text-sm text-muted-foreground">No activity yet.</p>}
            {logs.map((log) => (
              <div key={log.id} className="rounded-[1.5rem] bg-card px-4 py-3 text-sm shadow-card">
                <p className="font-semibold">{log.actor_name} · {log.action.replaceAll("_", " ")}</p>
                <p className="text-muted-foreground">{log.detail}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{new Date(log.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </Container>
    </AppShell>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8"><PageSkeleton rows={5} /></div>}>
      <AdminScreen />
    </Suspense>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-[1.5rem] bg-card p-4 shadow-card">
      <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-black tabular-nums">{value}</p>
    </div>
  );
}

