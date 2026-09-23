import Link from "next/link";
import { LANDING, LANDING_CATEGORIES } from "@/lib/landingContent";

export default function CategoryBreakdown() {
  return (
    <div className="mt-10 grid gap-4 sm:grid-cols-2">
      {LANDING_CATEGORIES.map((cat, i) => (
        <article
          key={cat.key}
          className="rounded-[1.5rem] bg-[#FFFCF7] p-5 shadow-[0_8px_28px_rgba(42,63,77,0.08)]"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: LANDING.olive }}>
            {String(i + 1).padStart(2, "0")}
          </p>
          <h3 className="mt-1 text-lg font-black text-foreground">{cat.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{cat.desc}</p>
          <ul className="mt-4 space-y-3">
            {cat.groups.map((group) => (
              <li key={group.title}>
                <p className="text-sm font-bold text-foreground">{group.title}</p>
                <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">{group.desc}</p>
              </li>
            ))}
          </ul>
          <Link
            href={cat.href || "/browse"}
            className="mt-4 inline-flex text-sm font-bold underline-offset-4 hover:underline"
            style={{ color: LANDING.olive }}
          >
            {cat.key === "other" ? `Post ${cat.title}` : `Browse ${cat.title}`}
          </Link>
        </article>
      ))}
    </div>
  );
}
