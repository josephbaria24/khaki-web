"use client";

import { Menu, X } from "@/components/icons";
import { useAdminNav } from "@/lib/AdminNavContext";

function badgeTotal(badges) {
  if (!badges || typeof badges !== "object") return 0;
  return Object.values(badges).reduce((sum, value) => {
    const n = Number(value);
    return sum + (Number.isFinite(n) && n > 0 ? n : 0);
  }, 0);
}

export default function AdminMenuButton({ className = "" }) {
  const { open, openMenu, closeMenu, config } = useAdminNav();
  const total = badgeTotal(config?.badges);

  return (
    <button
      type="button"
      onClick={() => (open ? closeMenu() : openMenu())}
      aria-expanded={open}
      aria-controls="admin-side-nav"
      className={`relative inline-flex h-10 shrink-0 items-center gap-2 rounded-2xl bg-[#163044] px-3 text-sm font-black text-[#F7F4EC] shadow-soft transition-[transform,background-color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#1d4058] active:scale-[0.96] ${className}`}
    >
      <span className={`inline-flex transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? "rotate-90" : "rotate-0"}`}>
        {open ? <X className="h-4 w-4" color="currentColor" /> : <Menu className="h-4 w-4" color="currentColor" />}
      </span>
      <span className="hidden min-[380px]:inline">{open ? "Close" : "Menu"}</span>
      {!open && total > 0 ? (
        <span className="absolute -right-1.5 -top-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#F6C56B] px-1.5 text-[10px] font-black tabular-nums text-[#7A4A00] shadow-sm">
          {total > 99 ? "99+" : total}
        </span>
      ) : null}
    </button>
  );
}
