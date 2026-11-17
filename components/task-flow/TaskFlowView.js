"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "@/components/icons";
import ChatAvatar from "@/components/chat/Avatar";
import ClientPayCard from "@/components/escrow/ClientPayCard";
import ReportGawain from "@/components/ReportGawain";
import PinPreviewMap from "@/components/task/PinPreviewMap";
import { ActionBar, Button, Card, DetailGrid, HeldPaymentCard, Label, MetaLine, PartyCard, Pill, SecuredBanner, StateCard, StatusTimeline, WhatHappensNext, personBadges, softPanelClass } from "@/components/task-flow/parts";
import { AcceptTaskSheet, DisputeSheet, ProposeSheet, ReleaseSheet, RequestFixSheet } from "@/components/task-flow/sheets";
import { PhotoCompare, TaskChecklist } from "@/components/task-flow/TaskWork";
import { RatingPair, ReceiptCard } from "@/components/task-flow/Receipt";
import { canTrack } from "@/lib/deliveryTrack";
import { cn, displayTaskCategory, formatDateTime, formatPHP, scheduleLabel, skillFitsTask, timeAgo } from "@/lib/khaki";
import { canAcceptJobs, needsTaskerVerification } from "@/lib/roles";
import { describeExtras, describePins } from "@/lib/serviceTemplates";
import { api } from "@/lib/store";
import { displayName } from "@/lib/taskerProfile";
import { approximateArea, autoReleaseAt, countdownLabel, flowStage, openDetailRows, payoutBreakdown, priceRange, shortStamp, timelineSteps } from "@/lib/taskFlow";
import { toast } from "@/lib/toast";

const WORK_STAGES = ["assigned", "in_progress", "review", "disputed", "paid"];
const BANNER_FIRST = ["assigned", "in_progress", "review", "disputed", "paid"];

const STAGE_PILL = {
  open: { tone: "teal", label: "Open" },
  awaiting_payment: { tone: "amber", label: "Awaiting payment" },
  assigned: { tone: "navy", label: "Assigned" },
  in_progress: { tone: "navy", label: "In progress" },
  review: { tone: "amber", label: "Waiting for approval" },
  disputed: { tone: "red", label: "Disputed" },
  paid: { tone: "green", label: "Paid" },
  cancelled: { tone: "red", label: "Cancelled" },
};

function average(rows) {
  if (!rows?.length) return null;
  return { avg: rows.reduce((sum, row) => sum + Number(row.rating || 0), 0) / rows.length, count: rows.length };
}

function useNow(active) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return undefined;
    const id = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(id);
  }, [active]);
  return now;
}

