import Link from "next/link";
import { cn } from "@/lib/khaki";

export default function GradientBanner({ href, badge, title, subtitle, className = "" }) {
  const inner = (
    <div className={cn("relative overflow-hidden rounded-[1.75rem] bg-[#C8F0D8] p-6 shadow-soft", className)}>
      {badge ? <span className="rounded-full bg-white/55 px-3 py-1 text-[11px] font-bold text-foreground">{badge}</span> : null}
      <h2 className="mt-3 text-2xl font-black leading-tight text-foreground">{title}</h2>
      {subtitle ? <p className="mt-2 text-sm text-foreground/65">{subtitle}</p> : null}
    </div>
  );
  if (href) return <Link href={href}>{inner}</Link>;
  return inner;
}
