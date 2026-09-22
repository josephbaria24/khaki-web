import Link from "next/link";
import { cn } from "@/lib/khaki";

const PASTELS = {
  blue: "bg-[#D6E8FF]",
  coral: "bg-[#FFE4D6]",
  lavender: "bg-[#E8DEFF]",
  mint: "bg-[#C8F0D8]",
  pink: "bg-[#FAD4DC]",
};

export default function IconTile({ href, onClick, icon: Icon, label, gradient = "blue", className = "" }) {
  const bg = PASTELS[gradient] || PASTELS.blue;
  const inner = (
    <div className={cn("flex flex-col items-center gap-2", className)} onClick={onClick}>
      <span className={cn("flex h-14 w-14 items-center justify-center rounded-2xl shadow-card", bg)}>
        <Icon className="h-5 w-5" color="#0F172A" />
      </span>
      <span className="text-center text-xs font-bold text-foreground">{label}</span>
    </div>
  );
  if (href) return <Link href={href}>{inner}</Link>;
  return inner;
}
