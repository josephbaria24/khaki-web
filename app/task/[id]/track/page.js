"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, MessageSquare } from "@/components/icons";
import AppShell from "@/components/AppShell";
import DeliveryRouteMap from "@/components/task/DeliveryRouteMap";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/lib/AuthContext";
import {
  TRACK_STEPS,
  canTrack,
  formatRouteDistance,
  isLiveStatus,
  ratingSummary,
  riderMeta,
  riderName,
  riderPoint,
  sharedRider,
  routeFromTask,
  routeKm,
  trackStepIndex,
  trackStepTimes,
  trackingTitle,
} from "@/lib/deliveryTrack";
import { cn, formatClock, timeAgo } from "@/lib/khaki";
import { api } from "@/lib/store";
import { toast } from "@/lib/toast";

export default function TaskTrackPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, ready: authReady } = useAuth();
  const [task, setTask] = useState(null);
  const [tasker, setTasker] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [undoKey, setUndoKey] = useState(0);
  const [undoBar, setUndoBar] = useState(100);
  const [sheetOpen, setSheetOpen] = useState(true);
  const [marks, setMarks] = useState([]);

  useEffect(() => {
    if (!id) return;
    let live = true;
    api.tasks.get(id)
      .then((row) => { if (live) setTask(row); })
      .catch(() => { if (live) setTask(null); })
      .finally(() => { if (live) setReady(true); });
    return () => { live = false; };
  }, [id]);

  useEffect(() => {
    if (!id) return undefined;
    let live = true;
    api.messages.listByTask(id).then((rows) => { if (live) setMarks(rows || []); }).catch(() => {});
    return () => { live = false; };
  }, [id, task?.status, task?.extras?.progress?.step, task?.extras?.progress?.times?.accepted, task?.extras?.progress?.times?.preparing, task?.extras?.progress?.times?.on_the_way, task?.extras?.progress?.times?.arrived, task?.extras?.progress?.times?.delivered]);

  useEffect(() => {
    if (!task?.accepted_tasker_id) return;
    let live = true;
    api.profile.get(task.accepted_tasker_id).then((row) => { if (live) setTasker(row); }).catch(() => {});
    api.reviews.listByTasker(task.accepted_tasker_id).then((rows) => { if (live) setReviews(rows || []); }).catch(() => {});
    return () => { live = false; };
  }, [task?.accepted_tasker_id]);

  useEffect(() => {
    if (!id || !task || ["released", "cancelled", "completed_pending_review"].includes(task.status)) return undefined;
    const timer = setInterval(() => {
      api.tasks.get(id).then((row) => { if (row) setTask(row); }).catch(() => {});
    }, 15000);
    return () => clearInterval(timer);
  }, [id, task?.status]);

  useEffect(() => {
    if (!undoKey) return undefined;
    const frame = requestAnimationFrame(() => setUndoBar(0));
    const timer = setTimeout(() => setUndoKey(0), 3000);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, [undoKey]);

  if (!ready || !authReady) {
    return (
      <AppShell>
        <div className="mx-auto w-full max-w-lg px-4 py-8"><PageSkeleton rows={4} /></div>
      </AppShell>
    );
  }

  if (!task || !canTrack(task, user?.id)) {
    return (
      <AppShell>
        <div className="mx-auto w-full max-w-lg px-4 py-10 text-center">
          <p className="text-sm font-semibold text-[#163044]">Tracking opens after a tasker is hired on this job.</p>
          <Link href={task ? `/task/${task.id}` : "/jobs"} className="mt-4 inline-flex text-sm font-black text-[#0D666A]">Back to the job</Link>
        </div>
      </AppShell>
    );
  }

  const live = isLiveStatus(task.status);
  const step = trackStepIndex(task);
  const stepTimes = trackStepTimes(task, marks);
  const shared = sharedRider(task);
  const isTasker = user?.id === task.accepted_tasker_id;
  const isPoster = user?.id === task.client_id;
  const finished = ["released", "cancelled", "completed_pending_review"].includes(task.status);
  const canDeliver = isPoster && task.status === "in_progress";
  const { start, end, town } = routeFromTask(task);
  const rider = shared || riderPoint(start, end, step);
  const km = routeKm(start, end);
  const distance = formatRouteDistance(km);
  const rating = ratingSummary(reviews);
  const name = riderName(tasker?.full_name);
  const area = task.barangay || task.location_area;
  const phone = tasker?.phone;

  const call = () => {
    if (phone) window.location.href = `tel:${phone}`;
    else toast.error("Walang contact number si tasker.");
  };

  const saveProgress = async (payload, message) => {
    setBusy(true);
    try {
      const next = await api.tasks.reportProgress(task.id, payload);
      if (next) setTask(next);
      toast.success(message || (payload.step === "arrived" ? "Marked as arrived" : payload.step === "on_the_way" ? "Marked as on the way" : "Location shared"));
      return true;
    } catch (err) {
      toast.error(err.message || "Could not update the job");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const confirmArrival = async () => {
    const ok = await saveProgress({ step: "arrived" }, "Marked as arrived");
    if (ok) {
      setUndoBar(100);
      setUndoKey((key) => key + 1);
    }
  };

  const undoArrival = async () => {
    setUndoKey(0);
    await saveProgress({ step: "on_the_way" }, "Arrival undone");
  };

  const markDelivered = async () => {
    setBusy(true);
    try {
      const next = await api.tasks.complete(task.id);
      if (next) setTask(next);
      toast.success("Marked as delivered");
    } catch (err) {
      toast.error(err.message || "Could not mark this delivered");
    } finally {
      setBusy(false);
    }
  };

  const shareLocation = () => {
    if (!navigator.geolocation) {
      toast.error("This browser cannot share a location.");
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        saveProgress({ location: { lat: pos.coords.latitude, lng: pos.coords.longitude } });
      },
      () => {
        setBusy(false);
        toast.error("Location permission is off.");
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-lg px-4 pb-52 pt-5 sm:px-6 sm:pt-8">
        <button type="button" onClick={() => router.back()} className="inline-flex items-center gap-1 text-sm font-bold text-[#163044]">
          <ChevronLeft className="h-4 w-4" />
          <span className="text-[11px] font-extrabold uppercase tracking-[0.14em]">Khaki · Jobs & Services in Palawan</span>
        </button>

        <div className="mt-4 flex items-center gap-2">
          <h1 className="min-w-0 text-[1.55rem] font-black leading-tight tracking-tight text-[#163044] sm:text-[1.85rem]">
            {trackingTitle(task)}{live ? " — Live" : ""}
          </h1>
          {live ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#1F9D6A] px-2 py-1 text-[10px] font-black uppercase tracking-wide text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-white" /> Live
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm font-semibold text-[#163044]/55">
          {shared?.at ? `Tasker location · Shared ${timeAgo(shared.at)}` : start && end ? "Posted route" : "Job progress"} · Updated {timeAgo(task.updated_at || task.created_at)}
        </p>

        <div className="mt-4">
          <DeliveryRouteMap
            start={start}
            end={end}
            rider={rider}
            center={town}
            startLabel={start?.label || "Pick-up point"}
            endLabel={end?.label || "Drop-off point"}
            areaLabel={area}
            distanceLabel={distance}
          />
          <p className="mt-2 text-[11px] font-semibold text-[#163044]/50">
            {shared
              ? "The marker is the last spot the tasker shared. It stays there until they share again."
              : start && end
                ? "Until the tasker shares a location, the marker sits on this job’s step along the posted route."
                : "This job has no pick-up and drop-off pins, so the map stays on the town."}
          </p>
        </div>

        <section className="mt-4 rounded-[1.2rem] border border-[#E6DDD0] bg-white p-3.5 dark:border-white/10 dark:bg-[#1A1E27]">
          <div className="flex items-center gap-3">
            {tasker?.avatar_url ? (
              <img src={tasker.avatar_url} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />
            ) : (
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#163044] text-sm font-black text-white">{name.slice(0, 1)}</span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-black text-[#163044]">{name}</p>
              <p className="truncate text-xs font-semibold text-[#163044]/60">{riderMeta(task, tasker)}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-black text-[#163044]">{rating ? `★ ${rating.text}` : "New"}</p>
              <p className="text-[11px] font-semibold text-[#163044]/55">{distance ? `${distance} route` : TRACK_STEPS[step].label}</p>
            </div>
          </div>
        </section>

        <ol className="relative mt-5 flex">
          <span className="absolute left-[10%] right-[10%] top-3 h-0.5 bg-[#E6DDD0] dark:bg-white/10" />
          <span
            className="absolute left-[10%] top-3 h-0.5 bg-[#0D666A]"
            style={{ width: `${(step / (TRACK_STEPS.length - 1)) * 80}%` }}
          />
          {TRACK_STEPS.map((item, index) => {
            const filled = index <= step;
            const current = index === step;
            return (
              <li key={item.key} className="relative z-10 flex flex-1 flex-col items-center">
                <span className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-black ${filled ? "bg-[#0D666A] text-white" : "bg-[#E7EEF4] text-[#163044]/35 dark:bg-[#252A35]"}`}>
                  {index < step ? "✓" : current && item.key === "on_the_way" ? "🏍" : ""}
                </span>
                <span className={`mt-1.5 px-0.5 text-center text-[10px] font-bold leading-tight sm:text-[11px] ${current ? "text-[#163044] underline decoration-2 underline-offset-2" : "text-[#163044]/55"}`}>
                  {item.label}
                </span>
                {index <= step && stepTimes[index] ? (
                  <span className="mt-0.5 whitespace-nowrap text-center text-[9px] font-semibold leading-none text-[#163044]/45">{formatClock(stepTimes[index])}</span>
                ) : null}
              </li>
            );
          })}
        </ol>

      </div>
      <TrackSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        collapsible={isTasker && !finished}
        title={isTasker && !finished ? "Update this job" : "This job"}
        hint={isTasker && !finished ? (sheetOpen ? "The poster sees the step and the spot you share. Slide to mark arrived. Nothing updates on its own." : TRACK_STEPS[step].label) : "Call or message the rider"}
      >
        {isTasker && !finished ? (
          <div className="grid gap-2">
            {step < 2 ? (
              <button type="button" disabled={busy} onClick={() => saveProgress({ step: "on_the_way" })} className="h-11 rounded-xl bg-[#163044] text-sm font-black text-white disabled:opacity-60">On the way</button>
            ) : null}
            {step === 2 ? (
              <SlideToConfirm label="Slide to arrive" disabled={busy} onConfirm={confirmArrival} />
            ) : null}
            {undoKey ? (
              <div className="overflow-hidden rounded-xl bg-[#163044] text-white" role="status">
                <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <p className="text-sm font-bold">Marked as arrived</p>
                  <button type="button" onClick={undoArrival} className="text-sm font-black text-[#E6C22E]">Undo</button>
                </div>
                <div className="h-1 bg-white/15">
                  <div className="h-full bg-[#E6C22E] transition-[width] duration-[3000ms] ease-linear" style={{ width: `${undoBar}%` }} />
                </div>
              </div>
            ) : null}
            <button type="button" disabled={busy} onClick={shareLocation} className="h-11 rounded-xl border-2 border-[#163044] text-sm font-black text-[#163044] disabled:opacity-60">Share where I am</button>
          </div>
        ) : null}
        <div>
          {canDeliver ? (
            <button type="button" disabled={busy} onClick={markDelivered} className="mb-2.5 h-11 w-full rounded-xl bg-[#0D666A] text-sm font-black text-white disabled:opacity-60">Mark as delivered</button>
          ) : null}
          <div className="grid grid-cols-2 gap-2.5">
          <button type="button" onClick={call} className="flex h-12 items-center justify-center gap-2 rounded-2xl border-2 border-[#163044] text-sm font-black text-[#163044]">
            <PhoneIcon /> Call Rider
          </button>
          <Link href={`/task/${task.id}/chat`} className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#163044] text-sm font-black text-white">
            <MessageSquare className="h-4 w-4" color="#fff" /> Message
          </Link>
          </div>
        </div>
      </TrackSheet>
    </AppShell>
  );
}

function TrackSheet({ open, onOpenChange, collapsible, title, hint, children }) {
  const dragRef = useRef(null);
  const movedRef = useRef(false);
  const dragHeightRef = useRef(null);
  const bodyRef = useRef(null);
  const [full, setFull] = useState(0);
  const [dragHeight, setDragHeight] = useState(null);
  const controls = Array.isArray(children) ? children[0] : null;
  const actions = Array.isArray(children) ? children[1] : children;
  const shown = dragHeight == null ? (open ? full : 0) : dragHeight;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const node = bodyRef.current;
    if (!node) return undefined;
    const measure = () => setFull(node.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [controls, collapsible, mounted]);

  function pointerDown(event) {
    if (!collapsible) return;
    movedRef.current = false;
    dragRef.current = { y: event.clientY, base: open ? full : 0 };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function pointerMove(event) {
    if (!dragRef.current) return;
    const dy = event.clientY - dragRef.current.y;
    if (Math.abs(dy) > 8) movedRef.current = true;
    const next = Math.min(full, Math.max(0, dragRef.current.base - dy));
    dragHeightRef.current = next;
    setDragHeight(next);
  }

  function pointerUp() {
    if (!dragRef.current) return;
    const height = dragHeightRef.current;
    const moved = movedRef.current;
    dragRef.current = null;
    dragHeightRef.current = null;
    setDragHeight(null);
    if (moved && height != null) onOpenChange(height > full * 0.45);
  }

  function toggle() {
    if (!collapsible) return;
    if (movedRef.current) {
      movedRef.current = false;
      return;
    }
    onOpenChange(!open);
  }

  const sheet = (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center">
      <div className="pointer-events-auto w-full max-w-lg">
        <div className="overflow-hidden rounded-t-[1.4rem] border border-b-0 border-[#E6DDD0] bg-white shadow-[0_-12px_32px_rgba(22,48,68,0.14)] dark:border-white/10 dark:bg-[#1A1E27]">
          <button
            type="button"
            aria-expanded={collapsible ? open : true}
            aria-label={open ? "Collapse job actions" : "Expand job actions"}
            onPointerDown={pointerDown}
            onPointerMove={pointerMove}
            onPointerUp={pointerUp}
            onPointerCancel={pointerUp}
            onClick={toggle}
            className="track-sheet-handle flex w-full touch-none flex-col items-center px-4 pb-2 pt-2.5"
          >
            <span className="h-1.5 w-10 rounded-full bg-[#163044]/20 dark:bg-white/25" />
            <span className="mt-2.5 flex w-full items-center justify-between gap-3 text-left">
              <span className="text-sm font-black text-[#163044]">{title}</span>
              {collapsible ? (
                <span className={cn("text-sm font-black text-[#163044]/45 transition-transform duration-300", open ? "rotate-180" : "")}>⌃</span>
              ) : null}
            </span>
            {hint ? <span className="mt-1 w-full text-left text-[11px] font-semibold leading-snug text-[#163044]/55">{hint}</span> : null}
          </button>
          {collapsible ? (
            <div
              className={cn("overflow-hidden", dragHeight == null && "transition-[height] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none")}
              style={{ height: full ? shown : open ? "auto" : 0 }}
            >
              <div ref={bodyRef} className="px-3 pb-2">{controls}</div>
            </div>
          ) : null}
          <div className="px-3 pb-[max(0.85rem,env(safe-area-inset-bottom))]">{actions}</div>
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;
  const host = document.querySelector(".khaki-landing");
  return host ? createPortal(sheet, host) : sheet;
}

function SlideToConfirm({ label, disabled, onConfirm }) {
  const trackRef = useRef(null);
  const offsetRef = useRef(0);
  const dragRef = useRef(null);
  const [offset, setOffset] = useState(0);

  function limit() {
    return Math.max(0, (trackRef.current?.clientWidth || 0) - 44);
  }

  function moveTo(value) {
    const next = Math.min(limit(), Math.max(0, value));
    offsetRef.current = next;
    setOffset(next);
  }

  function pointerDown(event) {
    if (disabled) return;
    dragRef.current = { x: event.clientX, start: offsetRef.current };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function pointerMove(event) {
    if (!dragRef.current) return;
    moveTo(dragRef.current.start + (event.clientX - dragRef.current.x));
  }

  function pointerUp() {
    if (!dragRef.current) return;
    const done = offsetRef.current >= limit() - 8;
    dragRef.current = null;
    moveTo(0);
    if (done) onConfirm();
  }

  return (
    <div ref={trackRef} className="relative h-11 touch-none overflow-hidden rounded-xl bg-[#0D666A]/15">
      <span className="pointer-events-none absolute inset-0 grid place-items-center text-sm font-black text-[#0D666A]">{label}</span>
      <span className="pointer-events-none absolute left-0 top-0 h-full rounded-xl bg-[#0D666A]" style={{ width: offset + 44 }} />
      <button
        type="button"
        disabled={disabled}
        aria-label={label}
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={pointerUp}
        onPointerCancel={pointerUp}
        className="absolute left-1 top-1 grid h-9 w-9 place-items-center rounded-lg bg-[#0D666A] text-lg font-black text-white disabled:opacity-60"
        style={{ transform: `translateX(${offset}px)` }}
      >
        ›
      </button>
    </div>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
      <path d="M8 4.5h2.2l1.1 2.6-1.4 1a12 12 0 0 0 5 5l1-1.4 2.6 1.1V15a2 2 0 0 1-2.2 2A14.5 14.5 0 0 1 6 6.7 2 2 0 0 1 8 4.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}
