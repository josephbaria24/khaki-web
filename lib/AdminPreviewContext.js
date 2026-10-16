"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { isAdmin } from "@/lib/roles";

export const ADMIN_PREVIEW_KEY = "khaki.adminPreview";

const AdminPreviewContext = createContext({
  previewing: false,
  enterUserPreview: () => {},
  exitUserPreview: () => {},
});

export function AdminPreviewProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [previewing, setPreviewing] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      setPreviewing(window.sessionStorage.getItem(ADMIN_PREVIEW_KEY) === "1");
    } catch {
      setPreviewing(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin(user)) {
      setPreviewing(false);
      try {
        window.sessionStorage.removeItem(ADMIN_PREVIEW_KEY);
      } catch {
        // ignore
      }
    }
  }, [isAuthenticated, user]);

  const enterUserPreview = useCallback(() => {
    if (!isAdmin(user)) return;
    try {
      window.sessionStorage.setItem(ADMIN_PREVIEW_KEY, "1");
    } catch {
      // ignore
    }
    setPreviewing(true);
    if (pathname?.startsWith("/admin")) router.push("/dashboard");
  }, [user, pathname, router]);

  const exitUserPreview = useCallback(() => {
    try {
      window.sessionStorage.removeItem(ADMIN_PREVIEW_KEY);
    } catch {
      // ignore
    }
    setPreviewing(false);
    router.push("/admin");
  }, [router]);

  const value = useMemo(
    () => ({ previewing: Boolean(isAdmin(user) && previewing), enterUserPreview, exitUserPreview }),
    [user, previewing, enterUserPreview, exitUserPreview]
  );

  return <AdminPreviewContext.Provider value={value}>{children}</AdminPreviewContext.Provider>;
}

export function useAdminPreview() {
  return useContext(AdminPreviewContext);
}
