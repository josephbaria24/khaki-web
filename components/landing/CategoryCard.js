import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Leaf } from "@/components/icons";
import { LANDING } from "@/lib/landingContent";
import { cn } from "@/lib/khaki";

export default function CategoryCard({ cat, compact = false }) {
  return (
    <Link
      href={cat.href || "/browse"}
      className={cn(
        "category-tile interactive-card shrink-0",
        compact
          ? "w-[148px] rounded-[1.25rem] p-2.5"
          : "w-[220px] rounded-[1.5rem] p-3 sm:w-[240px]"
      )}
    >
      <div
        className={cn(
          "category-tile-photo relative overflow-hidden",
          compact ? "h-[4.75rem] rounded-[0.9rem]" : "h-36 rounded-[1.15rem]"
        )}
        style={{ background: cat.bg }}
      >
        {cat.image ? (
          <Image
            src={cat.image}
            alt=""
            fill
            sizes="(max-width: 640px) 148px, 240px"
            className="object-cover"
          />
        ) : (
          <>
            <div className="absolute -right-6 -top-8 h-28 w-28 rounded-full bg-white/35" />
            <div className="absolute bottom-4 right-5 h-14 w-20 rounded-full bg-[#163044]/15" />
            <div className="absolute bottom-5 left-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/55">
              <Leaf className="h-5 w-5" color={LANDING.oliveDeep} />
            </div>
          </>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#163044]/40 via-transparent to-transparent" />
        <span
          className={cn(
            "category-tile-go",
            compact ? "h-7 w-7" : "h-9 w-9"
          )}
          aria-hidden
        >
          <ArrowRight className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} color="#fff" />
        </span>
      </div>
      <p className={cn("font-black leading-tight text-foreground", compact ? "mt-2 text-[13px]" : "mt-3 text-base")}>
        {cat.title}
      </p>
      <p className={cn("leading-snug text-muted-foreground", compact ? "mt-0.5 line-clamp-2 text-[11px]" : "mt-1 text-sm")}>
        {cat.desc}
      </p>
    </Link>
  );
}
