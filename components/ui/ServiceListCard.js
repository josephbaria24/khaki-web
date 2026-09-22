import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import { formatPHP } from "@/lib/khaki";
import { shortCategory, styleForCategory } from "@/lib/catalog";

export default function ServiceListCard({ task, href }) {
  const style = styleForCategory(task.category);
  const to = href || `/task/${task.id}`;
  const label = shortCategory(task.category);

  return (
    <Link href={to} className="service-card block" style={{ backgroundColor: style.bg }}>
      <div className="relative z-10 max-w-[55%]">
        <span className="glass-pill">{label}</span>
        <h3 className="mt-3 text-lg font-black leading-snug text-[#0F172A]">{task.title}</h3>
        <p className="mt-1 text-xs font-medium text-[#0F172A]/65">
          {task.is_remote ? "Remote" : task.location_area}
        </p>
        <p className="mt-2 text-sm font-black text-[#0F172A]">{formatPHP(task.budget_php)}</p>
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
