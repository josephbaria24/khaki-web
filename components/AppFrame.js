"use client";

import { usePathname } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import ModeSwitchOverlay from "@/components/ModeSwitchOverlay";
import { useAuth } from "@/lib/AuthContext";
import { cn, isConversationPath } from "@/lib/khaki";

const PUBLIC_EXACT = new Set(["/", "/about", "/privacy", "/terms", "/jobs"]);

function isPublicPath(pathname) {
  if (PUBLIC_EXACT.has(pathname)) return true;
  return (
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password")
  );
}

export default function AppFrame({ children }) {
  const { ready, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const showChrome = ready && isAuthenticated && !isPublicPath(pathname);
  const hideNav = isConversationPath(pathname);

  if (!showChrome) return children;

  return (
    <div
      className={cn(
        "khaki-landing flex h-dvh max-h-dvh flex-col overflow-hidden transition-[padding-bottom] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none lg:pb-0",
        hideNav ? "pb-0" : "pb-[4.5rem]"
      )}
    >
      <div className="shrink-0">
        <AppHeader />
      </div>
      <div className={cn("relative min-h-0 flex-1", hideNav ? "overflow-hidden" : "overflow-y-auto")}>
        {children}
      </div>
      <BottomNav hidden={hideNav} />
      <ModeSwitchOverlay />
    </div>
  );
}
