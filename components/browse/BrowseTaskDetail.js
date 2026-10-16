"use client";

import Link from "next/link";
import { Calendar, MapPin } from "@/components/icons";
import { locationLabel } from "@/lib/browseMap";
import { avatarTone, cn, formatPHP, initials, scheduleLabel, skillFitsTask, timeAgo } from "@/lib/khaki";
import { isTaskerMode } from "@/lib/roles";
import { displayName } from "@/lib/taskerProfile";

export default function BrowseTaskDetail({
  task,
  poster,
  user,
  isAuthenticated,
  onReturnToMap,
  className,
}) {
  if (!task) return null;

  const name = displayName(poster?.full_name || task.client_name);
  const tone = avatarTone(name);
  const place = locationLabel(task);
  const when = scheduleLabel(task);
  const tasker = isAuthenticated && isTaskerMode(user);
  const isOwn = user?.id && user.id === task.client_id;
  const qualified = !tasker || skillFitsTask(user?.skills, task);
  const loginHref = `/login?next=${encodeURIComponent(`/task/${task.id}`)}`;

  let cta;
  if (!isAuthenticated) {
    cta = (
      <Link
        href={loginHref}
        className="flex h-12 items-center justify-center rounded-xl bg-[#2F8AD4] text-sm font-black text-white transition hover:bg-[#2574b5]"
      >
        Log in to make an offer
      </Link>
    );
  } else if (isOwn) {
    cta = (
      <Link
        href={`/task/${task.id}`}
        className="flex h-12 items-center justify-center rounded-xl bg-[#163044] text-sm font-black text-white"
      >
        Manage your task
      </Link>
    );
  } else if (tasker && !qualified) {
    cta = (
      <button
        type="button"
        disabled
        className="flex h-12 w-full cursor-not-allowed items-center justify-center rounded-xl bg-[#E6DDD0] text-sm font-black text-[#6B6459] dark:bg-[#252A35] dark:text-[#F5F3EE]/45"
      >
        Not qualified
      </button>
    );
  } else {
    cta = (
      <Link
        href={`/task/${task.id}`}
        className="flex h-12 items-center justify-center rounded-xl bg-[#2F8AD4] text-sm font-black text-white transition hover:bg-[#2574b5]"
      >
        Make an offer
      </Link>
    );
  }

  return (
    <div className={cn("flex h-full min-h-0 flex-col bg-[#FBF8F1] dark:bg-[#11141A]", className)}>
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          {onReturnToMap ? (
            <button
              type="button"
              onClick={onReturnToMap}
              className="mb-3 text-sm font-bold text-[#2F8AD4] hover:underline"
            >
              ← Return to map
            </button>
          ) : null}

          <div className="mb-4 flex gap-2 text-[11px] font-black tracking-wide text-[#2A3F4D]/45 dark:text-[#F5F3EE]/40">
            <span className="text-[#2F8AD4]">OPEN</span>
            <span aria-hidden>·</span>
            <span>ASSIGNED</span>
            <span aria-hidden>·</span>
            <span>COMPLETED</span>
          </div>

          <h2 className="text-2xl font-black leading-tight tracking-tight text-[#163044] dark:text-[#F5F3EE] sm:text-[1.75rem]">
            {task.title}
          </h2>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#2A3F4D]/45 dark:text-[#F5F3EE]/40">
                Posted by
              </p>
              <div className="mt-2 flex items-center gap-3">
                {poster?.avatar_url ? (
                  <img src={poster.avatar_url} alt="" className="h-11 w-11 rounded-full object-cover" />
                ) : (
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-black"
                    style={{ backgroundColor: tone.bg, color: tone.fg }}
                  >
                    {initials(name)}
                  </span>
                )}
                <div>
                  <p className="text-sm font-black text-[#163044] dark:text-[#F5F3EE]">{name}</p>
                  <p className="text-xs font-semibold text-[#2A3F4D]/55 dark:text-[#F5F3EE]/50">
                    {timeAgo(task.created_at)}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#2A3F4D]/45 dark:text-[#F5F3EE]/40">
                  Location
                </p>
                <p className="mt-1.5 flex items-start gap-2 text-sm font-semibold text-[#163044] dark:text-[#F5F3EE]">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" color="currentColor" />
                  <span>{place}</span>
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#2A3F4D]/45 dark:text-[#F5F3EE]/40">
                  To be done on
                </p>
                <p className="mt-1.5 flex items-start gap-2 text-sm font-semibold text-[#163044] dark:text-[#F5F3EE]">
                  <Calendar className="mt-0.5 h-4 w-4 shrink-0" color="currentColor" />
                  <span>
                    {when}
                    <span className="ml-1 font-medium text-[#2A3F4D]/55 dark:text-[#F5F3EE]/50">Anytime</span>
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-base font-black text-[#163044] dark:text-[#F5F3EE]">Details</h3>
            <p className="mt-3 whitespace-pre-wrap text-sm font-medium leading-relaxed text-[#2A3F4D]/75 dark:text-[#F5F3EE]/70">
              {task.details || "No extra details provided."}
            </p>
          </div>

          <Link
            href={`/task/${task.id}`}
            className="mt-6 inline-block text-sm font-bold text-[#2F8AD4] hover:underline"
          >
            Open full task page →
          </Link>
        </div>

        <aside className="shrink-0 border-t border-[#E6DDD0] bg-[#FFFCF7] p-5 dark:border-white/10 dark:bg-[#1A1E27] lg:w-[17.5rem] lg:border-l lg:border-t-0 lg:p-6">
          <div className="rounded-2xl bg-[#F7F4EC] p-4 dark:bg-[#252A35]">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#2A3F4D]/50 dark:text-[#F5F3EE]/45">
              Task budget
            </p>
            <p className="mt-2 text-3xl font-black text-[#163044] dark:text-[#F5F3EE]">
              {formatPHP(task.budget_php)}
            </p>
          </div>
          <div className="mt-4">{cta}</div>
          <Link
            href="/post"
            className="mt-3 flex h-10 items-center justify-center rounded-xl border border-[#E6DDD0] text-xs font-bold text-[#163044] transition hover:bg-[#FBF8F1] dark:border-white/10 dark:text-[#F5F3EE] dark:hover:bg-[#252A35]"
          >
            Post a similar task
          </Link>
        </aside>
      </div>
    </div>
  );
}
