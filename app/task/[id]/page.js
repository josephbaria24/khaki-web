"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, CircleAlert, Lock, MessageSquare } from "@/components/icons";
import AppShell from "@/components/AppShell";
import PublicShell from "@/components/PublicShell";
import Container from "@/components/Container";
import StatusPill from "@/components/StatusPill";
import StarRating from "@/components/StarRating";
import { useAuth } from "@/lib/AuthContext";
import { LOCATIONS, SCHEDULE_LABELS, SERVICE_CATEGORIES, TASKER_LOCKED_NOTICE, cn, displayTaskCategory, formatPHP, scheduleLabel, serviceByKey, serviceForTaskCategory, skillFitsTask, skillSummary, timeAgo } from "@/lib/khaki";
import { distanceLabel, townDistanceKm } from "@/lib/palawanLocations";
import { canTrack } from "@/lib/deliveryTrack";
import { describeExtras, describePins, vehicleLabel } from "@/lib/serviceTemplates";
import { displayName } from "@/lib/taskerProfile";
import { LANDING } from "@/lib/landingContent";
import { canAcceptJobs, isTaskerMode, needsTaskerVerification } from "@/lib/roles";
import { api } from "@/lib/store";
import PinPreviewMap from "@/components/task/PinPreviewMap";
import ReportGawain from "@/components/ReportGawain";
import { toast } from "@/lib/toast";
import { PageSkeleton } from "@/components/ui/Skeleton";

function TaskShell({ children }) {
  const { ready, isAuthenticated } = useAuth();
  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FBF8F1]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#C9D6E0] border-t-[#163044]" />
      </div>
    );
  }
  if (isAuthenticated) return <AppShell>{children}</AppShell>;
  return <PublicShell>{children}</PublicShell>;
}

