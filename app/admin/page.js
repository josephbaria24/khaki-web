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
import AdminOverview from "@/components/admin/AdminOverview";
import AdminSideNav, { AdminSectionChip } from "@/components/admin/AdminSideNav";
import DeleteUserConfirm from "@/components/admin/DeleteUserConfirm";
import TeamsPanel from "@/components/admin/TeamsPanel";
import VerificationInbox from "@/components/admin/VerificationInbox";
import { toast } from "@/lib/toast";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "users", label: "Users" },
  { id: "verification", label: "Verification" },
  { id: "teams", label: "Teams" },
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
  const [query, setQuery] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [memoFor, setMemoFor] = useState(null);
  const [memoText, setMemoText] = useState("");
  const [teamFilter, setTeamFilter] = useState("all");
  const [queueTeam, setQueueTeam] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const refresh = () => setTick((n) => n + 1);

  const requestDelete = (target) => {
    if (!target || target.role === "admin") return;
    setDeleteTarget(target);
  };

  const confirmDelete = async () => {
    if (!deleteTarget || deleteBusy) return;
    setDeleteBusy(true);
    setError("");
    try {
      await api.admin.deleteUser(deleteTarget.id);
      setDeleteTarget(null);
      refresh();
      toast.success("User deleted");
    } catch (err) {
      const msg = err.message || "Could not delete user";
      setError(msg);
      toast.error(msg);
    } finally {
      setDeleteBusy(false);
    }
  };

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
  const applicationTeams = [...new Map([
    ...applications.filter((u) => u.team).map((u) => [u.team.id, u.team]),
    ...(queueTeam ? [[queueTeam.id, queueTeam]] : []),
  ]).values()];
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
      <Container
        className={
          tab === "verification"
            ? "flex h-full min-h-0 flex-col gap-6 overflow-hidden py-6 lg:py-8"
            : "h-full min-h-0 space-y-6 overflow-y-auto py-6 lg:py-10"
        }
      >
        <div className="shrink-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="page-title mb-0">Admin</h1>
            <AdminSectionChip label={TABS.find((item) => item.id === tab)?.label || "Overview"} />
          </div>
          <p className="page-sub">Review applications, reports, users, and marketplace activity.</p>
        </div>
        {error && <p className="shrink-0 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        <div className="shrink-0">
          <AdminSideNav
            tabs={TABS}
            activeId={tab}
            onSelect={selectTab}
            hideChip
            badges={{
              verification: pending.length > 0 ? pending.length : undefined,
              reports: openReports.length > 0 ? openReports.length : undefined,
            }}
          />
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
          <UsersDirectory
            users={users}
            pending={pending}
            query={query}
            setQuery={setQuery}
            userFilter={userFilter}
            setUserFilter={setUserFilter}
            memoFor={memoFor}
            setMemoFor={setMemoFor}
            memoText={memoText}
            setMemoText={setMemoText}
            act={act}
            onRequestDelete={requestDelete}
          />
        )}

        {ready && tab === "verification" && (
          <VerificationInbox
            applications={applications}
            teams={applicationTeams}
            teamFilter={teamFilter}
            setTeamFilter={setTeamFilter}
            onApprove={(u) => act(() => api.admin.decideVerification(u.id, "verified"), "Application approved")}
            onReject={(u) => act(() => api.admin.decideVerification(u.id, "rejected", "Please resubmit a clearer government ID."), "Application rejected")}
            onDelete={requestDelete}
            onApproveSelected={async (list) => {
              if (!list?.length) return;
              if (!window.confirm(`Approve ${list.length} selected pending applications?`)) return;
              let done = 0;
              for (const u of list) {
                try {
                  await api.admin.decideVerification(u.id, "verified");
                  done += 1;
                } catch {
                  // Keep going.
                }
              }
              refresh();
              if (done === list.length) toast.success("Applications approved");
              else toast.error("Some applications could not be approved");
            }}
            onDeleteSelected={(list) => {
              if (!list?.length) return;
              if (list.length === 1) {
                requestDelete(list[0]);
                return;
              }
              if (!window.confirm(`Delete ${list.length} selected users? This cannot be undone.`)) return;
              act(async () => {
                for (const u of list) {
                  if (u.role === "admin") continue;
                  await api.admin.deleteUser(u.id);
                }
              }, "Users deleted");
            }}
          />
        )}

        {ready && tab === "teams" && (
          <TeamsPanel
            users={users}
            onOpenQueue={(team) => {
              setQueueTeam({ id: team.id, name: team.name });
              setTeamFilter(team.id);
              selectTab("verification");
            }}
          />
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
      {deleteTarget ? (
        <DeleteUserConfirm
          user={deleteTarget}
          busy={deleteBusy}
          onCancel={() => !deleteBusy && setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      ) : null}
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

function initials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "•";
}

function verifyTone(status) {
  if (status === "verified") return "bg-[#D7F0EA] text-[#0D666A]";
  if (status === "pending") return "bg-[#FFF0C4] text-[#8A6410]";
  return "bg-[#EEF2F6] text-[#3D4A5C]";
}

function UsersDirectory({ users, pending, query, setQuery, userFilter, setUserFilter, memoFor, setMemoFor, memoText, setMemoText, act, onRequestDelete }) {
  const unverified = users.filter((u) => u.role !== "admin" && u.verification_status !== "verified" && u.verification_status !== "pending");
  const needle = query.trim().toLowerCase();
  const rows = users.filter((u) => {
    if (userFilter === "verified" && u.verification_status !== "verified") return false;
    if (userFilter === "pending" && u.verification_status !== "pending" && u.tasker_application?.review_state !== "reverify") return false;
    if (userFilter === "unverified" && (u.verification_status === "verified" || u.verification_status === "pending" || u.role === "admin")) return false;
    if (!needle) return true;
    return `${u.full_name || ""} ${u.email || ""} ${u.role || ""}`.toLowerCase().includes(needle);
  });
  const filters = [
    ["all", "All"],
    ["verified", "Verified"],
    ["pending", "Pending"],
    ["unverified", "Unverified"],
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-black text-[#163044]">Users</h2>
        <p className="text-sm text-[#163044]/65">Invite someone to verify, or send a memo when a job or payment looks off.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="All accounts" value={users.length} />
        <MiniStat label="Verified" value={users.filter((u) => u.verification_status === "verified").length} />
        <MiniStat label="Pending review" value={pending.length} />
        <MiniStat label="Unverified" value={unverified.length} />
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, role, or email"
          className="h-11 flex-1 rounded-xl border border-[#E6DDD0] bg-white px-3 text-sm font-semibold text-[#163044] outline-none"
        />
        <div className="flex flex-wrap gap-1.5">
          {filters.map(([id, label]) => (
            <button key={id} type="button" onClick={() => setUserFilter(id)} className={`h-11 rounded-xl px-3 text-xs font-black ${userFilter === id ? "bg-[#163044] text-white" : "bg-[#F3EFE3] text-[#163044]"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto rounded-[1.5rem] bg-white shadow-[0_8px_28px_rgba(22,48,68,0.08)]">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b text-[11px] uppercase tracking-wide text-[#163044]/50">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Role</th>
              <th className="p-4">Verification</th>
              <th className="p-4">Status</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-b last:border-0">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E8DCC4] text-xs font-black text-[#163044]">{initials(u.full_name)}</span>
                    <div>
                      <p className="font-black text-[#163044]">{u.full_name}</p>
                      <p className="text-xs text-[#163044]/55">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4 font-semibold text-[#163044]">{ROLE_LABELS[u.role] || u.role}{u.poster_type ? ` · ${u.poster_type}` : ""}</td>
                <td className="p-4">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-black capitalize ${verifyTone(u.verification_status)}`}>
                    {u.tasker_application?.review_state === "reverify" ? "Re-verifying" : u.verification_status || "unverified"}
                  </span>
                </td>
                <td className="p-4 capitalize text-[#163044]">{u.status || "active"}</td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-1.5">
                    <Link href={`/u/${u.id}`} className="rounded-lg border border-[#163044]/15 px-2.5 py-1 text-[11px] font-black text-[#163044]">View badge</Link>
                    {u.role !== "admin" && u.verification_status !== "verified" ? (
                      <button type="button" className="rounded-lg bg-[#163044] px-2.5 py-1 text-[11px] font-black text-white" onClick={() => act(() => api.admin.inviteToVerify(u.id), "Invite sent")}>
                        Invite to verify
                      </button>
                    ) : null}
                    {u.role !== "admin" ? (
                      <button type="button" className="rounded-lg bg-[#E8DCC4] px-2.5 py-1 text-[11px] font-black text-[#163044]" onClick={() => { setMemoFor(u); setMemoText(""); }}>
                        Memo
                      </button>
                    ) : null}
                    {u.role !== "admin" ? (
                      <button
                        type="button"
                        className="rounded-lg border px-2.5 py-1 text-[11px] font-black"
                        onClick={() => act(() => api.admin.setStatus(u.id, u.status === "suspended" ? "active" : "suspended"), u.status === "suspended" ? "User activated" : "User suspended")}
                      >
                        {u.status === "suspended" ? "Activate" : "Suspend"}
                      </button>
                    ) : null}
                    {u.role !== "admin" ? (
                      <button
                        type="button"
                        className="rounded-lg border border-[#B42318]/25 bg-[#FEE2E2] px-2.5 py-1 text-[11px] font-black text-[#991B1B]"
                        onClick={() => onRequestDelete?.(u)}
                      >
                        Delete
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length ? <p className="p-4 text-sm text-[#163044]/60">No accounts match.</p> : null}
      </div>
      {memoFor ? (
        <form
          className="rounded-[1.35rem] bg-[#163044] p-4 text-white"
          onSubmit={(e) => {
            e.preventDefault();
            act(async () => {
              await api.admin.sendMemo(memoFor.id, memoText);
              setMemoFor(null);
              setMemoText("");
            }, "Memo sent");
          }}
        >
          <p className="text-sm font-black">Memo to {memoFor.full_name}</p>
          <p className="mt-1 text-xs text-white/70">They get this in notifications. Use it for odd payments, changed job details, or a reminder.</p>
          <textarea value={memoText} onChange={(e) => setMemoText(e.target.value)} className="mt-3 min-h-24 w-full rounded-xl bg-[#102636] p-3 text-sm outline-none" placeholder="What should they know?" />
          <div className="mt-3 flex gap-2">
            <button type="submit" className="h-10 rounded-xl bg-[#E8DCC4] px-4 text-sm font-black text-[#163044]">Send memo</button>
            <button type="button" className="h-10 rounded-xl px-4 text-sm font-bold text-white/80" onClick={() => setMemoFor(null)}>Cancel</button>
          </div>
        </form>
      ) : null}
    </div>
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

