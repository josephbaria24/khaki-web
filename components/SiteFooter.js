import Link from "next/link";
import Container from "@/components/Container";
import Logo from "@/components/Logo";
import { SERVICE_CATEGORIES } from "@/lib/khaki";

const LOCATIONS = ["Puerto Princesa", "El Nido", "Coron", "San Vicente"];

export default function SiteFooter() {
  return (
    <footer className="mt-auto bg-[#2C2A22] text-[#F7F4EC]">
      <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-5">
        <div className="sm:col-span-2">
          <Logo light />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#F7F4EC]/70">
            Palawan&apos;s jobs and services marketplace. Post a task, hire a local, and settle payment directly.
          </p>
        </div>
        <div>
          <p className="text-sm font-bold">Marketplace</p>
          <div className="mt-3 space-y-2 text-sm text-[#F7F4EC]/70">
            <Link href="/#how-it-works" className="block hover:text-[#F7F4EC]">How it works</Link>
            <Link href="/browse" className="block hover:text-[#F7F4EC]">Browse tasks</Link>
            <Link href="/post" className="block hover:text-[#F7F4EC]">Post a task</Link>
            <Link href="/register?role=tasker" className="block hover:text-[#F7F4EC]">Become a Tasker</Link>
          </div>
        </div>
        <div>
          <p className="text-sm font-bold">Popular categories</p>
          <div className="mt-3 space-y-2 text-sm text-[#F7F4EC]/70">
            {SERVICE_CATEGORIES.map((item) => (
              <Link key={item.key} href={item.key === "other" ? "/post" : "/browse"} className="block hover:text-[#F7F4EC]">{item.title}</Link>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm font-bold">Company</p>
          <div className="mt-3 space-y-2 text-sm text-[#F7F4EC]/70">
            <Link href="/about" className="block hover:text-[#F7F4EC]">About</Link>
            <Link href="/privacy" className="block hover:text-[#F7F4EC]">Privacy</Link>
            <Link href="/terms" className="block hover:text-[#F7F4EC]">Terms</Link>
            <p className="pt-2 text-xs">{LOCATIONS.join(" · ")}</p>
          </div>
        </div>
      </Container>
      <div className="border-t border-white/10 py-4">
        <Container className="flex flex-col gap-1 text-xs text-[#F7F4EC]/55 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Khaki Palawan</p>
          <p>2% posting fee until Feb 2027</p>
        </Container>
      </div>
    </footer>
  );
}
