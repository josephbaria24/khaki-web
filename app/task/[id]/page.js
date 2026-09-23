"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, MessageSquare } from "@/components/icons";
import AppShell from "@/components/AppShell";
import Container from "@/components/Container";
import StatusPill from "@/components/StatusPill";
import StarRating from "@/components/StarRating";
import { useAuth } from "@/lib/AuthContext";
import { LOCATIONS, SCHEDULE_LABELS, SERVICE_CATEGORIES, displayCategory, formatPHP, postingFee, serviceByKey, serviceForTaskCategory } from "@/lib/khaki";
import { LANDING } from "@/lib/landingContent";
import { canAcceptJobs, needsTaskerVerification } from "@/lib/roles";
import { api } from "@/lib/store";
import ReportGawain from "@/components/ReportGawain";
import { toast } from "@/lib/toast";

export default function TaskDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
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
  const [posterReviews, setPosterReviews] = useState([]);
  const [review, setReview] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [myReports, setMyReports] = useState([]);
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
    const mine = offers.find((o) => o.tasker_id === user?.id && o.status === "pending");
    if (mine && !amount) {
      setAmount(String(mine.amount_php));
      setPitch(mine.pitch || "");
    }
  }, [offers, user?.id]);

  if (loading) {
    return (
      <AppShell>
        <p className="p-8 text-center text-sm text-muted-foreground">Loading…</p>
      </AppShell>
    );
  }

  if (!task) {
    return (
      <AppShell>
        <p className="p-8 text-center">Hindi mahanap ang gawain</p>
      </AppShell>
    );
  }

  const isClient = user?.id === task.client_id;
  const isHiredTasker = user?.id === task.accepted_tasker_id;
  const canComplete = isClient && ["offer_accepted", "in_progress"].includes(task.status);
  const myOffer = offers.find((o) => o.tasker_id === user?.id);
  const canBid = task.status === "open" && !isClient;
  const posterAvg = posterReviews.length
    ? (posterReviews.reduce((s, r) => s + Number(r.rating || 0), 0) / posterReviews.length).toFixed(1)
    : null;

  const submitOffer = async (e) => {
    e.preventDefault();
    setError("");
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
    const ok = window.confirm("Cancel this gawain? It will leave Browse and pending bids will be declined. The 2% posting fee is not refunded.");
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

  return (
    <AppShell>
      <Container className="py-6 lg:py-10">
        <button onClick={() => router.back()} className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        {error && <p className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <StatusPill status={task.status} />
                <span className="text-xs font-semibold text-muted-foreground">{displayCategory(task.category)}</span>
              </div>
              <h1 className="text-2xl font-black sm:text-3xl">{task.title}</h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{task.details}</p>
              <p className="mt-4 text-3xl font-black text-primary">{formatPHP(task.budget_php)}</p>
              <p className="mt-1 text-xs text-muted-foreground">Listed budget (guide). Task payment is arranged privately.</p>
              <p className="mt-1 text-sm text-muted-foreground">{task.is_remote ? "Remote · Palawan-wide" : `${task.location_area}${task.barangay ? ` · ${task.barangay}` : ""}`}</p>
              <p className="mt-2 text-sm">
                Posted by{" "}
                <Link href={`/u/${task.client_id}`} className="font-bold underline-offset-2 hover:underline">
                  {poster?.full_name || task.client_name}
                </Link>
                {posterAvg ? ` · ${posterAvg}★ from ${posterReviews.length} review${posterReviews.length === 1 ? "" : "s"}` : ""}
              </p>
              {isClient && task.status === "open" && (
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
                  Cancelled. This gawain is off Browse. Posting fee was not refunded.
                </p>
              ) : null}
              {task.status === "disputed" ? (
                <p className="mt-4 rounded-xl bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-800">
                  May issue. Admin is reviewing a report on this gawain.
                </p>
              ) : null}
            </div>

            {editing && isClient ? (
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
                <p className="text-xs text-muted-foreground">Posting fee was already charged. Changing budget won&apos;t refund or re-charge.</p>
                <button className="h-11 w-full rounded-xl bg-primary font-bold text-white">I-save</button>
              </form>
            ) : null}

            {canBid && (
              canAcceptJobs(user) ? (
              <form onSubmit={submitOffer} className="space-y-3 rounded-2xl border bg-card p-6">
                <h2 className="text-lg font-black">{myOffer ? "I-adjust ang bid mo" : "Sumali sa bidding"}</h2>
                <p className="text-xs text-muted-foreground">I-set ang tasker fee mo. Puwede mong i-baba o i-adjust habang pending. Direct payment with the poster.</p>
                <input className="h-11 w-full rounded-xl border px-3" type="number" min={50} placeholder="Tasker fee (PHP)" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                <textarea className="min-h-24 w-full rounded-xl border p-3 text-sm" placeholder="Bakit ikaw ang tama para dito" value={pitch} onChange={(e) => setPitch(e.target.value)} />
                <button className="h-11 w-full rounded-xl bg-primary font-bold text-white">
                  {myOffer ? "I-update ang bid" : "I-send ang bid"}
                </button>
              </form>
              ) : (
              <div className="space-y-3 rounded-2xl border bg-card p-6">
                <h2 className="text-lg font-black">Verified accounts lang ang puwedeng mag-bid</h2>
                {needsTaskerVerification(user) ? (
                  <>
                    <p className="text-sm text-muted-foreground">I-submit ang government ID mo at hintayin ang admin approval. Same verification unlocks posting too.</p>
                    <Link href="/verify" className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 font-bold text-white">I-verify ang account</Link>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">I-switch sa Tasker mode sa taas para mag-bid.</p>
                )}
              </div>
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

            {isClient && offers.length > 0 && (
              <div>
                <h2 className="mb-3 text-lg font-black">Mga bid</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {offers.map((o) => (
                    <div key={o.id} className="rounded-2xl border bg-card p-4">
                      <div className="flex items-center justify-between gap-3">
                        <Link href={`/u/${o.tasker_id}`} className="font-bold underline-offset-2 hover:underline">
                          {o.tasker_name}
                        </Link>
                        <p className="font-black text-primary">{formatPHP(o.amount_php)}</p>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{o.pitch}</p>
                      {o.status === "pending" && task.status === "open" && (
                        <button onClick={() => accept(o.id)} className="mt-3 h-10 w-full rounded-xl bg-accent font-bold text-white">Accept</button>
                      )}
                      {o.status !== "pending" && <p className="mt-2 text-xs font-semibold uppercase text-muted-foreground">{o.status}</p>}
                    </div>
                  ))}
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
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h3 className="text-sm font-bold">Payment</h3>
              <p className="mt-2 text-2xl font-extrabold text-khaki">{formatPHP(task.deposit_amount || postingFee(task.budget_php))}</p>
              <p className="mt-1 text-xs text-muted-foreground">Posting fee already paid to Khaki (2% of listed budget). The job fee is negotiated and paid directly between poster and tasker.</p>
              {canComplete && (
                <button onClick={complete} className="mt-4 h-11 w-full rounded-xl bg-khaki font-bold text-white">
                  Mark complete / Tapos na
                </button>
              )}
              {isClient && task.status === "open" && (
                <button
                  type="button"
                  onClick={cancelTask}
                  className="mt-3 h-11 w-full rounded-xl border-2 border-destructive text-sm font-bold text-destructive"
                >
                  Cancel gawain
                </button>
              )}
            </div>
            {!isClient && task.status !== "cancelled" ? (
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
            {(isClient || isHiredTasker || task.status !== "open") && (
              <Link href={`/task/${task.id}/chat`} className="flex h-11 items-center justify-center gap-2 rounded-xl border bg-card font-bold hover:bg-muted">
                <MessageSquare className="h-4 w-4" /> Open chat
              </Link>
            )}
          </aside>
        </div>
      </Container>
    </AppShell>
  );
}
