"use client";

import { useAdminPreview } from "@/lib/AdminPreviewContext";

export default function AdminPreviewBanner() {
  const { previewing, exitUserPreview } = useAdminPreview();
  if (!previewing) return null;

  return (
    <div className="border-b border-[#163044]/15 bg-[#163044] px-4 py-2 text-[#F7F4EC]">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3">
        <p className="min-w-0 text-[12px] font-bold leading-snug sm:text-sm">
          <span className="mr-2 inline-flex rounded-full bg-[#F6C56B] px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-[#7A4A00]">
            Preview
          </span>
          Viewing the regular user UI. Exit to return to admin.
        </p>
        <button
          type="button"
          onClick={exitUserPreview}
          className="shrink-0 rounded-full bg-[#F7F4EC] px-3.5 py-1.5 text-xs font-black text-[#163044] transition hover:bg-white"
        >
          Exit to Admin
        </button>
      </div>
    </div>
  );
}
