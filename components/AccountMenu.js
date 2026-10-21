"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ChatAvatar from "@/components/chat/Avatar";
import { useLanguage } from "@/components/LanguageProvider";
import { useAuth } from "@/lib/AuthContext";
import { LANGS } from "@/lib/i18n";
import { cn, formatPHP } from "@/lib/khaki";
import { api } from "@/lib/store";
import { toast } from "@/lib/toast";

export default function AccountMenu() {
  const { user, logout } = useAuth();
  const { lang, setLanguage } = useLanguage();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const [walletAmount, setWalletAmount] = useState(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (open) setShown(true);
  }, [open]);

  useEffect(() => {
    if (!open || !user?.id) return undefined;
    let live = true;
    // Glance amount = released tasker payouts (not posting fees).
    api.escrow
      .minePayouts()
      .then((rows) =>
        (rows || [])
          .filter((row) => row.status === "released")
          .reduce((sum, row) => sum + Number(row.tasker_payout || 0), 0)
      )
      .then((total) => {
        if (live) setWalletAmount(total);
      })
      .catch(() => {
        if (live) setWalletAmount(0);
      });
    return () => {
      live = false;
    };
  }, [open, user?.id]);

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

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-10 w-10 items-center justify-center overflow-hidden rounded-full transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-90",
          open && "scale-95"
        )}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
      >
        <ChatAvatar name={user?.full_name || "K"} src={user?.avatar_url} size="sm" className="h-10 w-10 text-sm" />
      </button>
      {shown ? (
        <div
          role="menu"
          className={cn(
            "account-menu absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-black/5 bg-[#FFFCF7] py-1.5 shadow-[0_16px_40px_rgba(22,48,68,0.16)] dark:border-white/10 dark:bg-[#1A1E27] dark:shadow-[0_16px_40px_rgba(0,0,0,0.45)]",
            !open && "is-leaving"
          )}
          onAnimationEnd={(e) => {
            if (e.target !== e.currentTarget) return;
            if (!open) setShown(false);
          }}
        >
          <Link
            href="/profile"
            role="menuitem"
            className="block px-3.5 py-2.5 text-sm font-bold text-[#163044] hover:bg-[#F3EFE3] dark:text-[#F5F3EE] dark:hover:bg-white/5"
            onClick={() => setOpen(false)}
          >
            Profile
          </Link>
          {user?.role !== "admin" ? (
            <Link
              href="/team"
              role="menuitem"
              className="block px-3.5 py-2.5 text-sm font-bold text-[#163044] hover:bg-[#F3EFE3] dark:text-[#F5F3EE] dark:hover:bg-white/5"
              onClick={() => setOpen(false)}
            >
              Team
            </Link>
          ) : null}
          <Link
            href="/wallet"
            role="menuitem"
            className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm font-bold text-[#163044] hover:bg-[#F3EFE3] dark:text-[#F5F3EE] dark:hover:bg-white/5"
            onClick={() => setOpen(false)}
          >
            <span>Wallet</span>
            <span className="shrink-0 text-xs font-black text-[#0D666A] dark:text-[#7FD3CF]">
              {walletAmount == null ? "…" : formatPHP(walletAmount)}
            </span>
          </Link>
          <Link
            href="/settings"
            role="menuitem"
            className="block px-3.5 py-2.5 text-sm font-bold text-[#163044] hover:bg-[#F3EFE3] dark:text-[#F5F3EE] dark:hover:bg-white/5"
            onClick={() => setOpen(false)}
          >
            Settings
          </Link>
          <div className="mx-2 my-1 rounded-xl bg-[#F3EFE3] p-1.5 dark:bg-[#252A35]">
            <p className="px-1.5 pb-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#163044]/55 dark:text-[#F5F3EE]/55">
              Language
            </p>
            <div className="grid grid-cols-2 gap-1" role="radiogroup" aria-label="Language">
              {LANGS.map((option) => {
                const on = lang === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    data-no-translate
                    onClick={() => {
                      setOpen(false);
                      setLanguage(option.id);
                    }}
                    className={cn(
                      "h-8 rounded-lg text-xs font-black transition-colors",
                      on
                        ? "bg-[#163044] text-white dark:bg-[#F5F3EE] dark:text-[#11141A]"
                        : "text-[#163044]/70 hover:bg-white/70 dark:text-[#F5F3EE]/70 dark:hover:bg-white/10"
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3.5 py-2.5 text-left text-sm font-bold text-[#C94B78] hover:bg-[#F8D5E0]/70 dark:text-[#F0A3BC] dark:hover:bg-[#C94B78]/15"
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
