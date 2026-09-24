import Link from "next/link";
import { MapPin, ShieldCheck, Wallet } from "@/components/icons";
import Logo from "@/components/Logo";

export default function AuthShell({ title, subtitle, footer, children }) {
  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-auth-aside p-10 text-foreground lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/40 dark:bg-white/5" />
        <div className="pointer-events-none absolute -bottom-16 -left-12 h-52 w-52 rounded-full bg-[#163044]/15 dark:bg-black/25" />
        <Logo href="/" />
        <div className="relative max-w-md">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground/60">Palawan marketplace</p>
          <h2 className="mt-3 text-4xl font-black leading-tight text-foreground xl:text-5xl">Get things done with trusted locals.</h2>
          <p className="mt-4 text-base leading-relaxed text-foreground/70">
            Post a task, compare offers, and hire a local. Khaki takes a 2% posting fee — you and the tasker settle the job payment yourselves.
          </p>
          <div className="mt-8 flex gap-6 text-sm text-foreground/70">
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" /> Direct pay</span>
            <span className="inline-flex items-center gap-1.5"><Wallet className="h-4 w-4" /> 2% post fee</span>
            <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" /> Palawan</span>
          </div>
        </div>
        <p className="relative text-sm text-foreground/50">© 2026 Khaki Palawan</p>
      </aside>
      <div className="flex items-center justify-center bg-background px-4 py-10 sm:px-8">
        <div className="soft-card w-full max-w-md p-6 sm:p-8">
          <div className="mb-6 lg:hidden">
            <Logo href="/" />
          </div>
          <h1 className="text-2xl font-black text-foreground sm:text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-6">{children}</div>
          {footer && <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>}
          <p className="mt-4 text-center text-xs">
            <Link href="/" className="font-semibold text-foreground hover:underline">Back to home</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