export default function TaskDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [tick, setTick] = useState(0);
  const [pitch, setPitch] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [task, setTask] = useState(null);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [edit, setEdit] = useState({});
  const [poster, setPoster] = useState(null);
  const [tasker, setTasker] = useState(null);
  const [bidders, setBidders] = useState({});
  const [posterReviews, setPosterReviews] = useState([]);
  const [review, setReview] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [myReports, setMyReports] = useState([]);
  const [bidderRatings, setBidderRatings] = useState({});
  const refresh = () => setTick((n) => n + 1);

  useEffect(() => {
    if (!id) return;
    let live = true;
    setLoading(true);
    Promise.all([api.tasks.get(id), api.offers.listByTask(id), api.reviews.getByTask(id).catch(() => null), api.reports.mineForTask(id)])
      .then(([t, o, r, reports]) => {
        if (!live) return;
        setTask(t);
        setOffers(o);
        setReview(r);
        setMyReports(reports || []);
        if (t) {
          setEdit({
            title: t.title,
            details: t.details || "",
            category: t.category,
            location_area: t.location_area,
            barangay: t.barangay || "",
            location_detail: t.location_detail || "",
            is_remote: Boolean(t.is_remote),
            schedule_type: t.schedule_type || "flexible",
            schedule_date: t.schedule_date || "",
            budget_php: t.budget_php,
          });
        }
      })
      .catch(() => {
        if (!live) return;
        setTask(null);
      })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [id, tick]);

  useEffect(() => {
    if (!task?.client_id) return;
    api.profile.get(task.client_id).then(setPoster).catch(() => setPoster(null));
    api.reviews.listByReviewer(task.client_id).then(setPosterReviews).catch(() => setPosterReviews([]));
  }, [task?.client_id]);

  useEffect(() => {
    if (!task?.accepted_tasker_id) return;
    api.profile.get(task.accepted_tasker_id).then(setTasker).catch(() => setTasker(null));
  }, [task?.accepted_tasker_id]);

  useEffect(() => {
    const ids = [...new Set(offers.map((o) => o.tasker_id))];
    if (!ids.length) {
      setBidders({});
      setBidderRatings({});
      return;
    }
    api.profile.getMany(ids).then(setBidders).catch(() => setBidders({}));
    Promise.all(ids.map((bidId) => api.reviews.listByTasker(bidId).catch(() => []))).then((lists) => {
      const map = {};
      ids.forEach((bidId, i) => {
        const rows = lists[i] || [];
        map[bidId] = rows.length
          ? { avg: rows.reduce((sum, row) => sum + Number(row.rating || 0), 0) / rows.length, count: rows.length }
          : null;
      });
      setBidderRatings(map);
    });
  }, [offers]);

  useEffect(() => {
    if (!task) return;
    const locked = task.status !== "open" || Boolean(task.accepted_tasker_id) || offers.some((o) => o.status === "accepted");
    if (locked) setEditing(false);
  }, [task, offers]);

  useEffect(() => {
    const mine = offers.find((o) => o.tasker_id === user?.id && o.status === "pending");
    if (mine && !amount) {
      setAmount(String(mine.amount_php));
      setPitch(mine.pitch || "");
    }
  }, [offers, user?.id]);

  if (loading) {
    return (
      <TaskShell>
        <Container className="py-8">
          <PageSkeleton rows={4} />
        </Container>
      </TaskShell>
    );
  }

  if (!task) {
    return (
      <TaskShell>
        <p className="p-8 text-center">Hindi mahanap ang gawain</p>
      </TaskShell>
    );
  }

  const isClient = user?.id === task.client_id;
  const isHiredTasker = user?.id === task.accepted_tasker_id;
  const canComplete = isClient && task.status === "in_progress";
  const awaiting = task.status === "offer_accepted";
  const myOffer = offers.find((o) => o.tasker_id === user?.id);
  // Mirrors is_task_participant in the database: poster, hired tasker, or anyone
  // who has bid. Showing it more widely just produced an RLS error in the thread.
  const canChat = Boolean(isClient || isHiredTasker || myOffer);
  const canBid = task.status === "open" && !isClient;
  const bidsLocked = Boolean(task.accepted_tasker_id) || task.status !== "open";
  const taskExtras = describeExtras(task);
  const taskPins = task.is_remote ? [] : describePins(task);
  const posterAvg = posterReviews.length
    ? (posterReviews.reduce((s, r) => s + Number(r.rating || 0), 0) / posterReviews.length).toFixed(1)
    : null;

  const submitOffer = async (e) => {
    e.preventDefault();
    setError("");
    if (isTaskerMode(user) && !skillFitsTask(user?.skills, task)) {
      const msg = `Not qualified for ${displayTaskCategory(task)}. You can only book the skills on your profile.`;
      setError(msg);
      toast.error(msg);
      return;
    }
    try {
      await api.offers.create({ task_id: task.id, amount_php: amount, pitch });
      refresh();
      toast.success(myOffer ? "Bid updated" : "Bid submitted");
    } catch (err) {
      const msg = err.message || "Could not submit bid";
      setError(msg);
      toast.error(msg);
    }
  };

  const accept = async (offerId) => {
    try {
      await api.offers.accept(offerId);
      refresh();
      toast.success("Offer accepted");
    } catch (err) {
      const msg = err.message || "Could not accept offer";
      setError(msg);
      toast.error(msg);
    }
  };

  const respondToAssignment = async (accepted) => {
    try {
      if (accepted) await api.offers.confirmAssignment(task.id);
      else await api.offers.declineAssignment(task.id);
      refresh();
      toast.success(accepted ? "Kumpirmado — ongoing na" : "Hindi natuloy. Bukas ulit ang gawain.");
    } catch (err) {
      const msg = err.message || "Could not update assignment";
      setError(msg);
      toast.error(msg);
    }
  };

  const complete = async () => {
    try {
      await api.tasks.complete(task.id);
      refresh();
      toast.success("Gawain marked complete");
    } catch (err) {
      const msg = err.message || "Could not complete gawain";
      setError(msg);
      toast.error(msg);
    }
  };

  const cancelTask = async () => {
    const ok = window.confirm("Cancel this gawain? It will leave Browse and pending bids will be declined.");
    if (!ok) return;
    try {
      await api.tasks.cancel(task.id);
      refresh();
      toast.success("Gawain cancelled");
    } catch (err) {
      const msg = err.message || "Could not cancel gawain";
      setError(msg);
      toast.error(msg);
    }
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.tasks.update(task.id, edit);
      setEditing(false);
      refresh();
      toast.success("Gawain updated");
    } catch (err) {
      const msg = err.message || "Could not save changes";
      setError(msg);
      toast.error(msg);
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.reviews.create({ task_id: task.id, rating, comment });
      setComment("");
      refresh();
      toast.success("Review submitted");
    } catch (err) {
      const msg = err.message || "Could not submit review";
      setError(msg);
      toast.error(msg);
    }
  };

  const featured = offers.find((o) => o.status === "pending" && !bidsLocked) || offers.find((o) => o.status === "accepted") || offers[0] || null;
  const featuredBidder = featured ? bidders[featured.tasker_id] : null;
  const featuredName = displayName(featuredBidder?.full_name || featured?.tasker_name);
  const featuredRating = featured ? bidderRatings[featured.tasker_id] : null;
  const featuredLive = Boolean(featured && featured.status === "pending" && !bidsLocked);
  const bidAccepted = Boolean(task.accepted_tasker_id) || offers.some((o) => o.status === "accepted");
  const canEditDetails = isClient && task.status === "open" && !bidAccepted;
  const canCancel = isClient && (task.status === "open" || awaiting);
  const categoryName = displayTaskCategory(task);
  const lockedOut = !isClient && isTaskerMode(user) && task.status === "open" && !skillFitsTask(user?.skills, task);

  if (lockedOut) {
    const meta = [scheduleLabel(task), formatPHP(task.budget_php), task.is_remote ? "Remote" : task.location_area].filter(Boolean).join(" · ");
    const registered = skillSummary(user?.skills);
    return (
      <TaskShell>
        <Container className="max-w-lg py-5 lg:max-w-xl lg:py-8">
          <button onClick={() => router.back()} className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-[#2A3F4D]/60 hover:text-[#163044]">
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          <h1 className="text-center text-[1.35rem] font-black tracking-tight text-[#163044]">Task Detail: {categoryName}</h1>
          <article className="mt-4 rounded-[1.25rem] border border-[#E6DDD0] bg-white p-4 shadow-[0_8px_28px_rgba(42,63,77,0.08)]">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EFE8DC] text-sm font-black text-[#8A6A32]">{categoryName.slice(0, 1) || "K"}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[15px] font-black leading-snug text-[#163044]">{task.title}</p>
                  <span className="shrink-0 rounded-full bg-[#EFE8DC] px-2 py-1 text-[10px] font-black tracking-wide text-[#8A6A32]">NOT QUALIFIED</span>
                </div>
                <p className="mt-1 text-xs font-semibold text-[#2A3F4D]/55">{categoryName}</p>
                <p className="mt-1 text-[12px] font-semibold text-[#2A3F4D]/60">{meta}</p>
              </div>
            </div>
          </article>
          <div className="mt-3 rounded-[1.25rem] border border-[#E6DDD0] bg-[#FFFCF7] p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EFE8DC] text-[#8A6A32]">
                <CircleAlert className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <h2 className="text-lg font-black leading-tight text-[#163044]">Not qualified for {categoryName}</h2>
                <p className="mt-1.5 text-sm font-medium leading-snug text-[#2A3F4D]/70">
                  {registered
                    ? `You are registered for ${registered}. You cannot accept ${categoryName}.`
                    : "Add a skill on your profile. You can only book gawain that match it."}
                </p>
              </div>
            </div>
            <button type="button" disabled className="mt-4 h-11 w-full cursor-not-allowed rounded-xl bg-[#E6DDD0] text-sm font-black text-[#6B6459]">
              View Only · Not Qualified
            </button>
          </div>
          {task.details ? (
            <p className="mt-4 text-sm font-medium leading-relaxed text-[#2A3F4D]/70">{task.details}</p>
          ) : null}
        </Container>
      </TaskShell>
    );
  }

  if (isClient) {
    return (
      <TaskShell>
        <Container className={cn("max-w-lg lg:max-w-xl", (featured || canComplete || (!featured && canCancel)) ? "pt-5 pb-72 lg:pt-8 lg:pb-72" : "py-5 lg:py-8")}>
          <button onClick={() => router.back()} className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-[#2A3F4D]/60 hover:text-[#163044]">
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          <h1 className="text-center text-[1.35rem] font-black tracking-tight text-[#163044]">Job Post Status</h1>
          <p className="mt-1 text-center text-xs font-semibold text-[#2A3F4D]/55">
            {displayTaskCategory(task)} · Posted {timeAgo(task.created_at)}
          </p>
          {canTrack(task, user?.id) ? (
            <Link href={`/task/${task.id}/track`} className="mt-4 flex h-12 items-center justify-center rounded-2xl bg-[#163044] text-sm font-black text-white">
              Track this job
            </Link>
          ) : null}
          {error ? <p className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}

          <section className="mt-4 rounded-[1.35rem] border border-[#E6D9C4] bg-white p-4 shadow-[0_10px_28px_rgba(42,63,77,0.16)]">
            <h2 className="text-base font-black text-[#163044]">Job Details</h2>
            <p className="mt-2 text-xs font-semibold text-[#2A3F4D]/55">Ano ang kailangan mo?</p>
            <p className="mt-1.5 flex items-start gap-2 text-sm font-semibold leading-snug text-[#163044]">
              <TintIcon bg="bg-[#FFE4D6]" label="Gawain"><PersonIcon /></TintIcon>
              <span className="line-clamp-3">{task.details || task.title}</span>
            </p>
            {taskExtras.length > 0 ? (
              <div className="mt-3 space-y-1.5">
                {taskExtras.map((row) => (
                  <p key={row.key} className="flex items-center gap-2 text-sm font-bold text-[#163044]">
                    <TintIcon bg="bg-[#E4F0FF]" label={row.label}><PinIcon /></TintIcon>
                    <span className="text-xs font-semibold text-[#2A3F4D]/55">{row.label}</span>
                    {row.value}
                  </p>
                ))}
              </div>
            ) : null}
            <PinnedLocations pins={taskPins} />
            <div className="mt-3 space-y-2 text-sm">
              <div className="grid grid-cols-[5.5rem_1fr] items-center gap-2">
                <span className="font-semibold text-[#2A3F4D]/70">Budget:</span>
                <span className="flex items-center gap-1.5 font-black text-[#163044]">
                  <TintIcon bg="bg-[#D8F5E8]" label="Budget"><PesoIcon /></TintIcon>
                  {formatPHP(task.budget_php)} <span className="font-semibold text-[#2A3F4D]/60">{task.extras?.price_type === "per_hour" ? "(Per hour)" : task.extras?.price_type === "contract" ? "(Contract)" : "(Fixed)"}</span>
                </span>
              </div>
              {task.extras?.min_qualification ? (
                <div className="grid grid-cols-[5.5rem_1fr] items-center gap-2">
                  <span className="font-semibold text-[#2A3F4D]/70">Antas:</span>
                  <span className="font-black text-[#163044]">Stage {task.extras.min_qualification} tasker</span>
                </div>
              ) : null}
              <div className="grid grid-cols-[5.5rem_1fr] items-center gap-2">
                <span className="font-semibold text-[#2A3F4D]/70">Schedule:</span>
                <span className="flex items-center gap-1.5 font-black text-[#163044]">
                  <TintIcon bg="bg-[#FFF1C9]" label="Schedule"><BoltIcon /></TintIcon>
                  {scheduleLabel(task)}
                </span>
              </div>
            </div>
            <p className="mt-2 text-[11px] font-medium text-[#2A3F4D]/50">
              Listed budget (guide). Task payment is arranged privately.
              {!task.is_remote ? ` · ${task.location_area}${task.barangay ? ` · ${task.barangay}` : ""}` : " · Remote"}
            </p>
            {canEditDetails ? (
              <button type="button" onClick={() => setEditing((v) => !v)} className="mt-3 text-xs font-bold text-[#3A73C4]">
                {editing ? "Cancel edit" : "I-edit ang details"}
              </button>
            ) : null}
            {task.status === "cancelled" ? (
              <p className="mt-3 rounded-xl bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive">
                Cancelled. This gawain is off Browse.
              </p>
            ) : null}
            {task.status === "disputed" ? (
              <p className="mt-3 rounded-xl bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-800">
                May issue. Admin is reviewing a report on this gawain.
              </p>
            ) : null}
          </section>

          {featured || canComplete || (!featured && canCancel) ? (
            <JobDock>
          {featured ? (
            <article className="relative overflow-hidden rounded-2xl border border-white/80 bg-gradient-to-br from-[#FDE8F4] via-[#E9FBF4] to-[#D9F4FF] px-3 py-2.5 shadow-card dark:border-white/10 dark:from-[#4E2C44] dark:via-[#1F4A3E] dark:to-[#1C3E5A]">
              <span className="absolute left-2.5 top-2 text-sm" aria-hidden>🎉</span>
              <span className="absolute right-2.5 top-2 text-sm" aria-hidden>🎉</span>
              <h2 className="px-7 text-center text-sm font-black text-[#163044]">
                {featuredLive ? "Bagong Bid Natanggap!" : featured.status === "accepted" ? "Tinanggap na ang bid" : "Bid"}
              </h2>
              <div className="mt-2 flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[#D4E6FF] text-[#3A73C4]">
                  {featuredBidder?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={featuredBidder.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <PersonIcon />
                  )}
                </span>
                <div className="min-w-0">
                  <Link href={`/u/${featured.tasker_id}`} className="block truncate text-sm font-black text-[#163044]">
                    {featuredName}
                  </Link>
                  <p className="mt-0.5 flex items-center gap-1 text-xs font-bold">
                    <GoldStars value={featuredRating?.count ? featuredRating.avg : null} />
                    <span className="text-[#2A3F4D]/70">
                      {featuredRating?.count
                        ? `${featuredRating.avg.toFixed(1)} (${featuredRating.count} ${featuredRating.count === 1 ? "review" : "reviews"})`
                        : "No reviews yet"}
                    </span>
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-[#2A3F4D]/75">
                    <PinIcon />
                    Active in {featuredBidder?.location_area || "Palawan"}
                  </p>
                </div>
              </div>
              <p className="mt-1.5 text-sm font-black text-[#163044]">Nag-bid ng: {formatPHP(featured.amount_php)}</p>
              {featured.pitch ? (
                <p className="mt-0.5 line-clamp-1 text-xs leading-snug text-[#163044]">
                  <span className="font-black">Note:</span> {featured.pitch}
                </p>
              ) : null}
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const phone = featuredBidder?.phone || tasker?.phone;
                    if (phone) window.location.href = `tel:${phone}`;
                    else toast.error("Walang contact number si tasker.");
                  }}
                  className="flex h-9 items-center justify-center gap-1.5 rounded-xl border border-[#D9D3C5] bg-[#FFFCF7] px-2 text-center text-[11px] font-bold leading-tight text-[#163044]"
                >
                  <PhoneIcon /> Tumawag sa Tasker
                </button>
                {canCancel ? (
                  <button
                    type="button"
                    onClick={cancelTask}
                    className="flex h-9 items-center justify-center gap-1.5 rounded-xl border border-[#D9D3C5] bg-[#FFFCF7] px-2 text-center text-[11px] font-bold leading-tight text-[#163044]"
                  >
                    <XMarkIcon /> Kanselahin ang Job
                  </button>
                ) : null}
                {canChat ? (
                  <Link
                    href={`/task/${task.id}/chat`}
                    className="flex h-9 items-center justify-center gap-1.5 rounded-xl border border-[#D9D3C5] bg-[#FFFCF7] px-2 text-center text-[11px] font-bold leading-tight text-[#163044]"
                  >
                    <ChatIcon /> I-message si {featuredName.split(" ")[0]}
                  </Link>
                ) : null}
                {featuredLive ? (
                  <button
                    type="button"
                    onClick={() => accept(featured.id)}
                    className="flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[#1F9D6A] px-2 text-center text-[11px] font-black leading-tight text-white"
                  >
                    <PointIcon />
                    <span>Tanggapin · {formatPHP(featured.amount_php)}</span>
                  </button>
                ) : null}
              </div>
            </article>
          ) : null}
          {!featured && canCancel ? (
            <button
              type="button"
              onClick={cancelTask}
              className="flex h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-[#D9D3C5] bg-[#FFFCF7] text-[12px] font-bold text-[#163044]"
            >
              <XMarkIcon /> Kanselahin ang Job
            </button>
          ) : null}
          {canComplete ? (
            <button onClick={complete} className="mt-2 h-10 w-full rounded-xl bg-[#163044] text-sm font-bold text-white">
              Mark complete / Tapos na
            </button>
          ) : null}
            </JobDock>
          ) : null}

          {!featured ? (
            <p className="mt-4 rounded-[1.35rem] border border-dashed border-[#C9D6E0] bg-[#FFFCF7] px-4 py-8 text-center text-sm font-semibold text-[#2A3F4D]/60">
              Wala pang bid. Maghintay ng tasker, o maghanap.
            </p>
          ) : null}

          {offers.filter((o) => o.id !== featured?.id).length > 0 ? (
            <div className="mt-3 max-h-36 space-y-1.5 overflow-y-auto overscroll-contain">
              {offers.filter((o) => o.id !== featured?.id).map((o) => (
                <div key={o.id} className="flex items-center justify-between gap-2 rounded-xl bg-[#FFFCF7] px-3 py-2 shadow-card">
                  <div className="min-w-0">
                    <Link href={`/u/${o.tasker_id}`} className="block truncate text-sm font-black text-[#163044]">{displayName(bidders[o.tasker_id]?.full_name || o.tasker_name)}</Link>
                    <p className="truncate text-[11px] font-semibold text-[#2A3F4D]/65">
                      {formatPHP(o.amount_php)}
                      {bidderRatings[o.tasker_id]?.count ? ` · ${bidderRatings[o.tasker_id].avg.toFixed(1)}★` : ""}
                      {o.status !== "pending" ? ` · ${o.status}` : ""}
                    </p>
                  </div>
                  {o.status === "pending" && !bidsLocked ? (
                    <button type="button" onClick={() => accept(o.id)} className="h-8 shrink-0 rounded-full bg-[#1F9D6A] px-3 text-[11px] font-bold text-white">
                      Tanggapin
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}

          {bidsLocked && offers.length > 0 ? (
            <div className="mt-3 flex items-start gap-2.5 rounded-2xl bg-[#F3EFE3] p-3">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="text-xs font-semibold leading-snug text-muted-foreground">{TASKER_LOCKED_NOTICE}</p>
            </div>
          ) : null}

          {editing && canEditDetails ? (
            <form id="edit" onSubmit={saveEdit} className="mt-4 space-y-3 rounded-2xl bg-[#FFFCF7] p-4 shadow-card">
              <h2 className="text-lg font-black">I-edit ang gawain</h2>
              <input className="h-11 w-full rounded-xl border px-3" value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} required />
              <select
                className="h-11 w-full rounded-xl border px-3"
                value={(serviceForTaskCategory(edit.category) || SERVICE_CATEGORIES[0]).key}
                onChange={(e) => setEdit({ ...edit, category: serviceByKey(e.target.value).enumValue })}
              >
                {SERVICE_CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>{c.title}</option>
                ))}
              </select>
              <select className="h-11 w-full rounded-xl border px-3" value={edit.schedule_type} onChange={(e) => setEdit({ ...edit, schedule_type: e.target.value })}>
                {Object.entries(SCHEDULE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={edit.is_remote} onChange={(e) => setEdit({ ...edit, is_remote: e.target.checked })} />
                Remote
              </label>
              {!edit.is_remote ? (
                <select className="h-11 w-full rounded-xl border px-3" value={edit.location_area} onChange={(e) => setEdit({ ...edit, location_area: e.target.value })}>
                  {LOCATIONS.map((l) => <option key={l}>{l}</option>)}
                </select>
              ) : null}
              <textarea className="min-h-24 w-full rounded-xl border p-3 text-sm" value={edit.details} onChange={(e) => setEdit({ ...edit, details: e.target.value })} />
              <input className="h-11 w-full rounded-xl border px-3" type="number" min={50} value={edit.budget_php} onChange={(e) => setEdit({ ...edit, budget_php: e.target.value })} />
              <button className="h-11 w-full rounded-xl bg-[#163044] font-bold text-white">I-save</button>
            </form>
          ) : null}

          {awaiting ? (
            <div className="mt-4 rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-emerald-700">Awaiting acceptance</p>
              <h2 className="mt-1 text-lg font-black text-[#163044]">Napili mo si {tasker?.full_name || featuredName || "ang tasker"}</h2>
              <p className="mt-1 text-sm font-semibold text-emerald-800/80">Nag-aabang ng confirmation. Ma-notify ka pag tinanggap na niya ang gawain.</p>
            </div>
          ) : null}

          {task.status === "open" && offers.length === 0 ? (
            <Link href={`/task/${task.id}/taskers`} className="mt-3 block text-center text-sm font-bold text-[#3A73C4]">
              Maghanap ng tasker
            </Link>
          ) : null}

          {task.status === "released" && task.accepted_tasker_id ? (
            <div id="rate" className="mt-4 rounded-2xl bg-[#FFFCF7] p-4 shadow-card">
              <h2 className="text-lg font-black">I-rate ang tasker</h2>
              {tasker ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  Successful job with{" "}
                  <Link href={`/u/${tasker.id}`} className="font-bold underline-offset-2 hover:underline">{tasker.full_name}</Link>
                </p>
              ) : null}
              {review ? (
                <div className="mt-4">
                  <StarRating value={review.rating} readOnly />
                  <p className="mt-2 text-sm text-muted-foreground">{review.comment || "Na-rate mo na."}</p>
                </div>
              ) : (
                <form onSubmit={submitReview} className="mt-4 space-y-3">
                  <StarRating value={rating} onChange={setRating} />
                  <textarea className="min-h-24 w-full rounded-xl border p-3 text-sm" placeholder="Paano naging trabaho?" value={comment} onChange={(e) => setComment(e.target.value)} />
                  <button className="h-11 w-full rounded-xl bg-[#163044] font-bold text-white">I-submit ang rating</button>
                </form>
              )}
            </div>
          ) : null}
        </Container>
      </TaskShell>
    );
  }

  return (
    <TaskShell>
      <Container className="py-6 lg:py-10">
        <div className="mb-4 flex items-center justify-between gap-3">
          <button onClick={() => router.back()} className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          <div className="flex items-center gap-2">
            {canTrack(task, user?.id) ? (
              <Link href={`/task/${task.id}/track`} className="inline-flex h-10 items-center rounded-full bg-[#163044] px-3.5 text-sm font-black text-white">
                Track
              </Link>
            ) : null}
            {canChat ? (
              <Link
                href={`/task/${task.id}/chat`}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-[#FFFCF7] px-3.5 text-sm font-bold text-[#2A3F4D] shadow-card"
              >
                <MessageSquare className="h-4 w-4" color="#2A3F4D" /> Chat
              </Link>
            ) : null}
          </div>
        </div>
        {error && <p className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <StatusPill status={task.status} />
                <span className="text-xs font-semibold text-muted-foreground">{displayTaskCategory(task)}</span>
                <span className="text-xs font-semibold text-muted-foreground">· Posted {timeAgo(task.created_at)}</span>
              </div>
              <h1 className="text-2xl font-black sm:text-3xl">{task.title}</h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{task.details}</p>
              {taskExtras.length > 0 ? (
                <dl className="mt-4 grid gap-2 rounded-2xl bg-[#F3EFE3] p-4 sm:grid-cols-2">
                  {taskExtras.map((row) => (
                    <div key={row.key}>
                      <dt className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#163044]/50">{row.label}</dt>
                      <dd className="mt-0.5 text-sm font-bold text-[#163044]">{row.value}</dd>
                      {row.desc ? <dd className="text-[11px] font-medium leading-snug text-[#2A3F4D]/55">{row.desc}</dd> : null}
                    </div>
                  ))}
                  <div>
                    <dt className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#163044]/50">Kailan</dt>
                    <dd className="mt-0.5 text-sm font-bold text-[#163044]">{scheduleLabel(task)}</dd>
                  </div>
                </dl>
              ) : null}
              <p className="mt-4 text-3xl font-black text-primary">{formatPHP(task.budget_php)}</p>
              <p className="mt-1 text-xs text-muted-foreground">Listed budget (guide). Task payment is arranged privately.</p>
              <p className="mt-1 text-sm text-muted-foreground">{task.is_remote ? "Remote · Palawan-wide" : `${task.location_area}${task.barangay ? ` · ${task.barangay}` : ""}`}</p>
              <PinnedLocations pins={taskPins} />
              <p className="mt-2 text-sm">
                Posted by{" "}
                <Link href={`/u/${task.client_id}`} className="font-bold underline-offset-2 hover:underline">
                  {poster?.full_name || task.client_name}
                  {isClient ? " (me)" : ""}
                </Link>
                {posterAvg ? ` · ${posterAvg}★ from ${posterReviews.length} review${posterReviews.length === 1 ? "" : "s"}` : ""}
              </p>
              {canEditDetails && (
                <button
                  type="button"
                  onClick={() => setEditing((v) => !v)}
                  className="mt-4 h-10 rounded-full bg-[#C9D6E0] px-4 text-xs font-bold text-[#2A3F4D]"
                >
                  {editing ? "Cancel edit" : "I-edit ang details"}
                </button>
              )}
              {task.status === "cancelled" ? (
                <p className="mt-4 rounded-xl bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive">
                  Cancelled. This gawain is off Browse.
                </p>
              ) : null}
              {task.status === "disputed" ? (
                <p className="mt-4 rounded-xl bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-800">
                  May issue. Admin is reviewing a report on this gawain.
                </p>
              ) : null}
            </div>

            {editing && canEditDetails ? (
              <form id="edit" onSubmit={saveEdit} className="space-y-3 rounded-2xl border bg-card p-6">
                <h2 className="text-lg font-black">I-edit ang gawain</h2>
                <input className="h-11 w-full rounded-xl border px-3" value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} required />
                <select
                  className="h-11 w-full rounded-xl border px-3"
                  value={(serviceForTaskCategory(edit.category) || SERVICE_CATEGORIES[0]).key}
                  onChange={(e) => setEdit({ ...edit, category: serviceByKey(e.target.value).enumValue })}
                >
                  {SERVICE_CATEGORIES.map((c) => (
                    <option key={c.key} value={c.key}>{c.title}</option>
                  ))}
                </select>
                <select className="h-11 w-full rounded-xl border px-3" value={edit.schedule_type} onChange={(e) => setEdit({ ...edit, schedule_type: e.target.value })}>
                  {Object.entries(SCHEDULE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={edit.is_remote} onChange={(e) => setEdit({ ...edit, is_remote: e.target.checked })} />
                  Remote
                </label>
                {!edit.is_remote ? (
                  <select className="h-11 w-full rounded-xl border px-3" value={edit.location_area} onChange={(e) => setEdit({ ...edit, location_area: e.target.value })}>
                    {LOCATIONS.map((l) => <option key={l}>{l}</option>)}
                  </select>
                ) : null}
                <textarea className="min-h-24 w-full rounded-xl border p-3 text-sm" value={edit.details} onChange={(e) => setEdit({ ...edit, details: e.target.value })} />
                <input className="h-11 w-full rounded-xl border px-3" type="number" min={50} value={edit.budget_php} onChange={(e) => setEdit({ ...edit, budget_php: e.target.value })} />
                <button className="h-11 w-full rounded-xl bg-primary font-bold text-white">I-save</button>
              </form>
            ) : null}

            {canBid && !isAuthenticated ? (
              <div className="space-y-3 rounded-2xl border bg-card p-6 shadow-sm">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#2A3F4D]/45">Task budget</p>
                <p className="text-3xl font-black text-[#163044]">{formatPHP(task.budget_php)}</p>
                <Link
                  href={`/login?next=${encodeURIComponent(`/task/${task.id}`)}`}
                  className="flex h-11 w-full items-center justify-center rounded-xl bg-[#2F8AD4] font-bold text-white"
                >
                  Log in to make an offer
                </Link>
              </div>
            ) : null}

            {canBid && isAuthenticated && (
              canAcceptJobs(user) ? (
              skillFitsTask(user?.skills, task) ? (
              <form onSubmit={submitOffer} className="space-y-3 rounded-2xl border bg-card p-6">
                <h2 className="text-lg font-black">{myOffer ? "I-adjust ang bid mo" : "Sumali sa bidding"}</h2>
                <p className="text-xs text-muted-foreground">I-set ang tasker fee mo. Puwede mong i-baba o i-adjust habang pending. Direct payment with the poster.</p>
                <input className="h-11 w-full rounded-xl border px-3" type="number" min={50} placeholder="Tasker fee (PHP)" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                <textarea className="min-h-24 w-full rounded-xl border p-3 text-sm" placeholder="Bakit ikaw ang tama para dito" value={pitch} onChange={(e) => setPitch(e.target.value)} />
                <button className="h-11 w-full rounded-xl bg-[#0D666A] font-bold text-white">
                  {myOffer ? "I-update ang bid" : "Accept Task"}
                </button>
              </form>
              ) : (
              <div className="rounded-2xl border border-[#E6DDD0] bg-[#FFFCF7] p-5">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#8A6A32]">View only</p>
                <h2 className="mt-1 text-lg font-black text-[#163044]">Not qualified for {displayTaskCategory(task)}</h2>
                <p className="mt-1.5 text-sm font-medium leading-snug text-[#2A3F4D]/70">
                  {skillSummary(user?.skills)
                    ? `You are registered for ${skillSummary(user?.skills)}. You cannot accept ${displayTaskCategory(task)}.`
                    : "Add a skill on your profile. You can only book gawain that match it."}
                </p>
                <button type="button" disabled className="mt-4 h-11 w-full cursor-not-allowed rounded-xl bg-[#E6DDD0] text-sm font-black text-[#6B6459]">
                  View Only · Not Qualified
                </button>
              </div>
              )
              ) : (
              needsTaskerVerification(user) ? (
              <div className="rounded-2xl border border-[#F0C36A] bg-[#FFF4D6] p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F59E0B] text-white shadow-[0_6px_16px_rgba(245,158,11,0.35)]">
                    <CircleAlert className="h-5 w-5" color="#fff" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#B45309]">Kailangan bago mag-bid</p>
                    <h2 className="mt-1 text-lg font-black leading-tight text-[#7A4A00]">Verified accounts lang ang puwedeng mag-bid</h2>
                    <p className="mt-1.5 text-sm font-medium leading-snug text-[#8A5A12]">I-submit ang government ID mo at hintayin ang admin approval. Same verification unlocks posting too.</p>
                  </div>
                </div>
                <Link href="/verify" className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-[#B45309] px-5 font-bold text-white">I-verify ang account</Link>
              </div>
              ) : (
              <div className="space-y-3 rounded-2xl border bg-card p-6">
                <h2 className="text-lg font-black">Verified accounts lang ang puwedeng mag-bid</h2>
                <p className="text-sm text-muted-foreground">I-switch sa Tasker mode sa taas para mag-bid.</p>
              </div>
              )
              )
            )}

            {posterReviews.length > 0 && !isClient ? (
              <div className="rounded-2xl border bg-card p-6">
                <h2 className="text-lg font-black">Feedback ng poster</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ratings na binigay ni {poster?.full_name || task.client_name} sa past jobs.
                </p>
                <div className="mt-4 space-y-3">
                  {posterReviews.slice(0, 4).map((r) => (
                    <div key={r.id} className="rounded-xl bg-[#F3EFE3] p-3">
                      <StarRating value={r.rating} readOnly size="sm" />
                      <p className="mt-1 text-sm text-muted-foreground">{r.comment || "Walang comment"}</p>
                    </div>
                  ))}
                </div>
                <Link href={`/u/${task.client_id}`} className="mt-3 inline-block text-sm font-bold" style={{ color: LANDING.olive }}>
                  Tingnan ang buong profile →
                </Link>
              </div>
            ) : null}

            {awaiting && isClient ? (
              <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-6">
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-emerald-700">Awaiting acceptance</p>
                <h2 className="mt-1 text-xl font-black text-[#163044]">
                  Napili mo si {tasker?.full_name || "ang tasker"}
                </h2>
                <p className="mt-1 text-sm font-semibold text-emerald-800/80">
                  Nag-aabang ng confirmation. Ma-notify ka pag tinanggap na niya ang gawain.
                </p>
                {tasker ? (
                  <div className="mt-4 rounded-xl bg-white p-4">
                    <Link href={`/u/${tasker.id}`} className="font-black underline-offset-2 hover:underline">
                      {tasker.full_name}
                    </Link>
                    <p className="mt-0.5 text-sm text-muted-foreground">{tasker.headline || tasker.location_area}</p>
                    {tasker.vehicle_type ? (
                      <p className="mt-1 text-sm font-bold text-[#163044]">
                        {vehicleLabel(tasker.vehicle_type)}
                        {tasker.vehicle_model ? ` · ${tasker.vehicle_model}` : ""}
                        {tasker.plate_number ? ` · ${tasker.plate_number}` : ""}
                      </p>
                    ) : null}
                    {tasker.phone ? (
                      <a
                        href={`tel:${tasker.phone}`}
                        className="mt-3 inline-flex h-10 items-center rounded-full bg-[#163044] px-4 text-sm font-bold text-[#F7F4EC]"
                      >
                        Tumawag sa tasker
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}

            {awaiting && isHiredTasker ? (
              <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-6">
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-emerald-700">Napili ka</p>
                <h2 className="mt-1 text-xl font-black text-[#163044]">Kumpirmahin ang gawain</h2>
                <p className="mt-1 text-sm font-semibold text-emerald-800/80">
                  Pinili ka ng poster. I-confirm para masimulan, o tanggihan para maibalik sa ibang tasker.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => respondToAssignment(true)}
                    className="h-11 rounded-full bg-[#163044] px-5 text-sm font-black text-[#F7F4EC]"
                  >
                    Tanggapin ang gawain
                  </button>
                  <button
                    type="button"
                    onClick={() => respondToAssignment(false)}
                    className="h-11 rounded-full border-2 border-destructive px-5 text-sm font-bold text-destructive"
                  >
                    Hindi ko kaya
                  </button>
                </div>
              </div>
            ) : null}

            {isClient && offers.length > 0 && (
              <div>
                <h2 className="mb-3 text-lg font-black">Mga bid</h2>
                {bidsLocked ? (
                  <div className="mb-3 flex items-start gap-2.5 rounded-2xl border border-border bg-muted/60 p-4">
                    <Lock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <p className="text-sm font-semibold leading-snug text-muted-foreground">{TASKER_LOCKED_NOTICE}</p>
                  </div>
                ) : null}
                <div className="grid gap-3 sm:grid-cols-2">
                  {offers.map((o) => {
                    const bidder = bidders[o.tasker_id];
                    const km = task.is_remote ? null : townDistanceKm(bidder?.location_area, task.location_area);
                    const live = o.status === "pending" && !bidsLocked;
                    return (
                      <div
                        key={o.id}
                        className={cn(
                          "rounded-2xl border p-4",
                          live ? "border-emerald-200 bg-emerald-50" : "bg-card"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <Link href={`/u/${o.tasker_id}`} className="font-bold underline-offset-2 hover:underline">
                              {displayName(bidder?.full_name || o.tasker_name)}
                            </Link>
                            <p className="mt-0.5 text-[11px] font-semibold text-muted-foreground">
                              {bidder?.location_area || "Palawan"}
                              {km != null ? ` · ${distanceLabel(km)}` : ""}
                              {bidder?.vehicle_type ? ` · ${vehicleLabel(bidder.vehicle_type)}` : ""}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground">Nag-bid ng</p>
                            <p className="text-lg font-black text-primary">{formatPHP(o.amount_php)}</p>
                          </div>
                        </div>
                        {o.pitch ? <p className="mt-2 text-sm text-muted-foreground">{o.pitch}</p> : null}
                        {live ? (
                          <button
                            onClick={() => accept(o.id)}
                            className="mt-3 h-10 w-full rounded-xl bg-accent font-bold text-white"
                          >
                            Tanggapin ang bid ({formatPHP(o.amount_php)})
                          </button>
                        ) : null}
                        {o.status !== "pending" ? (
                          <p className="mt-2 text-xs font-semibold uppercase text-muted-foreground">{o.status}</p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {isClient && task.status === "released" && task.accepted_tasker_id && (
              <div id="rate" className="rounded-2xl border bg-card p-6">
                <h2 className="text-lg font-black">I-rate ang tasker</h2>
                {tasker ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Successful job with{" "}
                    <Link href={`/u/${tasker.id}`} className="font-bold underline-offset-2 hover:underline">{tasker.full_name}</Link>
                  </p>
                ) : null}
                {review ? (
                  <div className="mt-4">
                    <StarRating value={review.rating} readOnly />
                    <p className="mt-2 text-sm text-muted-foreground">{review.comment || "Na-rate mo na."}</p>
                  </div>
                ) : (
                  <form onSubmit={submitReview} className="mt-4 space-y-3">
                    <StarRating value={rating} onChange={setRating} />
                    <textarea className="min-h-24 w-full rounded-xl border p-3 text-sm" placeholder="Paano naging trabaho?" value={comment} onChange={(e) => setComment(e.target.value)} />
                    <button className="h-11 w-full rounded-xl bg-primary font-bold text-white">I-submit ang rating</button>
                  </form>
                )}
              </div>
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            {(canComplete || (isClient && (task.status === "open" || awaiting))) ? (
            <div className="space-y-3 rounded-2xl border border-border bg-card p-6 shadow-sm">
              {canComplete && (
                <button onClick={complete} className="h-11 w-full rounded-xl bg-khaki font-bold text-white">
                  Mark complete / Tapos na
                </button>
              )}
              {isClient && task.status === "open" && (
                <Link
                  href={`/task/${task.id}/taskers`}
                  className="flex h-11 w-full items-center justify-center rounded-xl bg-[#C9D6E0] text-sm font-bold text-[#2A3F4D]"
                >
                  Maghanap ng tasker
                </Link>
              )}
              {isClient && (task.status === "open" || awaiting) && (
                <button
                  type="button"
                  onClick={cancelTask}
                  className="h-11 w-full rounded-xl border-2 border-destructive text-sm font-bold text-destructive"
                >
                  Cancel gawain
                </button>
              )}
            </div>
            ) : null}
            {isAuthenticated && !isClient && task.status !== "cancelled" ? (
              <ReportGawain
                taskId={task.id}
                alreadyReported={myReports.some((row) => ["pending_review", "under_review"].includes(row.status))}
                onDone={refresh}
              />
            ) : null}
            {tasker && (isClient || isHiredTasker) ? (
              <Link href={`/u/${tasker.id}`} className="block rounded-2xl border bg-card p-5">
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: LANDING.olive }}>Tasker</p>
                <p className="mt-1 text-lg font-black">{tasker.full_name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{tasker.headline || tasker.location_area}</p>
                <p className="mt-2 text-sm font-bold" style={{ color: LANDING.olive }}>Tingnan ang profile →</p>
              </Link>
            ) : null}
          </aside>
        </div>
      </Container>
    </TaskShell>
  );
}

function JobDock({ children }) {
  const peek = 112;
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(true);
  const [full, setFull] = useState(0);
  const [tuck, setTuck] = useState(null);
  const dragRef = useRef(null);
  const movedRef = useRef(false);
  const tuckRef = useRef(null);
  const sheetRef = useRef(null);
  const collapsed = Math.max(0, full - peek);
  const shift = tuck == null ? (open ? 0 : collapsed) : tuck;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const node = sheetRef.current;
    if (!node) return undefined;
    const measure = () => setFull(node.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [mounted, children]);

  function pointerDown(event) {
    movedRef.current = false;
    const handle = Boolean(event.target.closest("[data-sheet-handle]"));
    dragRef.current = { y: event.clientY, base: open ? 0 : collapsed, handle, pointerId: event.pointerId };
  }

  function pointerMove(event) {
    if (!dragRef.current) return;
    const dy = event.clientY - dragRef.current.y;
    if (Math.abs(dy) < 8) return;
    movedRef.current = true;
    if (sheetRef.current && !sheetRef.current.hasPointerCapture(dragRef.current.pointerId)) {
      sheetRef.current.setPointerCapture(dragRef.current.pointerId);
    }
    const next = Math.min(collapsed, Math.max(0, dragRef.current.base + dy));
    tuckRef.current = next;
    setTuck(next);
  }

  function pointerUp() {
    if (!dragRef.current) return;
    const next = tuckRef.current;
    const moved = movedRef.current;
    const handle = dragRef.current.handle;
    dragRef.current = null;
    tuckRef.current = null;
    setTuck(null);
    if (moved && next != null) setOpen(next < collapsed * 0.45);
    else if (handle) setOpen((value) => !value);
  }

  function swallowClick(event) {
    if (!movedRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    movedRef.current = false;
  }

  if (!mounted) return null;
  const sheet = (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center">
      <div
        className={cn(
          "pointer-events-auto w-full max-w-lg",
          tuck == null && "transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
        )}
        style={{ transform: full ? `translateY(${shift}px)` : undefined }}
      >
        <div
          ref={sheetRef}
          onPointerDown={pointerDown}
          onPointerMove={pointerMove}
          onPointerUp={pointerUp}
          onPointerCancel={pointerUp}
          onClickCapture={swallowClick}
          className="overflow-hidden rounded-t-[1.4rem] border border-b-0 border-[#E6DDD0] bg-[#FBF8F1] shadow-[0_-12px_32px_rgba(22,48,68,0.14)] dark:border-white/10 dark:bg-[#11141A]"
        >
          <div
            data-sheet-handle
            className="track-sheet-handle flex w-full touch-none flex-col items-center px-4 pb-1 pt-2.5"
            aria-expanded={open}
            role="button"
            tabIndex={0}
            aria-label={open ? "Collapse bid" : "Expand bid"}
            onKeyDown={(event) => {
              if (event.key !== "Enter" && event.key !== " ") return;
              event.preventDefault();
              setOpen((value) => !value);
            }}
          >
            <span className="h-1.5 w-10 rounded-full bg-[#163044]/20 dark:bg-white/25" />
          </div>
          <div className="max-h-[min(24rem,52vh)] overflow-y-auto overscroll-contain px-2.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
  const host = document.querySelector(".khaki-landing");
  return host ? createPortal(sheet, host) : sheet;
}

function PinnedLocations({ pins }) {
  if (!pins?.length) return null;
  return (
    <div className="mt-3 space-y-1.5">
      <PinPreviewMap pins={pins} />
      {pins.map((pin) => (
        <a
          key={pin.key}
          href={pin.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2 text-sm font-bold text-[#163044] hover:bg-white"
        >
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: pin.color }} />
          <span className="text-xs font-semibold text-[#2A3F4D]/60">{pin.label}</span>
          <span className="min-w-0 flex-1 truncate">{pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}</span>
          <span className="shrink-0 text-xs font-bold text-[#3A73C4]">Buksan sa Maps →</span>
        </a>
      ))}
    </div>
  );
}

function GoldStars({ value }) {
  const n = Math.round(Number(value) || 0);
  return (
    <span className="text-[13px] tracking-tight" aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= n ? "text-[#F5C518]" : "text-[#E4D7B8]"}>★</span>
      ))}
    </span>
  );
}

function TintIcon({ bg, label, children }) {
  return (
    <span className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${bg}`} aria-label={label} role="img">
      {children}
    </span>
  );
}

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="#E06A2F" aria-hidden>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 19.2c1.2-3 3.5-4.4 6.5-4.4s5.3 1.4 6.5 4.4" />
    </svg>
  );
}

function PesoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="#1F9D6A" strokeWidth="2.4" aria-hidden>
      <path d="M8 4v16M8 4h6.2a3.6 3.6 0 0 1 0 7.2H8M6.5 8.2h9" strokeLinecap="round" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="#E6A817" aria-hidden>
      <path d="M13.2 2.5 5.5 13.2h5.2L9.8 21.5l8.7-11.4h-5.4L13.2 2.5z" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="#E06A2F" aria-hidden>
      <path d="M12 22s6.2-6.1 6.2-11.1A6.2 6.2 0 0 0 5.8 10.9C5.8 15.9 12 22 12 22z" />
      <circle cx="12" cy="10.6" r="2.1" fill="#FFF7EE" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="#3A73C4" strokeWidth="2" aria-hidden>
      <path d="M8.2 4.5h2.1l1.2 3-1.6 1a12.4 12.4 0 0 0 5.6 5.6l1-1.6 3 1.2v2.1c0 .8-.7 1.5-1.5 1.4A15.2 15.2 0 0 1 6.8 6c-.1-.8.6-1.5 1.4-1.5z" strokeLinejoin="round" />
    </svg>
  );
}

function XMarkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="#D64545" strokeWidth="2.2" aria-hidden>
      <path d="M7 7l10 10M17 7 7 17" strokeLinecap="round" />
    </svg>
  );
}

function PointIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="#fff" strokeWidth="2.2" aria-hidden>
      <path d="M5 12h12M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="#3A73C4" strokeWidth="2" aria-hidden>
      <path d="M6 16.5 4.5 19.5 8 18.2A8 8 0 1 0 6 16.5z" strokeLinejoin="round" />
    </svg>
  );
}
