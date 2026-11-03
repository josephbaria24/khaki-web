import Link from "next/link";
import ChatAvatar from "@/components/chat/Avatar";
import HugeIcon, { ArrowRight, Calendar, MapPin } from "@/components/icons";
import { graphicForTask } from "@/lib/catalog";
import { displayTaskCategory, formatPHP, scheduleLabel } from "@/lib/khaki";

export default function OpenJobCard({ task, badge, posterName, posterSrc }) {
  const graphic = graphicForTask(task);
  const category = displayTaskCategory(task);
  const place = task.is_remote ? "Remote" : task.location_area || "Palawan";
  const when = scheduleLabel(task);

  return (
    <Link
      href={`/task/${task.id}`}
      className="group flex w-[min(78vw,280px)] shrink-0 snap-start flex-col overflow-hidden rounded-[1.45rem] bg-white shadow-card ring-1 ring-[#E4EDF4] transition hover:-translate-y-0.5 dark:bg-[#1A1E27] dark:ring-[#2A303C] sm:w-[268px]"
    >
      <div className="relative h-[108px] overflow-hidden px-3.5 pt-3" style={{ background: graphic.bg }}>
        <span className="pointer-events-none absolute -left-6 -top-8 h-24 w-24 rounded-full bg-white/40" aria-hidden />
        <span className="pointer-events-none absolute bottom-[-18px] right-16 h-16 w-16 rounded-full bg-white/25" aria-hidden />
        {graphic.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={graphic.image}
            alt=""
            className="pointer-events-none absolute -bottom-2 right-1 h-[92px] w-[92px] object-contain drop-shadow-[0_8px_10px_rgba(22,48,68,0.12)] transition duration-300 group-hover:scale-105"
          />
        ) : null}
        <div className="relative z-[1] flex items-start justify-between gap-2">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/85 shadow-sm"
            style={{ color: graphic.ink }}
          >
            <HugeIcon name={graphic.icon} className="h-[18px] w-[18px]" color={graphic.ink} strokeWidth={1.75} />
          </span>
          {badge ? (
            <span
              className="max-w-[118px] truncate rounded-full px-2 py-1 text-[10px] font-extrabold leading-4"
              style={{ backgroundColor: badge.bg, color: badge.fg }}
            >
              {badge.label}
            </span>
          ) : null}
        </div>
        <p className="relative z-[1] mt-3 max-w-[58%] text-[11px] font-black uppercase leading-tight tracking-[0.12em] text-[#163044]/80">
          {category}
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-3.5 pb-3.5 pt-3">
        <p className="line-clamp-2 min-h-[42px] text-[15px] font-black leading-snug text-[#163044] dark:text-[#F5F3EE]">
          {task.title}
        </p>
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className="money rounded-full bg-[#163044] px-2.5 py-1 text-[12px] font-black text-[#F7F4EC] dark:bg-[#E7F1FA] dark:text-[#163044]">
            {formatPHP(task.budget_php)}
          </span>
          <span className="inline-flex min-w-0 items-center gap-1 text-[11px] font-semibold text-[#5F6B76] dark:text-[#A8B3C0]">
            <MapPin className="h-3.5 w-3.5 shrink-0" color="currentColor" />
            <span className="truncate">{place}</span>
          </span>
        </div>
        {when ? (
          <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-[#5F6B76] dark:text-[#A8B3C0]">
            <Calendar className="h-3.5 w-3.5 shrink-0" color="currentColor" />
            {when}
          </p>
        ) : null}
        <div className="mt-auto flex items-center gap-2 pt-3">
          <ChatAvatar name={posterName} src={posterSrc} size="sm" className="h-7 w-7 text-[10px]" />
          <p className="min-w-0 flex-1 truncate text-[12px] font-bold text-[#2A3F4D] dark:text-[#E7EEF4]">{posterName}</p>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E7F1FA] text-[#163044] transition group-hover:bg-[#163044] group-hover:text-white dark:bg-[#243445] dark:text-[#E7F1FA]">
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.25} />
          </span>
        </div>
      </div>
    </Link>
  );
}
