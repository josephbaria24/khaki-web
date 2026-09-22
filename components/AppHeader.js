"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Plus } from "@/components/icons";
import Container from "@/components/Container";
import Logo from "@/components/Logo";
import ModeToggle from "@/components/ModeToggle";
import { useAuth } from "@/lib/AuthContext";
import { cn } from "@/lib/khaki";
import { canOpenPost, isAdmin, needsTaskerVerification } from "@/lib/roles";
import { api } from "@/lib/store";
const NAV = [
  { href: "/dashboard", label: "Home" },
  { href: "/browse", label: "Browse" },
  { href: "/my-jobs", label: "Trabaho" },
  { href: "/messages", label: "Mensahe" },
];

export default function AppHeader() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;
    let live = true;
    const pull = () => {
      api.notifications.unreadCount()
        .then((count) => {
          if (!live) return;
          setUnread(count);
        })
        .catch(() => {});
    };
    pull();
    const timer = setInterval(pull, 15000);
    return () => {
      live = false;
      clearInterval(timer);
    };
  }, [user, pathname]);

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
                    active ? "bg-[#3D5C6E] text-[#F7F4EC]" : "text-muted-foreground hover:text-foreground hover:bg-[#C9D6E0]/40"
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
          <Link href="/notifications" className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#FFFCF7] text-[#2A3F4D] shadow-card">
            <Bell className="h-5 w-5" color="#2A3F4D" />
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#3D5C6E] px-1 text-[10px] font-bold text-[#F7F4EC]">
                {unread}
              </span>
            )}
          </Link>
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
          <Link href="/profile" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#C9D6E0] text-sm font-black text-[#2A3F4D]">
            {(user?.full_name || "K").charAt(0)}
          </Link>
        </div>
      </Container>
      <div className="flex justify-center px-4 pb-2 sm:hidden">
        <ModeToggle />
      </div>
    </header>
  );
}
