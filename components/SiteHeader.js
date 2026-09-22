"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "@/components/icons";
import { useState } from "react";
import Container from "@/components/Container";
import Logo from "@/components/Logo";
import { useAuth } from "@/lib/AuthContext";
import { cn } from "@/lib/khaki";
import { homePathFor } from "@/lib/roles";

const LINKS = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/browse", label: "Browse tasks" },
  { href: "/about", label: "About" },
];

export default function SiteHeader({ landing: _landing = false }) {
  const { isAuthenticated, user } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-40 border-b border-transparent bg-[#FBF8F1]"
    >
      <Container className="flex h-16 min-w-0 items-center justify-between gap-2 lg:h-[72px] lg:gap-4">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-full px-3 py-2 text-sm font-semibold transition",
                pathname === link.href ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {isAuthenticated ? (
            <Link href={homePathFor(user)} className="btn-olive inline-flex h-10 items-center px-5 text-sm">
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/register" className="inline-flex h-10 items-center rounded-full px-4 text-sm font-bold text-foreground hover:bg-muted">
                Sign up
              </Link>
              <Link href="/login" className="inline-flex h-10 items-center rounded-full px-4 text-sm font-bold text-foreground hover:bg-muted">
                Log in
              </Link>
              <Link href="/register?role=tasker" className="btn-olive inline-flex h-10 items-center px-5 text-sm">
                Become a Tasker
              </Link>
            </>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2 md:hidden">
          {!isAuthenticated && (
            <Link href="/register" className="btn-olive hidden h-9 items-center px-3 text-[11px] min-[380px]:inline-flex">
              Post a task
            </Link>
          )}
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-card"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </Container>
      {open && (
        <div className="bg-card px-4 py-3 shadow-card md:hidden">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm font-semibold">
              {link.label}
            </Link>
          ))}
          <div className="mt-2 grid grid-cols-2 gap-2">
            {isAuthenticated ? (
              <Link href={homePathFor(user)} onClick={() => setOpen(false)} className="btn-olive col-span-2 flex h-11 items-center justify-center">
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)} className="flex h-11 items-center justify-center rounded-full bg-muted font-bold">
                  Log in
                </Link>
                <Link href="/register?role=tasker" onClick={() => setOpen(false)} className="btn-olive flex h-11 items-center justify-center">
                  Become a Tasker
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
