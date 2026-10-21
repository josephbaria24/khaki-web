"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Search } from "@/components/icons";
import AppShell from "@/components/AppShell";
import Container from "@/components/Container";
import ChatAvatar from "@/components/chat/Avatar";
import SectionIntro from "@/components/SectionIntro";
import StarRating from "@/components/StarRating";
import { JobSkeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/lib/AuthContext";
import { cn, formatPHP } from "@/lib/khaki";
import { distanceLabel, townDistanceKm } from "@/lib/palawanLocations";
import { vehicleLabel } from "@/lib/serviceTemplates";
import { api } from "@/lib/store";
import { toast } from "@/lib/toast";

const SORTS = [
  { value: "distance", label: "Nearest first" },
  { value: "recommended", label: "Recommended" },
  { value: "rating", label: "Highest rating" },
  { value: "jobs", label: "Most jobs done" },
  { value: "name", label: "Name (A–Z)" },
];

const FAR = Number.MAX_SAFE_INTEGER;

function sortTaskers(rows, sort) {
  const list = [...rows];
  if (sort === "distance") list.sort((a, b) => (a.distance_km ?? FAR) - (b.distance_km ?? FAR));
  if (sort === "rating") list.sort((a, b) => Number(b.avg_rating) - Number(a.avg_rating));
  if (sort === "jobs") list.sort((a, b) => Number(b.jobs_done) - Number(a.jobs_done));
  if (sort === "name") list.sort((a, b) => String(a.full_name || "").localeCompare(String(b.full_name || "")));
  return list;
}

export default function TaskTaskersPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [task, setTask] = useState(() => api.tasks.peekOne(id));
  const [offers, setOffers] = useState([]);
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("distance");
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return undefined;
    let live = true;
    Promise.all([api.tasks.get(id), api.offers.listByTask(id)])
      .then(([t, o]) => {
        if (!live) return;
        setTask(t);
        setOffers(o || []);
      })
      .catch(() => {});
    return () => { live = false; };
  }, [id]);

  // Search runs server-side so the list stays one round trip as it grows.
  useEffect(() => {
    let live = true;
    setLoading(true);
    const timer = window.setTimeout(() => {
      api.taskers.list({ search: query })
        .then((data) => { if (live) setRows(data); })
        .catch((err) => { if (live) setError(err.message || "Hindi ma-load ang mga tasker"); })
        .finally(() => { if (live) setLoading(false); });
    }, query ? 250 : 0);
    return () => { live = false; window.clearTimeout(timer); };
  }, [query]);

  const isClient = task && user?.id === task.client_id;
  const awaiting = task?.status === "offer_accepted" && Boolean(task?.accepted_tasker_id);
  const canAssign = Boolean(isClient) && task?.status === "open" && !task?.accepted_tasker_id;
  const canCancelAssign = Boolean(isClient) && awaiting;
  const assignedId = task?.accepted_tasker_id || null;
  const bidderIds = new Set(offers.map((o) => o.tasker_id));
  const withDistance = rows.map((t) => ({
    ...t,
    distance_km: task?.is_remote ? null : townDistanceKm(t.location_area, task?.location_area),
  }));
  const visible = sortTaskers(withDistance, sort);

  const assign = async (tasker) => {
    const ok = window.confirm(`I-assign si ${tasker.full_name} sa gawain na 'to? Kailangan pa niyang i-confirm.`);
    if (!ok) return;
    setAssigning(tasker.id);
    setError("");
    try {
      const next = await api.taskers.assign(task.id, tasker.id);
      if (next) setTask(next);
      toast.success(`Na-assign si ${tasker.full_name}. Hinihintay ang confirmation.`);
      router.push(`/task/${task.id}`);
    } catch (err) {
      const msg = err.message || "Hindi ma-assign ang tasker";
      setError(msg);
      toast.error(msg);
    } finally {
      setAssigning("");
    }
  };

  const cancelAssign = async (taskerName) => {
    const ok = window.confirm(
      `Cancel assignment${taskerName ? ` for ${taskerName}` : ""}? You can assign someone else after.`
    );
    if (!ok) return;
    setCancelling(true);
    setError("");
    try {
      const next = await api.offers.cancelAssignment(task.id);
      if (next) setTask(next);
      const o = await api.offers.listByTask(task.id).catch(() => []);
      setOffers(o || []);
      toast.success("Assignment cancelled. You can assign again.");
    } catch (err) {
      const msg = err.message || "Could not cancel assignment";
      setError(msg);
      toast.error(msg);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <AppShell>
      <Container className="min-w-0 max-w-full overflow-x-hidden py-5 lg:py-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-3 inline-flex items-center gap-1 text-[12px] font-bold text-[#2A3F4D]/65 hover:text-[#163044] dark:text-[#F5F3EE]/65"
        >
          <ChevronLeft className="h-4 w-4" /> Back to task
        </button>
        <SectionIntro
          className="mb-4 min-w-0"
          pill="TASKERS"
          title="Find a tasker"
          sub={
            canAssign
              ? `Pick for "${task?.title || "this task"}". They still need to confirm before starting.`
              : canCancelAssign
                ? "Someone is already assigned and waiting to confirm. Cancel assign to pick someone else."
                : "Verified taskers in Palawan. Assign only while your task is still open."
          }
        />

        {canCancelAssign ? (
          <div className="mb-4 flex min-w-0 flex-col gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 sm:flex-row sm:items-center sm:justify-between dark:border-emerald-500/30 dark:bg-emerald-500/10">
            <p className="min-w-0 text-[12px] font-semibold text-emerald-900 dark:text-emerald-200">
              Awaiting confirmation from the assigned tasker.
            </p>
            <button
              type="button"
              disabled={cancelling}
              onClick={() => cancelAssign(visible.find((t) => t.id === assignedId)?.full_name)}
              className={cn(
                "inline-flex h-10 shrink-0 items-center justify-center rounded-full border-2 border-destructive px-4 text-[13px] font-bold text-destructive",
                cancelling && "opacity-60"
              )}
            >
              {cancelling ? "Cancelling…" : "Cancel assign"}
            </button>
          </div>
        ) : null}

        {error ? (
          <p className="mb-3 break-words rounded-2xl bg-destructive/10 px-3 py-2 text-[12px] font-semibold text-destructive">{error}</p>
        ) : null}

        <div className="mb-4 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
          <label className="relative flex min-w-0 w-full flex-1 items-center">
            <Search className="pointer-events-none absolute left-4 h-4 w-4 text-[#163044]/40 dark:text-[#F5F3EE]/40" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find a tasker…"
              className="h-11 w-full min-w-0 rounded-full bg-[#F3EFE3] pl-11 pr-4 text-sm font-semibold text-[#163044] outline-none placeholder:font-medium placeholder:text-[#2A3F4D]/40 dark:bg-[#1A1E27] dark:text-[#F5F3EE] dark:placeholder:text-[#F5F3EE]/40"
            />
          </label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-11 w-full shrink-0 rounded-full bg-[#F3EFE3] px-4 text-sm font-semibold text-[#163044] outline-none sm:w-auto dark:bg-[#1A1E27] dark:text-[#F5F3EE]"
          >
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        {sort === "distance" && !task?.is_remote ? (
          <p className="mb-3 text-[11px] font-medium text-[#2A3F4D]/50 dark:text-[#F5F3EE]/45">
            Distance is measured between town centres, so treat it as a rough guide.
          </p>
        ) : null}

        {loading ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <JobSkeleton />
            <JobSkeleton />
          </div>
        ) : visible.length === 0 ? (
          <p className="rounded-2xl bg-[#FFFCF7] p-8 text-center text-sm font-semibold text-[#2A3F4D]/55 shadow-card dark:bg-[#1A1E27] dark:text-[#F5F3EE]/55">
            No taskers matched your search.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
            {visible.map((t) => (
              <article
                key={t.id}
                className="flex min-w-0 flex-col rounded-[1.25rem] bg-[#FFFCF7] p-3.5 shadow-card sm:p-4 dark:bg-[#1A1E27]"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <ChatAvatar name={t.full_name} src={t.avatar_url || t.profile_photo} size="lg" />
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                      <Link
                        href={`/u/${t.id}`}
                        className="min-w-0 max-w-full break-words font-black text-[#163044] underline-offset-2 hover:underline dark:text-[#F5F3EE]"
                      >
                        {t.full_name}
                      </Link>
                      {t.id === assignedId ? (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#163044] px-2 py-0.5 text-[10px] font-black text-[#F7F4EC] dark:bg-[#2BA3D9] dark:text-[#0B1A24]">
                          Assigned
                        </span>
                      ) : null}
                      {t.is_online ? (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 break-words text-[12px] font-medium text-[#2A3F4D]/60 dark:text-[#F5F3EE]/55">
                      {t.headline || t.location_area}
                    </p>
                    <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-bold text-[#2A3F4D]/70 dark:text-[#F5F3EE]/65">
                      <StarRating value={Math.round(Number(t.avg_rating))} readOnly size="sm" />
                      <span className="break-words">
                        {Number(t.avg_rating).toFixed(1)} · {t.review_count} review{Number(t.review_count) === 1 ? "" : "s"}
                        {" · "}{t.jobs_done} done
                      </span>
                    </div>
                    {t.vehicle_type ? (
                      <p className="mt-1 break-words text-[11px] font-bold text-[#163044]/70 dark:text-[#F5F3EE]/70">
                        {vehicleLabel(t.vehicle_type)}
                        {t.vehicle_model ? ` · ${t.vehicle_model}` : ""}
                        {t.plate_number ? ` · ${t.plate_number}` : ""}
                      </p>
                    ) : null}
                    <p className="mt-1 break-words text-[11px] font-semibold text-[#2A3F4D]/55 dark:text-[#F5F3EE]/50">
                      {t.barangay ? `${t.barangay} · ` : ""}{t.location_area}
                      {t.distance_km != null ? ` · ${distanceLabel(t.distance_km)}` : ""}
                      {t.price_amount ? ` · ${formatPHP(t.price_amount)}` : ""}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
                  {bidderIds.has(t.id) || t.id === assignedId ? (
                    <Link
                      href={`/task/${task.id}/chat`}
                      className="inline-flex h-10 w-full items-center justify-center rounded-full bg-[#F3EFE3] px-4 text-[13px] font-bold text-[#2A3F4D] sm:w-auto dark:bg-[#252A35] dark:text-[#F5F3EE]"
                    >
                      Message
                    </Link>
                  ) : null}
                  {canAssign ? (
                    <button
                      type="button"
                      disabled={assigning === t.id}
                      onClick={() => assign(t)}
                      className={cn(
                        "inline-flex h-10 w-full items-center justify-center rounded-full bg-[#163044] px-4 text-[13px] font-black text-[#F7F4EC] sm:w-auto dark:bg-[#2BA3D9] dark:text-[#0B1A24]",
                        assigning === t.id && "opacity-60"
                      )}
                    >
                      {assigning === t.id ? "Assigning…" : "Assign"}
                    </button>
                  ) : null}
                  {canCancelAssign && t.id === assignedId ? (
                    <button
                      type="button"
                      disabled={cancelling}
                      onClick={() => cancelAssign(t.full_name)}
                      className={cn(
                        "inline-flex h-10 w-full items-center justify-center rounded-full border-2 border-destructive px-4 text-[13px] font-bold text-destructive sm:w-auto",
                        cancelling && "opacity-60"
                      )}
                    >
                      {cancelling ? "Cancelling…" : "Cancel assign"}
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </Container>
    </AppShell>
  );
}
