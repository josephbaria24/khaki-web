"use client";

import { usePathname } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import AdminPreviewBanner from "@/components/AdminPreviewBanner";
import BottomNav from "@/components/BottomNav";
import ModeSwitchOverlay from "@/components/ModeSwitchOverlay";
import TeamLeadWelcomeDialog from "@/components/team/TeamLeadWelcomeDialog";
import { useAuth } from "@/lib/AuthContext";
import { useAdminPreview } from "@/lib/AdminPreviewContext";
import { cn, isConversationPath, isFillPage, isTaskDetailPath, isTrackPath } from "@/lib/khaki";
import { isAdmin } from "@/lib/roles";

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
  const { ready, isAuthenticated, user } = useAuth();
  const { previewing } = useAdminPreview();
  const pathname = usePathname();
  const showChrome = ready && isAuthenticated && !isPublicPath(pathname);
  const onAdmin = pathname?.startsWith("/admin");
  const hideNav =
    onAdmin ||
    isConversationPath(pathname) ||
    isTrackPath(pathname) ||
    isTaskDetailPath(pathname);
  const lockScroll = isFillPage(pathname);
  const showUserChrome = !onAdmin || previewing;

  if (!showChrome) {
    return (
      <>
        {children}
        {isAuthenticated ? <TeamLeadWelcomeDialog /> : null}
      </>
    );
  }

  return (
    <div
      className={cn(
        "khaki-landing flex h-dvh max-h-dvh flex-col overflow-hidden transition-[padding-bottom] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none lg:pb-0",
        hideNav ? "pb-0" : "pb-[4.5rem]"
      )}
    >
      <div className="shrink-0">
        {isAdmin(user) && previewing ? <AdminPreviewBanner /> : null}
        <AppHeader />
      </div>
      <div className={cn("relative min-h-0 flex-1", lockScroll ? "overflow-hidden" : "overflow-y-auto")}>
        {children}
      </div>
      {showUserChrome ? <BottomNav hidden={hideNav} /> : null}
      {showUserChrome ? <ModeSwitchOverlay /> : null}
      {isAuthenticated ? <TeamLeadWelcomeDialog /> : null}
    </div>
  );
}
