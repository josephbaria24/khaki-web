import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import { FEATURED } from "@/lib/catalog";

export default function FeaturedCard({ href = FEATURED.href }) {
  return (
    <Link href={href} className="featured-card block" style={{ backgroundColor: FEATURED.bg }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {FEATURED.badges.map((b) => (
            <span key={b} className="glass-pill">{b}</span>
          ))}
        </div>
      </div>
      <p className="mt-5 text-xs font-semibold text-[#0F172A]/70">Palawan services</p>
      <h3 className="mt-1 max-w-[52%] text-2xl font-black leading-tight text-[#0F172A]">{FEATURED.title}</h3>
      <p className="mt-1 max-w-[48%] text-sm font-medium text-[#0F172A]/65">{FEATURED.subtitle}</p>
      <span className="glass-cta">
        <span className="glass-cta-icon">
          <ArrowRight className="h-4 w-4" color="#fff" />
        </span>
        Browse tasks
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={FEATURED.image} alt="" className="card-cutout" />
    </Link>
  );
}
