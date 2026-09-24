"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "@/components/icons";
import Container from "@/components/Container";
import Logo from "@/components/Logo";
import ModeToggle from "@/components/ModeToggle";
import AccountMenu from "@/components/AccountMenu";
import NotificationsBell from "@/components/NotificationsBell";
import { useAuth } from "@/lib/AuthContext";
import { cn } from "@/lib/khaki";
import { canOpenPost, isAdmin, needsTaskerVerification } from "@/lib/roles";

const NAV = [
  { href: "/dashboard", label: "Home" },
  { href: "/browse", label: "Browse" },
  { href: "/my-jobs", label: "Trabaho" },
  { href: "/messages", label: "Mensahe" },
];

export default function AppHeader() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-transparent bg-[#FBF8F1]">
      <Container className="flex h-16 items-center justify-between gap-4 lg:h-[72px]">
        <div className="flex min-w-0 items-center gap-8">
          <Logo href="/dashboard" />
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) => {
              const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-semibold transition",
                    active ? "bg-[#163044] text-[#F7F4EC]" : "text-muted-foreground hover:text-foreground hover:bg-[#C9D6E0]/40"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="hidden sm:flex">
          <ModeToggle />
        </div>
        <div className="flex items-center gap-2 text-[#2A3F4D]">
          <NotificationsBell />
          {canOpenPost(user) && (
          <Link
            href="/post"
            className="btn-olive hidden h-10 items-center gap-1.5 px-4 text-sm lg:inline-flex"
          >
            <Plus className="h-4 w-4" color="currentColor" /> Post
          </Link>
          )}
          {isAdmin(user) && (
            <Link href="/admin" className="hidden h-10 items-center rounded-full bg-[#FFFCF7] px-4 text-sm font-semibold text-[#2A3F4D] shadow-card lg:inline-flex">
              Admin
            </Link>
          )}
          {needsTaskerVerification(user) && (
            <Link href="/verify" className="hidden h-10 items-center rounded-full bg-[#FFFCF7] px-4 text-sm font-semibold text-[#2A3F4D] shadow-card lg:inline-flex">
              Verify
            </Link>
          )}
          <AccountMenu />
        </div>
      </Container>
      <div className="flex justify-center px-4 pb-2 sm:hidden">
        <ModeToggle />
      </div>
    </header>
  );
}
