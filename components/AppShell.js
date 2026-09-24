"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { PageEnter } from "@/components/ui/motion";
import { isFillPage } from "@/lib/khaki";

export default function AppShell({ children }) {
  const { ready, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const seenAuth = useRef(false);
  if (isAuthenticated) seenAuth.current = true;

  useEffect(() => {
    if (ready && !isAuthenticated) router.replace("/login");
  }, [ready, isAuthenticated, router]);

  if (!seenAuth.current && (!ready || !isAuthenticated)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FBF8F1]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#C9D6E0] border-t-[#163044]" />
      </div>
    );
  }

  return (
    <PageEnter
      className={
        isFillPage(pathname) ? "flex h-full min-h-0 flex-col overflow-hidden" : "min-h-full"
      }
    >
      {children}
    </PageEnter>
  );
}
