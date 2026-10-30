"use client";

import { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "@/components/icons";
import Container from "@/components/Container";
import Logo from "@/components/Logo";
import AdminMenuButton from "@/components/AdminMenuButton";
import ModeToggle from "@/components/ModeToggle";
import AccountMenu from "@/components/AccountMenu";
import NotificationsBell from "@/components/NotificationsBell";
import { ThemeModeButton } from "@/components/ThemeToggle";
import { useAuth } from "@/lib/AuthContext";
import { useAdminPreview } from "@/lib/AdminPreviewContext";
import { cn } from "@/lib/khaki";
import { canPostTask, isAdmin, isPosterMode, needsTaskerVerification } from "@/lib/roles";

const NAV = [
  { href: "/dashboard", label: "Home" },
  { href: "/browse", label: "Browse" },
  { href: "/my-jobs", label: "Trabaho" },
  { href: "/messages", label: "Mensahe" },
];

export default function AppHeader() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { previewing } = useAdminPreview();
  const headerRef = useRef(null);
  const admin = isAdmin(user);
  const onAdmin = pathname?.startsWith("/admin");
  const showUserNav = !admin || previewing || !onAdmin;
  const showModeToggle = !admin || previewing;
  const showAdminToggle = admin && onAdmin && !previewing;
  const onSheet = pathname === "/dashboard" && isPosterMode(user);

  useLayoutEffect(() => {
    const node = headerRef.current;
    if (!node || typeof window === "undefined") return undefined;
    const sync = () => {
      /* bottom of header vs viewport top — includes safe-area chrome above the header */
      const bottom = Math.ceil(node.getBoundingClientRect().bottom);
      document.documentElement.style.setProperty("--khaki-header-offset", `${bottom + 12}px`);
    };
    sync();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(sync) : null;
    observer?.observe(node);
    window.addEventListener("resize", sync);
    window.visualViewport?.addEventListener("resize", sync);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", sync);
      window.visualViewport?.removeEventListener("resize", sync);
    };
  }, [showAdminToggle, showModeToggle, previewing]);

  return (
    <header
      ref={headerRef}
      className={cn(
        "sticky top-0 z-40 border-b-0 sm:border-b sm:border-transparent sm:dark:border-white/10",
        onSheet ? "bg-[#163044]" : "bg-white dark:bg-[#11141A]"
      )}
    >
      <Container className="flex h-16 items-center justify-between gap-1.5 sm:gap-4 lg:h-[72px]">
        <div className="flex min-w-0 items-center gap-3 sm:gap-6 lg:gap-8">
          {showAdminToggle ? <AdminMenuButton /> : null}
          <Logo compact light={onSheet} href={admin && onAdmin && !previewing ? "/admin" : "/dashboard"} />
          {showUserNav ? (
            <nav className="hidden items-center gap-1 lg:flex">
              {NAV.map((item) => {
                const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-semibold transition",
                      onSheet
                        ? active ? "bg-[#F7F4EC] text-[#163044]" : "text-[#F7F4EC]/75 hover:bg-white/10 hover:text-[#F7F4EC]"
                        : active ? "bg-[#163044] text-[#F7F4EC]" : "text-muted-foreground hover:text-foreground hover:bg-[#C9D6E0]/40"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          ) : null}
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-center sm:flex-none">
          {showModeToggle ? <ModeToggle track={onSheet ? "bg-[#0C2230] dark:bg-white/10" : "bg-[#163044] dark:bg-[#163044]"} /> : null}
        </div>
        <div className="flex shrink-0 items-center gap-1.5 text-[#2A3F4D] sm:gap-2">
          <ThemeModeButton onNavy={onSheet} />
          {showUserNav ? <NotificationsBell onNavy={onSheet} /> : null}
          {showUserNav && canPostTask(user) && (
          <Link
            href="/post"
            className="btn-olive hidden h-10 items-center gap-1.5 px-4 text-sm lg:inline-flex"
          >
            <Plus className="h-4 w-4" color="currentColor" /> Post
          </Link>
          )}
          {needsTaskerVerification(user) && (
            <Link href="/verify" className="btn-olive hidden h-10 items-center rounded-full px-4 text-sm font-semibold lg:inline-flex">
              Verify
            </Link>
          )}
          <AccountMenu />
        </div>
      </Container>
    </header>
  );
}