export default function TaskFlowView({
  task,
  setTask,
  offers,
  hold,
  settings,
  user,
  isAuthenticated,
  poster,
  tasker,
  bidders,
  bidderRatings,
  review,
  clientReview,
  myReports,
  refresh,
  canEdit,
  editing,
  onToggleEdit,
  editForm,
}) {
  const router = useRouter();
  const [sheet, setSheet] = useState(null);
  const [clientRows, setClientRows] = useState([]);
  const [taskerRows, setTaskerRows] = useState([]);

  const isClient = user?.id === task.client_id;
  const isHiredTasker = Boolean(user?.id) && user?.id === task.accepted_tasker_id;
  const viewer = isClient ? "client" : isHiredTasker ? "tasker" : "guest";
  const stage = flowStage(task, hold);
  const rate = settings.tasker_fee_rate;
  const range = priceRange(task);
  const myOffer = offers.find((o) => o.tasker_id === user?.id);
  const accepted = offers.find((o) => o.status === "accepted");
  const agreedPrice = Number(hold?.amount_held ?? accepted?.amount_php ?? task.budget_php);
  const split = payoutBreakdown(agreedPrice, rate, hold);
  const canChat = Boolean(isClient || isHiredTasker || myOffer);
  const chatHref = `/task/${task.id}/chat`;
  const releaseAt = autoReleaseAt(task);
  const now = useNow(stage === "review");
  const remaining = releaseAt ? releaseAt - now : null;
  const fixes = task.extras?.progress?.fixes || [];
  const afterPhoto = task.extras?.progress?.after_url || task.extras?.progress?.proof_url;
  const steps = useMemo(() => timelineSteps(task, hold), [task, hold]);
  const extras = describeExtras(task);
  const participant = isClient || isHiredTasker;
  const pins = participant && !task.is_remote ? describePins(task) : [];
  const pending = offers.filter((o) => o.status === "pending");

  useEffect(() => {
    api.flow.clientRatings(task.client_id).then(setClientRows).catch(() => setClientRows([]));
  }, [task.client_id]);

  useEffect(() => {
    if (!task.accepted_tasker_id) return;
    api.reviews.listByTasker(task.accepted_tasker_id).then(setTaskerRows).catch(() => setTaskerRows([]));
  }, [task.accepted_tasker_id]);

  useEffect(() => {
    if (stage !== "review" || remaining == null || remaining > 0 || !participant) return;
    api.flow.autoRelease(task.id).then((next) => next && setTask(next)).then(refresh).catch(() => {});
  }, [stage, remaining != null && remaining <= 0]);

  const run = async (fn, success) => {
    try {
      const next = await fn();
      if (next?.id && next?.status) setTask(next);
      if (success) toast.success(success);
      setSheet(null);
      refresh();
    } catch (err) {
      toast.error(err.message || "Something went wrong");
      throw err;
    }
  };

  const confirmCancel = (message, fn, success) => {
    if (!window.confirm(message)) return;
    run(fn, success).catch(() => {});
  };

  const back = () => {
    if (window.history.length > 1) router.back();
    else router.push("/");
  };

  const pill = STAGE_PILL[stage] || STAGE_PILL.open;
  const showTimeline = !["open", "paid", "cancelled"].includes(stage);
  const canTaskerAct = isAuthenticated && !isClient && canAcceptJobs(user) && skillFitsTask(user?.skills, task);

  return (
    <div className="mx-auto w-full max-w-lg pb-36 pt-4 lg:max-w-5xl lg:pb-10 lg:pt-8">
      <div className="mb-3 flex items-center justify-between gap-2">
        <button type="button" onClick={back} className="inline-flex h-9 items-center gap-1 rounded-full pr-2 text-xs font-black text-[#5F6B76] hover:text-[#163044] dark:text-[#A8B3C0] dark:hover:text-[#F5F3EE]">
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        <div className="flex items-center gap-1.5">
          {canTrack(task, user?.id) ? (
            <Link href={`/task/${task.id}/track`} className="inline-flex h-9 items-center rounded-full bg-[#163044] px-3.5 text-xs font-black text-white dark:bg-[#F5F3EE] dark:text-[#11141A]">
              Track
            </Link>
          ) : null}
          {canChat ? (
            <Link href={chatHref} className="inline-flex h-9 items-center rounded-full border border-[#E6DDD0] bg-white px-3.5 text-xs font-black text-[#163044] dark:border-white/10 dark:bg-[#1A1E27] dark:text-[#F5F3EE]">
              Chat
            </Link>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-5">
        <div className="space-y-3">
          {BANNER_FIRST.includes(stage) ? (
            <StageCard
              stage={stage}
              viewer={viewer}
              task={task}
              split={split}
              remaining={remaining}
              fixes={fixes}
              taskerName={displayName(tasker?.full_name)}
            />
          ) : null}

          {stage === "open" ? (
            <OpenHero
              task={task}
              range={range}
              extras={extras}
              participant={participant}
              canEdit={canEdit}
              editing={editing}
              onToggleEdit={onToggleEdit}
            />
          ) : WORK_STAGES.includes(stage) ? (
            <WorkHero task={task} stage={stage} agreedPrice={agreedPrice} steps={steps} showTimeline={showTimeline} hold={hold} />
          ) : (
            <Card>
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone={pill.tone}>{pill.label}</Pill>
                <span className="text-[11px] font-semibold text-[#5F6B76] dark:text-[#A8B3C0]">
                  {displayTaskCategory(task)} · {timeAgo(task.created_at)}
                </span>
              </div>
              <h1 className="mt-2 text-[1.35rem] font-black leading-tight tracking-tight text-[#163044] dark:text-[#F5F3EE] sm:text-2xl">{task.title}</h1>
              <div className="mt-3">
                <Label>Task price</Label>
                <p className="money text-[1.75rem] font-black leading-none text-[#163044] dark:text-[#F5F3EE]">{formatPHP(agreedPrice)}</p>
              </div>
              {showTimeline ? (
                <div className="mt-4 border-t border-[#EFE7DA] pt-3 dark:border-white/5">
                  <StatusTimeline steps={steps} />
                </div>
              ) : null}
            </Card>
          )}

          {!BANNER_FIRST.includes(stage) ? (
            <StageCard
              stage={stage}
              viewer={viewer}
              task={task}
              split={split}
              remaining={remaining}
              fixes={fixes}
              taskerName={displayName(tasker?.full_name)}
            />
          ) : null}

          {["assigned", "in_progress"].includes(stage) && participant ? (
            <HeldPaymentCard price={split.price} payout={split.payout} viewer={viewer} />
          ) : null}

          {stage === "review" && participant ? (
            <HeldPaymentCard
              price={split.price}
              payout={split.payout}
              viewer={viewer}
              title={`${formatPHP(split.price)} Held by Khaki`}
              body={`${formatPHP(split.payout)} ready to release to the Tasker`}
              footer={
                viewer === "client"
                  ? "Payment releases only after you confirm completion."
                  : "Payment releases after the client confirms, or on auto-release."
              }
            />
          ) : null}

          {stage === "review" && participant ? (
            <WhatHappensNext
              items={
                viewer === "client"
                  ? [
                      { icon: "clock", title: "Auto-release", body: remaining != null ? `If you do nothing, payment auto-releases in ${countdownLabel(remaining)}.` : "If you do nothing, payment auto-releases after the waiting period." },
                      { icon: "alert", title: "Request a fix", body: "Ask the tasker to correct something. The auto-release timer pauses until they resubmit." },
                      { icon: "lock", title: "Dispute", body: "Open a dispute if something serious is wrong. Khaki Support reviews both sides while funds stay held." },
                    ]
                  : [
                      { icon: "clock", title: "Auto-release", body: remaining != null ? `If the client does nothing, payment auto-releases in ${countdownLabel(remaining)}.` : "If the client does nothing, payment auto-releases after the waiting period." },
                      { icon: "alert", title: "Request fix", body: "If the client asks for a fix, update the work and resubmit for approval." },
                      { icon: "lock", title: "Dispute", body: "If a dispute is opened, Khaki Support reviews both sides. Payment stays held until then." },
                    ]
              }
            />
          ) : null}

          {stage === "disputed" && participant ? (
            <WhatHappensNext
              items={[
                { icon: "lock", title: "Funds stay held", body: "Payment remains with Khaki until an admin decides." },
                { icon: "alert", title: "Support review", body: "Share clear details and proof in chat if Support asks." },
                { icon: "clock", title: "Decision", body: "An admin will release, refund, or ask for more info." },
              ]}
            />
          ) : null}

          {stage === "awaiting_payment" && isClient ? <ClientPayCard task={task} amount={agreedPrice} rate={rate} /> : null}

          {stage === "open" && isClient ? (
            <Proposals
              offers={pending}
              bidders={bidders}
              ratings={bidderRatings}
              onChoose={(offer) => run(() => api.offers.accept(offer.id), `${displayName(offer.tasker_name)} assigned`).catch(() => {})}
              taskId={task.id}
            />
          ) : null}

          {["assigned", "in_progress", "review", "disputed"].includes(stage) && participant ? (
            <TaskChecklist
              task={task}
              editable={isHiredTasker && stage === "in_progress"}
              onChange={setTask}
              hint={
                stage === "assigned"
                  ? "Start the task to check items off as you work."
                  : isHiredTasker && stage === "in_progress"
                    ? "Tick items as you finish them."
                    : undefined
              }
            />
          ) : null}

          {["in_progress", "review", "disputed", "paid"].includes(stage) && participant ? (
            <PhotoCompare task={task} editable={isHiredTasker && stage === "in_progress"} onChange={setTask} />
          ) : null}

          {stage === "paid" && participant ? (
            <>
              <div id="receipt"><ReceiptCard task={task} hold={hold} rate={rate} viewer={viewer} /></div>
              <RatingPair
                viewer={viewer}
                taskerReview={review}
                clientReview={clientReview}
                clientName={displayName(poster?.full_name || task.client_name)}
                taskerName={displayName(tasker?.full_name)}
                onRateTasker={(input) => run(() => api.reviews.create({ task_id: task.id, ...input }), "Thanks for rating").catch(() => {})}
                onRateClient={(input) => run(() => api.flow.rateClient({ task_id: task.id, ...input }), "Thanks for rating").catch(() => {})}
              />
              <p className="px-1 text-center text-[11px] font-semibold text-[#5F6B76] dark:text-[#A8B3C0]">
                This task is now closed — payment completed.
              </p>
            </>
          ) : null}

          {!isAuthenticated && stage === "open" ? (
            <Card>
              <p className="text-sm font-black text-[#163044] dark:text-[#F5F3EE]">Want this task?</p>
              <p className="mt-0.5 text-[12px] font-semibold text-[#5F6B76] dark:text-[#A8B3C0]">Log in as a verified tasker to accept it at the fixed price.</p>
            </Card>
          ) : null}

          {isAuthenticated && !isClient && stage === "open" && !canAcceptJobs(user) ? (
            needsTaskerVerification(user) ? (
              <StateCard tone="amber" icon="alert" title="Verify your account to accept tasks" body="Submit a government ID. The same check unlocks posting." aside={<Link href="/verify" className="text-xs font-black underline">Verify</Link>} />
            ) : (
              <StateCard tone="navy" icon="alert" title="Switch to Tasker mode" body="Use the mode toggle at the top to accept tasks." />
            )
          ) : null}

          {editing && canEdit ? editForm : null}
        </div>

        <aside className="space-y-3 lg:sticky lg:top-24">
          {stage !== "open" ? (
            <DetailsCard task={task} extras={extras} pins={pins} participant={participant} canEdit={canEdit} editing={editing} onToggleEdit={onToggleEdit} />
          ) : pins.length ? (
            <Card>
              <Label>Location</Label>
              <div className="mt-2 space-y-1.5">
                <PinPreviewMap pins={pins} />
                {pins.map((pin) => (
                  <a
                    key={pin.key}
                    href={pin.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn("flex items-center gap-2 rounded-xl px-3 py-2 text-[12px] font-black text-[#163044] dark:text-[#F5F3EE]", softPanelClass)}
                  >
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: pin.color }} />
                    <span className="min-w-0 flex-1 truncate">{pin.label}</span>
                    <span className="shrink-0 text-[#3A73C4] dark:text-[#7EB6F0]">Open in Maps →</span>
                  </a>
                ))}
              </div>
            </Card>
          ) : !participant && !task.is_remote ? (
            <Card className="flex items-start gap-3 p-3.5">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E5F4F2] text-sm dark:bg-[#123433]">🛡</span>
              <div className="min-w-0">
                <p className="text-sm font-black text-[#163044] dark:text-[#F5F3EE]">{approximateArea(task)}</p>
                <p className="mt-0.5 text-[12px] font-semibold text-[#5F6B76] dark:text-[#A8B3C0]">Approximate location shown for safety.</p>
              </div>
            </Card>
          ) : null}

          {isClient ? (
            tasker ? (
              <PartyCard label="Your tasker" person={tasker} rating={average(taskerRows)} href={`/u/${tasker.id}`} badges={personBadges(tasker)} />
            ) : null
          ) : (
            <PartyCard
              label="Client"
              person={poster}
              fallbackName={task.client_name}
              rating={average(clientRows)}
              href={`/u/${task.client_id}`}
              badges={personBadges(poster)}
            />
          )}

          {participant && ["in_progress", "review"].includes(stage) ? (
            <button type="button" onClick={() => setSheet("dispute")} className="w-full text-center text-xs font-black text-[#B42318] underline-offset-2 hover:underline dark:text-[#F59A9A]">
              Something wrong? Open a dispute
            </button>
          ) : null}

          {isAuthenticated && !participant && task.status !== "cancelled" ? (
            <ReportGawain
              taskId={task.id}
              alreadyReported={myReports.some((row) => ["pending_review", "under_review"].includes(row.status))}
              onDone={refresh}
            />
          ) : null}

          <FlowActions
            stage={stage}
            viewer={viewer}
            task={task}
            range={range}
            myOffer={myOffer}
            canChat={canChat}
            chatHref={chatHref}
            canTaskerAct={canTaskerAct}
            isAuthenticated={isAuthenticated}
            afterPhoto={afterPhoto}
            pendingCount={pending.length}
            onSheet={setSheet}
            onStart={() => run(() => api.flow.start(task.id), "Task started").catch(() => {})}
            onSubmit={() => run(() => api.flow.submit(task.id), "Sent to the client for approval").catch(() => {})}
            onDecline={() => confirmCancel("Decline this task? It goes back to other taskers.", () => api.offers.declineAssignment(task.id), "Task declined")}
            onCancelAssign={() => confirmCancel("Cancel this assignment? You can pick someone else after.", () => api.offers.cancelAssignment(task.id), "Assignment cancelled")}
            onCancelTask={() => confirmCancel("Cancel this task? Pending proposals will be declined.", () => api.tasks.cancel(task.id), "Task cancelled")}
          />
        </aside>
      </div>

      <AcceptTaskSheet
        open={sheet === "accept"}
        task={task}
        rate={rate}
        client={poster}
        clientRating={average(clientRows)}
        onClose={() => setSheet(null)}
        onConfirm={() => run(() => api.flow.acceptFixed(task.id), "Task accepted")}
      />
      <ProposeSheet
        open={sheet === "propose"}
        task={task}
        rate={rate}
        mine={myOffer?.status === "pending" ? myOffer : null}
        onClose={() => setSheet(null)}
        onSubmit={({ amount, pitch }) => run(() => api.offers.create({ task_id: task.id, amount_php: amount, pitch }), myOffer ? "Proposal updated" : "Proposal sent")}
      />
      <RequestFixSheet open={sheet === "fix"} used={fixes.length} onClose={() => setSheet(null)} onSubmit={(note) => run(() => api.flow.requestFix(task.id, note), "Fix requested")} />
      <DisputeSheet open={sheet === "dispute"} onClose={() => setSheet(null)} onSubmit={(input) => run(() => api.flow.dispute(task.id, input), "Dispute opened")} />
      <ReleaseSheet
        open={sheet === "release"}
        taskerName={displayName(tasker?.full_name)}
        amount={split.payout}
        onClose={() => setSheet(null)}
        onConfirm={async ({ rating, comment }) => {
          await run(() => api.flow.release(task.id), "Payment released");
          await api.reviews.create({ task_id: task.id, rating, comment }).catch(() => {});
          refresh();
        }}
      />
    </div>
  );
}

