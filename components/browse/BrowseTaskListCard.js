"use client";

import ChatAvatar from "@/components/chat/Avatar";
import HugeIcon, { Calendar, MapPin } from "@/components/icons";
import { locationLabel } from "@/lib/browseMap";
import { graphicForTask, shortCategory } from "@/lib/catalog";
import { cn, formatPHP, scheduleLabel } from "@/lib/khaki";
import { displayName } from "@/lib/taskerProfile";

export default function BrowseTaskListCard({ task, poster, selected, onSelect, offerCount }) {
  const graphic = graphicForTask(task);
  const name = displayName(poster?.full_name || task?.client_name);
  const place = locationLabel(task);
  const when = scheduleLabel(task);
  const category = shortCategory(task?.category) || "Task";
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
      <div className="flex items-start gap-3">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
          style={{ backgroundColor: graphic.bg }}
        >
          <HugeIcon name={graphic.icon} className="h-5 w-5" color={graphic.ink} strokeWidth={1.75} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#163044]/45 dark:text-[#F5F3EE]/45">
                {category}
              </p>
              <p className="mt-0.5 truncate text-[15px] font-black leading-snug text-[#163044] dark:text-[#F5F3EE]">
                {task.title}
              </p>
            </div>
            <p className="shrink-0 text-[15px] font-black text-[#163044] dark:text-[#F5F3EE]">
              {formatPHP(task.budget_php)}
            </p>
          </div>

          <div className="mt-2 space-y-1">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-[#2A3F4D]/65 dark:text-[#F5F3EE]/60">
              <MapPin className="h-3.5 w-3.5 shrink-0" color="currentColor" />
              <span className="truncate">{place}</span>
            </p>
            <p className="flex items-center gap-1.5 text-xs font-semibold text-[#2A3F4D]/65 dark:text-[#F5F3EE]/60">
              <Calendar className="h-3.5 w-3.5 shrink-0" color="currentColor" />
              <span className="truncate">{when}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#E6DDD0]/80 pt-2.5 dark:border-white/10">
        <div className="flex min-w-0 items-center gap-2">
          <ChatAvatar
            name={name}
            src={poster?.avatar_url}
            size="sm"
            className="ring-2 ring-white dark:ring-[#1A1E27]"
          />
          <div className="min-w-0">
            <p className="truncate text-[12px] font-black text-[#163044] dark:text-[#F5F3EE]">{name}</p>
            <p className="text-[10px] font-bold text-[#2A3F4D]/45 dark:text-[#F5F3EE]/40">Poster</p>
          </div>
        </div>
        <p className="shrink-0 text-xs font-bold text-[#2F8AD4]">{offers}</p>
      </div>
    </button>
  );
}
