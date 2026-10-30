import Link from "next/link";

export default function Logo({ href = "/", light = false, compact = false }) {
  return (
    <Link href={href} className="flex min-w-0 items-center gap-2 sm:gap-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/logo.png" alt="Khaki" className={`shrink-0 rounded-[22.5%] object-contain ${compact ? "h-9 w-9 sm:h-10 sm:w-10" : "h-10 w-10"}`} />
      <span className={`min-w-0 ${compact ? "hidden sm:block" : ""}`}>
        <span className={`block truncate text-xl font-black uppercase leading-none tracking-tight ${light ? "text-[#F7F4EC]" : "text-foreground"}`}>
          KHAKI
        </span>
        <span className={`mt-0.5 block truncate text-[10px] font-semibold ${compact ? "hidden sm:block" : "max-[359px]:hidden"} ${light ? "text-white/75" : "text-muted-foreground"}`}>
          Jobs & Services in Palawan
        </span>
      </span>
    </Link>
  );
}