function WorkHero({ task, stage, agreedPrice, steps, showTimeline, hold }) {
  const completedAt = task?.extras?.progress?.times?.delivered;
  const paidAt = hold?.released_at || task?.extras?.progress?.times?.released;
  const statusLine =
    stage === "assigned" ? "Fixed · Assigned"
    : stage === "in_progress" ? "Fixed · In progress"
    : stage === "review" ? `Fixed · Completed${completedAt ? ` · ${shortStamp(completedAt)}` : ""}`
    : stage === "disputed" ? "Fixed · Disputed"
    : stage === "paid" ? `Fixed · Paid${paidAt ? ` · ${shortStamp(paidAt)}` : ""}`
    : "Fixed";

  return (
    <Card className="space-y-4">
      <div>
        <h1 className="text-[1.4rem] font-black leading-tight tracking-tight text-[#163044] dark:text-[#F5F3EE] sm:text-2xl">{task.title}</h1>
        <p className="money mt-1.5 text-lg font-black text-[#0F6B6B] dark:text-[#7FD6CF]">
          {formatPHP(agreedPrice)}
          <span className="ml-1.5 text-[12px] font-bold text-[#5F6B76] dark:text-[#A8B3C0]">{statusLine}</span>
        </p>
      </div>
      {showTimeline ? (
        <div>
          <Label>Status timeline</Label>
          <div className="mt-2">
            <StatusTimeline steps={steps} />
          </div>
        </div>
      ) : null}
    </Card>
  );
}

