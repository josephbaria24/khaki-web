"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, Home, MessageSquare, Plus, Search, User } from "@/components/icons";
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

export default function BottomNav({ hidden = false }) {
  const pathname = usePathname();
  const { user } = useAuth();

  const items = ITEMS.map((item) => {
    if (!item.center) return item;
    if (canOpenPost(user)) return { ...item, label: "Post" };
    if (isAdmin(user)) return { ...item, href: "/admin", label: "Admin" };
    if (needsTaskerVerification(user)) return { ...item, href: "/verify", label: "Verify" };
    return { ...item, href: "/browse", label: "Hanap", icon: Search };
  });
  const postItem = items.find((item) => item.center);

  return (
    <nav
      className={cn(
        "fixed bottom-4 left-4 right-4 z-40 lg:hidden",
        "transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
        hidden
          ? "pointer-events-none translate-y-[calc(100%+1.5rem)] opacity-0"
          : "translate-y-0 opacity-100"
      )}
      aria-hidden={hidden}
      inert={hidden || undefined}
    >
      <div className="relative mx-auto max-w-md pt-3">
        <div className="float-nav float-nav-notch relative flex h-14 items-center justify-around px-1.5">
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
              >
                <Icon className="h-[18px] w-[18px]" />
                {item.label}
              </Link>
            );
          })}

          {postItem ? (
            <Link
              href={postItem.href}
              aria-label={postItem.label}
              className="float-nav-post absolute left-1/2 top-0 z-20 flex h-[3.25rem] w-[3.25rem] items-center justify-center"
            >
              <span
                aria-hidden
                className="absolute left-1/2 top-1/2 h-[3.25rem] w-[3.25rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-background"
              />
              <span
                aria-hidden
                className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-card shadow-soft"
              />
              <span className="float-nav-post-core relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#163044] text-[#F7F4EC] shadow-soft">
                {(() => {
                  const CenterIcon = postItem.icon || Plus;
                  return <CenterIcon className="h-5 w-5" color="currentColor" />;
                })()}
              </span>
            </Link>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
