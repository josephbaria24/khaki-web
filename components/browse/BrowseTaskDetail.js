"use client";

import Link from "next/link";
import ChatAvatar from "@/components/chat/Avatar";
import HugeIcon, { Calendar, ChevronLeft, Clock, MapPin, ShieldCheck, Wallet } from "@/components/icons";
import { locationLabel } from "@/lib/browseMap";
import { graphicForTask, shortCategory } from "@/lib/catalog";
import { cn, formatDateTime, formatPHP, scheduleLabel, skillFitsTask, timeAgo } from "@/lib/khaki";
import { isTaskerMode } from "@/lib/roles";
import { describeExtras, describePins } from "@/lib/serviceTemplates";
import { displayName } from "@/lib/taskerProfile";

const STAGE_LABELS = {
  1: "Stage 1 · Registered",
  2: "Stage 2 · ID verified",
  3: "Stage 3 · Skill verified",
  4: "Stage 4 · Licensed",
  5: "Stage 5 · Pioneer",
};

function InfoTile({ icon: Icon, label, value, accent }) {
  return (
    <div className="rounded-2xl border border-[#E6DDD0]/90 bg-white/80 px-3.5 py-3 dark:border-white/10 dark:bg-[#1A1E27]/80">
      <div className="flex items-center gap-2">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-xl"
          style={{ backgroundColor: accent || "#E7EEF4" }}
        >
          <Icon className="h-4 w-4" color="#163044" />
        </span>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#2A3F4D]/45 dark:text-[#F5F3EE]/40">
          {label}
        </p>
      </div>
      <p className="mt-2 text-sm font-black leading-snug text-[#163044] dark:text-[#F5F3EE]">{value}</p>
    </div>
  );
}

