import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Leaf } from "@/components/icons";
import { LANDING } from "@/lib/landingContent";
import { cn } from "@/lib/khaki";

export default function CategoryCard({ cat, compact = false }) {
  const label = cat.short || cat.title;

  return (
    <Link
      href={cat.href || "/browse"}
      className={cn(
        "category-tile interactive-card shrink-0",
        compact
          ? "flex w-[152px] flex-col rounded-[1.35rem] p-2"
          : "flex w-[228px] flex-col rounded-[1.6rem] p-2.5 sm:w-[248px]"
      )}
      style={{ ["--cat-tint"]: cat.bg || "#E8ECF0" }}
    >
      <div
        className={cn(
          "category-tile-photo relative overflow-hidden",
          compact ? "aspect-[5/4] rounded-[1.05rem]" : "aspect-[5/3.4] rounded-[1.2rem]"
        )}
        style={{ background: cat.bg }}
      >
        {cat.image ? (
          <Image
            src={cat.image}
            alt=""
            fill
            sizes="(max-width: 640px) 152px, 248px"
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
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0B1C2A]/45 via-transparent to-white/10" />
      </div>

      <div className={cn("flex min-w-0 flex-1 flex-col", compact ? "px-1.5 pb-1 pt-2.5" : "px-2 pb-1.5 pt-3")}>
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "min-w-0 font-black leading-tight tracking-tight text-[#163044] dark:text-[#F5F3EE]",
              compact ? "text-[13px]" : "text-[15px] sm:text-base"
            )}
          >
            {label}
          </p>
          <span
            className={cn(
              "category-tile-go shrink-0",
              compact ? "mt-0.5 h-7 w-7" : "mt-0.5 h-8 w-8"
            )}
            aria-hidden
          >
            <ArrowRight className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} strokeWidth={2.4} />
          </span>
        </div>
        <p
          className={cn(
            "leading-snug text-[#5F6B76] dark:text-[#A8B3C0]",
            compact ? "mt-1 line-clamp-2 text-[11px]" : "mt-1.5 line-clamp-2 text-[12.5px]"
          )}
        >
          {cat.desc}
        </p>
      </div>
    </Link>
  );
}
