import Link from "next/link";
import { Plus } from "@/components/icons";
import { cn } from "@/lib/khaki";

export default function DarkBanner({ href, onClick, icon: Icon, title, subtitle, className = "" }) {
  const content = (
    <div className={cn("dark-banner flex items-center gap-4 p-5 transition hover:brightness-110", className)}>
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10">
        <Icon className="h-6 w-6" color="#fff" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-black text-white">{title}</p>
        {subtitle && <p className="mt-0.5 text-sm text-white/70">{subtitle}</p>}
      </div>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15">
        <Plus className="h-5 w-5" color="#fff" />
      </span>
    </div>
  );

  if (href) return <Link href={href}>{content}</Link>;
  if (onClick) return <button type="button" onClick={onClick} className="w-full text-left">{content}</button>;
  return content;
}