export default function BrowseTaskDetail({
  task,
  poster,
  user,
  isAuthenticated,
  onReturnToMap,
  className,
}) {
  if (!task) return null;

  const graphic = graphicForTask(task);
  const name = displayName(poster?.full_name || task.client_name);
  const place = locationLabel(task);
  const when = scheduleLabel(task);
  const category = shortCategory(task.category) || "Task";
  const extras = describeExtras(task);
  const pins = task.is_remote ? [] : describePins(task);
  const minStage = Number(task.extras?.min_qualification) || 0;
  const tasker = isAuthenticated && isTaskerMode(user);
  const isOwn = user?.id && user.id === task.client_id;
  const qualified = !tasker || skillFitsTask(user?.skills, task);
  const loginHref = `/login?next=${encodeURIComponent(`/task/${task.id}`)}`;
  const status = String(task.status || "open").toLowerCase();
  const statusLabel = status === "open" ? "Open" : status.replace(/_/g, " ");

  let cta;
  if (!isAuthenticated) {
    cta = (
      <Link
        href={loginHref}
        className="flex h-12 items-center justify-center rounded-full bg-[#2F8AD4] text-sm font-black text-white transition hover:bg-[#2574b5]"
      >
        Log in to make an offer
      </Link>
    );
  } else if (isOwn) {
    cta = (
      <Link
        href={`/task/${task.id}`}
        className="flex h-12 items-center justify-center rounded-full bg-[#163044] text-sm font-black text-white"
      >
        Manage your task
      </Link>
    );
  } else if (tasker && !qualified) {
    cta = (
      <button
        type="button"
        disabled
        className="flex h-12 w-full cursor-not-allowed items-center justify-center rounded-full bg-[#E6DDD0] text-sm font-black text-[#6B6459] dark:bg-[#252A35] dark:text-[#F5F3EE]/45"
      >
        Not qualified
      </button>
    );
  } else {
    cta = (
      <Link
        href={`/task/${task.id}`}
        className="flex h-12 items-center justify-center rounded-full bg-[#2F8AD4] text-sm font-black text-white transition hover:bg-[#2574b5]"
      >
        Make an offer · {formatPHP(task.budget_php)}
      </Link>
    );
  }

  return (
    <div className={cn("flex h-full min-h-0 flex-col bg-[#FBF8F1] dark:bg-[#11141A]", className)}>
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Block scroll flow — not flex-col — so hero/cards cannot shrink to a strip */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="space-y-4 px-4 py-4 sm:px-5 lg:py-4">
            {onReturnToMap ? (
              <button
                type="button"
                onClick={onReturnToMap}
                className="inline-flex items-center gap-1 text-sm font-bold text-[#2F8AD4] hover:underline"
              >
                <ChevronLeft className="h-4 w-4" color="currentColor" />
                Return to map
              </button>
            ) : null}

            {/* Hero */}
            <div
              className="relative overflow-hidden rounded-[1.35rem] px-4 py-4 shadow-[0_10px_28px_rgba(42,63,77,0.08)] sm:px-5 sm:py-5"
              style={{
                background: `linear-gradient(145deg, ${graphic.bg} 0%, #FFFCF7 55%, #F7F4EC 100%)`,
              }}
            >
              <div className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full opacity-40" style={{ background: graphic.bg }} />
              <div className="relative flex items-start gap-3">
                <span
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-sm"
                  style={{ backgroundColor: "#fff" }}
                >
                  <HugeIcon name={graphic.icon} className="h-7 w-7" color={graphic.ink} strokeWidth={1.75} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#163044] px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-[#F7F4EC]">
                      {statusLabel}
                    </span>
                    <span className="rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-[#163044]">
                      {category}
                    </span>
                  </div>
                  <h2 className="mt-2 text-[1.55rem] font-black leading-tight tracking-tight text-[#163044] sm:text-[1.75rem]">
                    {task.title}
                  </h2>
                  <p className="mt-1 text-xs font-semibold text-[#2A3F4D]/65">
                    Posted {timeAgo(task.created_at)}
                    {task.created_at ? ` · ${formatDateTime(task.created_at)}` : ""}
                  </p>
                </div>
              </div>
              <div className="relative mt-4 flex items-end justify-between gap-3 border-t border-[#163044]/10 pt-3">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#163044]/45">Budget</p>
                  <p className="mt-0.5 text-2xl font-black text-[#163044]">{formatPHP(task.budget_php)}</p>
                </div>
                {minStage ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#163044]/90 px-2.5 py-1.5 text-[11px] font-black text-[#F7F4EC]">
                    <ShieldCheck className="h-3.5 w-3.5" color="#C8F0D8" />
                    {STAGE_LABELS[minStage] || `Stage ${minStage}`}
                  </span>
                ) : null}
              </div>
            </div>

            {/* Poster */}
            <div className="flex items-center gap-3 rounded-2xl border border-[#E6DDD0]/90 bg-white/90 p-3.5 dark:border-white/10 dark:bg-[#1A1E27]">
              <ChatAvatar name={name} src={poster?.avatar_url} size="md" className="ring-2 ring-white dark:ring-[#1A1E27]" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#2A3F4D]/45 dark:text-[#F5F3EE]/40">
                  Posted by
                </p>
                <p className="truncate text-sm font-black text-[#163044] dark:text-[#F5F3EE]">{name}</p>
                <p className="text-xs font-semibold text-[#2A3F4D]/55 dark:text-[#F5F3EE]/50">Poster on Khaki</p>
              </div>
              <Link
                href={`/task/${task.id}`}
                className="shrink-0 rounded-full bg-[#F3EFE3] px-3 py-1.5 text-[11px] font-black text-[#163044] dark:bg-[#252A35] dark:text-[#F5F3EE]"
              >
                View task
              </Link>
            </div>

            {/* Quick facts */}
            <div className="grid grid-cols-2 gap-2.5">
              <InfoTile icon={MapPin} label="Location" value={place} accent="#E4F0FA" />
              <InfoTile icon={Calendar} label="Schedule" value={when} accent="#E8F6EE" />
              <InfoTile icon={Clock} label="Timing" value="Flexible / Anytime" accent="#F7F0E4" />
              <InfoTile icon={Wallet} label="Pay" value={formatPHP(task.budget_php)} accent="#F3E8F6" />
            </div>

            {/* Structured extras */}
            {extras.length ? (
              <div className="rounded-2xl border border-[#E6DDD0]/90 bg-[#FFFCF7] p-3.5 dark:border-white/10 dark:bg-[#1A1E27]">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#2A3F4D]/45 dark:text-[#F5F3EE]/40">
                  Task specifics
                </p>
                <dl className="mt-2.5 space-y-2">
                  {extras.map((row) => (
                    <div key={row.key} className="grid grid-cols-[96px_minmax(0,1fr)] gap-2 text-sm">
                      <dt className="font-bold text-[#163044]/45 dark:text-[#F5F3EE]/40">{row.label}</dt>
                      <dd className="font-semibold text-[#163044] dark:text-[#F5F3EE]">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}

            {/* Pins */}
            {pins.length ? (
              <div className="rounded-2xl border border-[#E6DDD0]/90 bg-[#FFFCF7] p-3.5 dark:border-white/10 dark:bg-[#1A1E27]">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#2A3F4D]/45 dark:text-[#F5F3EE]/40">
                  Map pins
                </p>
                <ul className="mt-2 space-y-2">
                  {pins.map((pin) => (
                    <li key={pin.key} className="flex items-center justify-between gap-2 text-sm">
                      <span className="inline-flex items-center gap-2 font-semibold text-[#163044] dark:text-[#F5F3EE]">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: pin.color || "#163044" }} />
                        {pin.label}
                      </span>
                      {pin.url ? (
                        <a
                          href={pin.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold text-[#2F8AD4] hover:underline"
                        >
                          Open map
                        </a>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {/* Details */}
            <div className="rounded-2xl border border-[#E6DDD0]/90 bg-white/90 p-4 dark:border-white/10 dark:bg-[#1A1E27]">
              <h3 className="text-base font-black text-[#163044] dark:text-[#F5F3EE]">Details</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-relaxed text-[#2A3F4D]/75 dark:text-[#F5F3EE]/70">
                {task.details || "No extra details provided."}
              </p>
            </div>

            <Link
              href={`/task/${task.id}`}
              className="inline-flex items-center gap-1 text-sm font-bold text-[#2F8AD4] hover:underline"
            >
              Open full task page
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>

        <aside className="shrink-0 border-t border-[#E6DDD0] bg-[#FFFCF7] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] dark:border-white/10 dark:bg-[#1A1E27] sm:p-5 lg:w-[17.5rem] lg:border-l lg:border-t-0 lg:p-6 lg:pb-6">
          <div className="rounded-2xl bg-[#163044] px-4 py-3.5 text-[#F7F4EC]">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#F7F4EC]/55">
              Task budget
            </p>
            <p className="mt-1 text-3xl font-black">{formatPHP(task.budget_php)}</p>
            <p className="mt-1 text-[11px] font-semibold text-[#F7F4EC]/55">
              Settled directly with the tasker
            </p>
          </div>
          <div className="mt-3">{cta}</div>
          <Link
            href="/post"
            className="mt-2.5 flex h-10 items-center justify-center rounded-full border border-[#E6DDD0] text-xs font-bold text-[#163044] transition hover:bg-[#FBF8F1] dark:border-white/10 dark:text-[#F5F3EE] dark:hover:bg-[#252A35]"
          >
            Post a similar task
          </Link>
        </aside>
      </div>
    </div>
  );
}
