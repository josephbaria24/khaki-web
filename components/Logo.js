import Link from "next/link";

export default function Logo({ href = "/", light = false }) {
  return (
    <Link href={href} className="flex min-w-0 items-center gap-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/logo.png" alt="Khaki" className="h-10 w-10 shrink-0 rounded-[22.5%] object-contain" />
      <span className="min-w-0">
        <span className={`block text-xl font-black uppercase leading-none tracking-tight ${light ? "text-white" : "text-foreground"}`}>
          KHAKI
        </span>
        <span className={`mt-0.5 block truncate text-[10px] font-semibold max-[359px]:hidden ${light ? "text-white/75" : "text-muted-foreground"}`}>
          Jobs & Services in Palawan
        </span>
      </span>
    </Link>
  );
}
