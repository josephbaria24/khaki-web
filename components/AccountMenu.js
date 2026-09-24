"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { cn } from "@/lib/khaki";
import { toast } from "@/lib/toast";

export default function AccountMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (open) setShown(true);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const initial = (user?.full_name || "K").charAt(0).toUpperCase();

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full bg-[#C9D6E0] text-sm font-black text-[#2A3F4D] transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-90",
          open && "scale-95"
        )}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
      >
        {initial}
      </button>
      {shown ? (
        <div
          role="menu"
          className={cn("account-menu absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-2xl border border-black/5 bg-[#FFFCF7] py-1.5 shadow-[0_16px_40px_rgba(22,48,68,0.16)]", !open && "is-leaving")}
          onAnimationEnd={(e) => {
            if (e.target !== e.currentTarget) return;
            if (!open) setShown(false);
          }}
        >
          <Link
            href="/profile"
            role="menuitem"
            className="block px-3.5 py-2.5 text-sm font-bold text-[#163044] hover:bg-[#F3EFE3]"
            onClick={() => setOpen(false)}
          >
            Profile
          </Link>
          <Link
            href="/settings"
            role="menuitem"
            className="block px-3.5 py-2.5 text-sm font-bold text-[#163044] hover:bg-[#F3EFE3]"
            onClick={() => setOpen(false)}
          >
            Settings
          </Link>
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3.5 py-2.5 text-left text-sm font-bold text-[#C94B78] hover:bg-[#F8D5E0]/70"
            onClick={async () => {
              setOpen(false);
              await logout();
              toast.success("Logged out");
              router.push("/");
            }}
          >
            Log out
          </button>
        </div>
      ) : null}
    </div>
  );
}