function OpenHero({ task, range, extras, participant, canEdit, editing, onToggleEdit }) {
  const detailRows = openDetailRows(task, extras);
  const priceLine = range.flexible ? `${formatPHP(range.min)}–${formatPHP(range.max)}` : formatPHP(range.fixed);
  const location = participant
    ? [task.location_area, task.barangay].filter(Boolean).join(", ") || (task.is_remote ? "Remote" : "")
    : approximateArea(task);

  return (
    <Card className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-[1.4rem] font-black leading-tight tracking-tight text-[#163044] dark:text-[#F5F3EE] sm:text-2xl">{task.title}</h1>
          <p className="money mt-1.5 text-lg font-black text-[#0F6B6B] dark:text-[#7FD6CF]">
            {priceLine}
            <span className="ml-1.5 text-[12px] font-bold text-[#5F6B76] dark:text-[#A8B3C0]">
              {range.flexible ? "Range · Fixed when accepted" : "Fixed"}
            </span>
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <Pill tone="teal">Open</Pill>
          {canEdit ? (
            <button type="button" onClick={onToggleEdit} className="text-[11px] font-black text-[#3A73C4] dark:text-[#7EB6F0]">
              {editing ? "Close edit" : "Edit"}
            </button>
          ) : null}
        </div>
      </div>

      <MetaLine location={location} posted={`Posted ${timeAgo(task.created_at)}`} />

      {task.details ? (
        <div>
          <Label>What needs to be done</Label>
          <p className="mt-1.5 whitespace-pre-line text-[13px] font-medium leading-relaxed text-[#2A3F4D] dark:text-[#E7EEF4]">{task.details}</p>
        </div>
      ) : null}

      {detailRows.length ? (
        <div>
          <Label>Details</Label>
          <div className="mt-2">
            <DetailGrid rows={detailRows} />
          </div>
        </div>
      ) : null}

      <p className="text-[11px] font-semibold text-[#5F6B76] dark:text-[#A8B3C0]">
        {displayTaskCategory(task)}
        {range.flexible ? ` · Accept at ${formatPHP(range.fixed)} or propose inside the range` : " · No bidding · Fixed price"}
      </p>
    </Card>
  );
}

function StageCard({ stage, viewer, task, split, remaining, fixes, taskerName }) {
  const lastFix = fixes[fixes.length - 1];
  if (stage === "open") {
    if (viewer === "client") {
      return <StateCard tone="navy" icon="clock" title="Waiting for a tasker" body="Taskers accept your fixed price, or propose one inside your range. You pay only after someone is assigned." />;
    }
    return (
      <SecuredBanner
        body="Funds are held securely until the task is completed and released to the Tasker."
      />
    );
  }
  if (stage === "awaiting_payment") {
    return viewer === "client"
      ? <StateCard tone="amber" icon="wallet" title={`Pay ${formatPHP(split.price)} to secure ${taskerName || "your tasker"}`} body="Khaki holds it. Nothing goes to the tasker until you approve the work." />
      : <StateCard tone="amber" icon="clock" title="Waiting for the client to pay" body="You can start as soon as the payment is held by Khaki." />;
  }
  if (stage === "assigned") {
    return viewer === "tasker" ? (
      <SecuredBanner
        icon="check"
        title="Task Assigned"
        body="You are now assigned to this task. You can start when ready."
      />
    ) : (
      <SecuredBanner
        icon="check"
        title="Task Assigned"
        body={`${taskerName || "Your tasker"} is assigned and can start when ready.`}
      />
    );
  }
  if (stage === "in_progress") {
    if (lastFix) {
      return <StateCard tone="amber" icon="alert" title="Fix requested" body={lastFix.note} />;
    }
    return viewer === "tasker"
      ? <StateCard tone="navy" icon="clock" title="Task in progress" body="Tick the checklist, add before & after photos, then submit for approval." />
      : <StateCard tone="navy" icon="clock" title="Task in progress" body="Your tasker is working. Payment stays held until you approve the finished work." />;
  }
  if (stage === "review") {
    const aside = remaining != null ? (
      <div>
        <p className="text-[10px] font-black uppercase tracking-wide opacity-70">Auto-release</p>
        <p className="text-base font-black">{countdownLabel(remaining)}</p>
      </div>
    ) : null;
    return viewer === "client" ? (
      <StateCard
        tone="amber"
        icon="clock"
        title="Task Completed — Waiting for your confirmation"
        body="Task marked complete by the Tasker. Review the work and release payment, or request a fix."
        aside={aside}
      />
    ) : (
      <StateCard
        tone="amber"
        icon="clock"
        title="Waiting for Approval — Task Completed"
        body="Awaiting client approval to release payment. Funds stay held until then."
        aside={aside}
      />
    );
  }
  if (stage === "disputed") {
    return <StateCard tone="red" icon="alert" title="Dispute under review" body="An admin is checking both sides. The payment stays held until they decide." />;
  }
  if (stage === "paid") {
    return (
      <SecuredBanner
        icon="check"
        title="Paid — Task Complete"
        body={
          viewer === "tasker"
            ? `${formatPHP(split.payout)} is in your wallet. Withdraw anytime to GCash, Maya, or bank.`
            : "Payment has been released successfully."
        }
      />
    );
  }
  return <StateCard tone="red" icon="alert" title="This task was cancelled" body={task.status === "cancelled" ? "It no longer shows in Browse." : ""} />;
}

function Proposals({ offers, bidders, ratings, onChoose, taskId }) {
  if (!offers.length) {
    return (
      <Card className="text-center">
        <p className="text-sm font-black text-[#163044] dark:text-[#F5F3EE]">No proposals yet</p>
        <p className="mt-0.5 text-[12px] font-semibold text-[#5F6B76] dark:text-[#A8B3C0]">A tasker can also take it at your fixed price.</p>
        <Link href={`/task/${taskId}/taskers`} className="mt-3 inline-flex h-9 items-center rounded-full bg-[#E7F1FA] px-4 text-xs font-black text-[#163044] dark:bg-[#24303C] dark:text-[#F5F3EE]">
          Find a tasker
        </Link>
      </Card>
    );
  }
  return (
    <Card>
      <div className="flex items-center justify-between">
        <Label>Proposals</Label>
        <span className="text-[11px] font-black text-[#5F6B76] dark:text-[#A8B3C0]">{offers.length}</span>
      </div>
      <ul className="mt-2 space-y-2">
        {offers.map((offer) => {
          const person = bidders[offer.tasker_id];
          const name = displayName(person?.full_name || offer.tasker_name);
          const r = ratings[offer.tasker_id];
          return (
            <li key={offer.id} className="flex items-center gap-3 rounded-2xl bg-[#F7F4EC] p-2.5 dark:bg-[#11141A]">
              <ChatAvatar name={name} src={person?.avatar_url} size="sm" className="h-10 w-10 text-xs" />
              <div className="min-w-0 flex-1">
                <Link href={`/u/${offer.tasker_id}`} className="block truncate text-sm font-black text-[#163044] dark:text-[#F5F3EE]">{name}</Link>
                <p className="truncate text-[11px] font-semibold text-[#5F6B76] dark:text-[#A8B3C0]">
                  {r?.count ? `★ ${r.avg.toFixed(1)} (${r.count})` : "New tasker"}
                  {offer.pitch ? ` · ${offer.pitch}` : ""}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="money text-sm font-black text-[#163044] dark:text-[#F5F3EE]">{formatPHP(offer.amount_php)}</p>
                <button type="button" onClick={() => onChoose(offer)} className="mt-1 h-7 rounded-full bg-[#1F9D6A] px-3 text-[11px] font-black text-white">
                  Choose
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function DetailsCard({ task, extras, pins, participant, canEdit, editing, onToggleEdit }) {
  const rows = [
    ["Schedule", scheduleLabel(task)],
    ["Location", participant ? [task.location_area, task.barangay, task.location_detail].filter(Boolean).join(" · ") || "Remote" : approximateArea(task)],
    ...extras.map((row) => [row.label, row.value]),
    ["Posted", formatDateTime(task.created_at)],
  ].filter(([, v]) => v);

  return (
    <Card>
      <div className="flex items-center justify-between">
        <Label>Details</Label>
        {canEdit ? (
          <button type="button" onClick={onToggleEdit} className="text-[11px] font-black text-[#3A73C4] dark:text-[#7EB6F0]">
            {editing ? "Close edit" : "Edit"}
          </button>
        ) : null}
      </div>
      {task.details ? <p className="mt-2 whitespace-pre-line text-[13px] font-medium leading-relaxed text-[#2A3F4D] dark:text-[#E7EEF4]">{task.details}</p> : null}
      <dl className="mt-3 divide-y divide-[#EFE7DA] dark:divide-white/5">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-start justify-between gap-3 py-2">
            <dt className="shrink-0 text-[12px] font-semibold text-[#5F6B76] dark:text-[#A8B3C0]">{k}</dt>
            <dd className="text-right text-[13px] font-black text-[#163044] dark:text-[#F5F3EE]">{v}</dd>
          </div>
        ))}
      </dl>
      {!participant && !task.is_remote ? (
        <p className="mt-1 text-[11px] font-semibold text-[#5F6B76] dark:text-[#A8B3C0]">Exact location is shared after you're assigned.</p>
      ) : null}
      {pins.length ? (
        <div className="mt-2 space-y-1.5">
          <PinPreviewMap pins={pins} />
          {pins.map((pin) => (
            <a
              key={pin.key}
              href={pin.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn("flex items-center gap-2 rounded-xl px-3 py-2 text-[12px] font-black text-[#163044] dark:text-[#F5F3EE]", softPanelClass)}
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: pin.color }} />
              <span className="min-w-0 flex-1 truncate">{pin.label}</span>
              <span className="shrink-0 text-[#3A73C4] dark:text-[#7EB6F0]">Open in Maps →</span>
            </a>
          ))}
        </div>
      ) : null}
    </Card>
  );
}

function FlowActions({
  stage,
  viewer,
  task,
  range,
  myOffer,
  canChat,
  chatHref,
  canTaskerAct,
  isAuthenticated,
  afterPhoto,
  pendingCount,
  onSheet,
  onStart,
  onSubmit,
  onDecline,
  onCancelAssign,
  onCancelTask,
}) {
  const message = canChat ? <Button variant="outline" href={chatHref}>Message</Button> : null;
  let buttons = null;
  let extra = null;

  if (stage === "open") {
    if (viewer === "client") {
      buttons = (
        <>
          <Button variant="danger" onClick={onCancelTask}>Cancel task</Button>
          <Button variant="soft" href={`/task/${task.id}/taskers`}>{pendingCount ? "Find more" : "Find a tasker"}</Button>
        </>
      );
    } else if (!isAuthenticated) {
      buttons = <Button href={`/login?next=${encodeURIComponent(`/task/${task.id}`)}`}>Log in to accept</Button>;
    } else if (canTaskerAct) {
      const proposed = myOffer?.status === "pending";
      buttons = (
        <>
          {message || (range.flexible ? <Button variant="outline" onClick={() => onSheet("propose")}>Propose</Button> : null)}
          <Button variant="green" onClick={() => onSheet("accept")}>Accept at {formatPHP(range.fixed)}</Button>
        </>
      );
      if (range.flexible && message) {
        extra = (
          <button type="button" onClick={() => onSheet("propose")} className="w-full text-center text-xs font-black text-[#3A73C4] dark:text-[#7EB6F0]">
            {proposed ? `Your proposal: ${formatPHP(myOffer.amount_php)} · Update` : "Propose a different price"}
          </button>
        );
      }
    }
  } else if (stage === "awaiting_payment") {
    buttons = viewer === "client"
      ? <>{message}<Button variant="danger" onClick={onCancelAssign}>Cancel assign</Button></>
      : viewer === "tasker"
        ? <><Button variant="danger" onClick={onDecline}>Decline</Button>{message}</>
        : null;
  } else if (stage === "assigned") {
    buttons = viewer === "tasker"
      ? <><Button variant="green" onClick={onStart}>Start task</Button>{message || null}</>
      : viewer === "client" ? message : null;
  } else if (stage === "in_progress") {
    buttons = viewer === "tasker"
      ? <>{message}<Button variant="green" disabled={!afterPhoto} onClick={onSubmit}>{afterPhoto ? "Submit for approval" : "Add after photo first"}</Button></>
      : viewer === "client" ? message : null;
  } else if (stage === "review") {
    buttons = viewer === "client"
      ? <><Button variant="outline" onClick={() => onSheet("fix")}>Request fix</Button><Button variant="green" onClick={() => onSheet("release")}>Confirm & release</Button></>
      : viewer === "tasker"
        ? <><Button variant="outline" onClick={() => onSheet("dispute")}>Dispute</Button>{message}</>
        : null;
  } else if (stage === "disputed") {
    buttons = viewer !== "guest" ? message : null;
  } else if (stage === "paid") {
    buttons = viewer === "client"
      ? (
        <>
          <Button variant="outline" href="#receipt">View receipt</Button>
          <Button variant="outline" href={`/post?category=${task.extras?.service_key || ""}`}>Book again</Button>
          <Button variant="green" href="/">Back to home</Button>
        </>
      )
      : viewer === "tasker"
        ? (
          <>
            <Button variant="outline" href="#receipt">View receipt</Button>
            <Button variant="outline" href="/wallet">Wallet</Button>
            <Button variant="green" href="/">Back to home</Button>
          </>
        )
        : null;
  }

  if (!buttons && !extra) return null;
  return (
    <>
      {extra}
      {buttons ? <ActionBar>{buttons}</ActionBar> : null}
    </>
  );
}
