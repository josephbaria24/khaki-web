"use client";

import { Calendar, Clock, MapPin } from "@/components/icons";
import { locationLabel } from "@/lib/browseMap";
import { avatarTone, cn, formatPHP, initials, scheduleLabel } from "@/lib/khaki";
import { displayName } from "@/lib/taskerProfile";

export default function BrowseTaskListCard({ task, poster, selected, onSelect, offerCount }) {
  const name = displayName(poster?.full_name || task?.client_name);
  const tone = avatarTone(name);
  const place = locationLabel(task);
  const when = scheduleLabel(task);
  const offers =
    typeof offerCount === "number" && offerCount > 0
      ? `Open · ${offerCount} offer${offerCount === 1 ? "" : "s"}`
      : "Open";

  return (
    <button
      type="button"
      onClick={() => onSelect?.(task.id)}
      className={cn(
        "w-full rounded-2xl border bg-[#FFFCF7] p-3.5 text-left shadow-[0_4px_16px_rgba(42,63,77,0.06)] transition dark:bg-[#1A1E27]",
        selected
          ? "border-[#2F8AD4] ring-2 ring-[#2F8AD4]/25"
          : "border-transparent hover:border-[#C9D6E0] dark:hover:border-white/15"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 text-[15px] font-black leading-snug text-[#163044] dark:text-[#F5F3EE]">
          {task.title}
        </p>
        <p className="shrink-0 text-[15px] font-black text-[#163044] dark:text-[#F5F3EE]">
          {formatPHP(task.budget_php)}
        </p>
      </div>

      <div className="mt-2.5 space-y-1.5">
        <p className="flex items-center gap-2 text-xs font-semibold text-[#2A3F4D]/65 dark:text-[#F5F3EE]/60">
          <MapPin className="h-3.5 w-3.5 shrink-0" color="currentColor" />
          <span className="truncate">{place}</span>
        </p>
        <p className="flex items-center gap-2 text-xs font-semibold text-[#2A3F4D]/65 dark:text-[#F5F3EE]/60">
          <Calendar className="h-3.5 w-3.5 shrink-0" color="currentColor" />
          <span className="truncate">{when}</span>
        </p>
        <p className="flex items-center gap-2 text-xs font-semibold text-[#2A3F4D]/65 dark:text-[#F5F3EE]/60">
          <Clock className="h-3.5 w-3.5 shrink-0" color="currentColor" />
          <span>Anytime</span>
        </p>
      </div>

      <div className="mt-3 flex items-end justify-between gap-2">
        <p className="text-xs font-bold text-[#2F8AD4]">{offers}</p>
        {poster?.avatar_url ? (
          <img
            src={poster.avatar_url}
            alt=""
            className="h-8 w-8 rounded-full object-cover ring-2 ring-white dark:ring-[#1A1E27]"
          />
        ) : (
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-black ring-2 ring-white dark:ring-[#1A1E27]"
            style={{ backgroundColor: tone.bg, color: tone.fg }}
          >
            {initials(name)}
          </span>
        )}
      </div>
    </button>
  );
}
