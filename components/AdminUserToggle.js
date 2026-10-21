"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAdminPreview } from "@/lib/AdminPreviewContext";
import { isAdmin } from "@/lib/roles";
import { useAuth } from "@/lib/AuthContext";

export default function AdminUserToggle({ className = "" }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { previewing, enterUserPreview, exitUserPreview } = useAdminPreview();

  if (!isAdmin(user)) return null;

  const onAdmin = pathname?.startsWith("/admin") && !previewing;

  const goAdmin = () => {
    if (previewing) {
      exitUserPreview();
      return;
    }
    if (!pathname?.startsWith("/admin")) router.push("/admin");
  };

  const goUser = () => {
    enterUserPreview();
  };

  return (
    <div
      className={`inline-flex rounded-full bg-[#C9D6E0]/55 p-1 dark:bg-[#252A35] ${className}`}
      role="tablist"
      aria-label="Admin view"
    >
      <button
        type="button"
        role="tab"
        aria-selected={onAdmin}
        onClick={goAdmin}
        className={`rounded-full px-3.5 py-1.5 text-xs font-black transition sm:px-4 ${
          onAdmin
            ? "bg-[#163044] text-[#F7F4EC] shadow-sm dark:bg-[#3A4656]"
            : "text-[#2A3F4D] hover:bg-white/50 dark:text-[#E8E4DC]/75 dark:hover:bg-white/10"
        }`}
      >
        Admin
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={!onAdmin}
        onClick={goUser}
        className={`rounded-full px-3.5 py-1.5 text-xs font-black transition sm:px-4 ${
          !onAdmin
            ? "bg-[#163044] text-[#F7F4EC] shadow-sm dark:bg-[#3A4656]"
            : "text-[#2A3F4D] hover:bg-white/50 dark:text-[#E8E4DC]/75 dark:hover:bg-white/10"
        }`}
      >
        User
      </button>
    </div>
  );
}
