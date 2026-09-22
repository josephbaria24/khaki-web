import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import { formatPHP, scheduleLabel, timeAgo } from "@/lib/khaki";
import { shortCategory, styleForCategory } from "@/lib/catalog";
import StatusPill from "@/components/StatusPill";

export default function TaskCard({ task }) {
  const style = styleForCategory(task.category);
  const label = shortCategory(task.category);

  return (
    <Link href={`/task/${task.id}`} className="service-card block" style={{ backgroundColor: style.bg }}>
      <div className="relative z-10 max-w-[55%]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="glass-pill">{label}</span>
          {task.status ? <StatusPill status={task.status} /> : null}
        </div>
        <h3 className="mt-3 text-lg font-black leading-snug text-[#0F172A]">{task.title}</h3>
        <p className="mt-1 text-xs font-medium text-[#0F172A]/65">
          {task.is_remote ? "Remote" : task.location_area}
          {task.offer_count > 0 ? ` · ${task.offer_count} ${task.offer_count === 1 ? "offer" : "offers"}` : ""}
        </p>
        <p className="mt-2 text-sm font-black text-[#0F172A]">{formatPHP(task.budget_php)}</p>
        <p className="mt-1 text-[10px] font-semibold text-[#0F172A]/55">
          {scheduleLabel(task)} · {timeAgo(task.created_at)}
        </p>
        <span className="glass-cta mt-4">
          <span className="glass-cta-icon">
            <ArrowRight className="h-3.5 w-3.5" color="#fff" />
          </span>
          View task
        </span>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={style.image} alt="" className="card-cutout" />
    </Link>
  );
}
