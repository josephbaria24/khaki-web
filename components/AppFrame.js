"use client";

import { usePathname } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import ModeSwitchOverlay from "@/components/ModeSwitchOverlay";
import { useAuth } from "@/lib/AuthContext";

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

  if (!showChrome) return children;

  return (
    <div className="min-h-screen khaki-landing pb-[4.5rem] lg:pb-0">
      <AppHeader />
      {children}
      <BottomNav />
      <ModeSwitchOverlay />
    </div>
  );
}
