"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { leaveSheet, markSheet } from "@/components/ui/motion";
import { Briefcase, Home, MessageSquare, Plus, Search, User, X } from "@/components/icons";
import ActiveJobDock from "@/components/ActiveJobDock";
import { cn } from "@/lib/khaki";
import { canOpenPost, isAdmin, needsTaskerVerification } from "@/lib/roles";
import { useAuth } from "@/lib/AuthContext";

const ITEMS = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/my-jobs", label: "Trabaho", icon: Briefcase },
  { href: "/post", label: "Post", icon: Plus, center: true },
  { href: "/messages", label: "Mensahe", icon: MessageSquare },
  { href: "/profile", label: "Profile", icon: User },
];

function tabActive(pathname, href) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

const POST_TIP_KEY = "khaki.postTip";

export default function BottomNav({ hidden = false }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [showTip, setShowTip] = useState(false);
  const [tipLeaving, setTipLeaving] = useState(false);
  const tipGone = useRef(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(POST_TIP_KEY) !== "1") setShowTip(true);
    } catch {
      setShowTip(true);
    }
  }, []);

  const finishTip = () => {
    if (tipGone.current) return;
    tipGone.current = true;
    setShowTip(false);
  };

  const dismissTip = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (tipLeaving) return;
    setTipLeaving(true);
    try {
      window.localStorage.setItem(POST_TIP_KEY, "1");
    } catch {
      /* private mode */
    }
    window.setTimeout(finishTip, 300);
  };

  const items = ITEMS.map((item) => {
    if (!item.center) return item;
    if (needsTaskerVerification(user)) return { ...item, href: "/verify", label: "Verify" };
    if (canOpenPost(user)) return { ...item, label: "Post" };
    if (isAdmin(user)) return { ...item, href: "/admin", label: "Admin" };
    return { ...item, href: "/browse", label: "Hanap", icon: Search };
  });
  const postItem = items.find((item) => item.center);
  const compact = pathname === "/browse" || pathname.startsWith("/browse/");
  const ease = "duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]";

  return (
    <nav
      className={cn(
        "fixed left-4 right-4 z-40 lg:hidden",
        compact
          ? "bottom-[max(0.5rem,env(safe-area-inset-bottom,0px))]"
          : "bottom-[max(1rem,env(safe-area-inset-bottom,0px))]",
        "transition-[bottom,transform,opacity]",
        ease,
        hidden
          ? "pointer-events-none translate-y-[calc(100%+1.5rem)] opacity-0"
          : "translate-y-0 opacity-100"
      )}
      aria-hidden={hidden}
      inert={hidden || undefined}
    >
      <div className="relative mx-auto max-w-md pt-3">
        <ActiveJobDock />
        <div className={cn("float-nav float-nav-notch relative flex items-center justify-around px-1.5 transition-[height]", ease, compact ? "is-compact h-12" : "h-14")}>
          {items.map((item) => {
            const active = tabActive(pathname, item.href);
            const Icon = item.icon;

            if (item.center) {
              return <div key="post-slot" className="w-10 flex-shrink-0" aria-hidden />;
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn("float-nav-tab", active && "is-active")}
                onClick={(event) => {
                  const sheet = document.querySelector(".sheet-page:not(.is-leaving)");
                  if (!sheet || active) return;
                  event.preventDefault();
                  leaveSheet().then(() => router.push(item.href));
                }}
              >
                <Icon className="h-[18px] w-[18px]" />
                {item.label}
              </Link>
            );
          })}

          {postItem ? (
            <>
              <Link
                href={postItem.href}
                aria-label={postItem.label}
                onClick={() => markSheet(postItem.href)}
                className={cn(
                  "float-nav-post absolute left-1/2 top-0 z-20 flex items-center justify-center transition-[width,height]",
                  ease,
                  compact ? "h-11 w-11" : "h-[3.25rem] w-[3.25rem]"
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-card shadow-soft transition-[width,height]",
                    ease,
                    compact ? "h-10 w-10" : "h-12 w-12"
                  )}
                />
                <span className={cn(
                  "float-nav-post-core relative z-10 flex shrink-0 items-center justify-center rounded-full bg-[#163044] text-[#F7F4EC] shadow-soft transition-[width,height] dark:bg-[#F5F3EE] dark:text-[#11141A]",
                  ease,
                  compact ? "h-9 w-9" : "h-11 w-11"
                )}>
                  {(() => {
                    const CenterIcon = postItem.icon || Plus;
                    return <CenterIcon className="float-nav-post-icon h-5 w-5" color="currentColor" />;
                  })()}
                </span>
              </Link>
              {showTip && postItem.href === "/post" && !compact ? (
                <div
                  className={cn(
                    "absolute bottom-[calc(100%+2.65rem)] left-1/2 z-30 flex origin-bottom -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full bg-[#163044] py-1 pl-2.5 pr-1 text-[11px] font-bold text-[#F7F4EC] shadow-[0_8px_20px_rgba(22,48,68,0.28)]",
                    tipLeaving && "post-tip-out"
                  )}
                  onAnimationEnd={finishTip}
                >
                  Post a task
                  <button
                    type="button"
                    onClick={dismissTip}
                    className="flex h-5 w-5 items-center justify-center rounded-full text-[#F7F4EC] hover:bg-white/15"
                    aria-label="Close"
                  >
                    <X className="h-3 w-3" color="currentColor" />
                  </button>
                  <span className="absolute left-1/2 top-full -translate-x-1/2 border-x-[6px] border-b-0 border-t-[7px] border-x-transparent border-t-[#163044]" aria-hidden />
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
