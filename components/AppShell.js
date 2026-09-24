"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { PageEnter } from "@/components/ui/motion";

export default function AppShell({ children }) {
  const { ready, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !isAuthenticated) router.replace("/login");
  }, [ready, isAuthenticated, router]);

  if (!ready || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FBF8F1]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#C9D6E0] border-t-[#163044]" />
      </div>
    );
  }

  return <PageEnter>{children}</PageEnter>;
}
