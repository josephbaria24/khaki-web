"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import ChatAvatar from "@/components/chat/Avatar";
import { cn, formatPHP } from "@/lib/khaki";
import { feePercent } from "@/lib/taskFlow";

/** Nested soft panels — light blue-gray, dark-mode adaptive. */
export const softPanelClass = "bg-[#E8EEF3] dark:bg-[#1B2430]";

export function Card({ className = "", children }) {
  return (
    <section
      className={cn(
        "rounded-[1.25rem] border border-[#E6DDD0] bg-white p-4 shadow-[0_6px_20px_rgba(22,48,68,0.06)] dark:border-white/10 dark:bg-[#1A1E27]",
        className
      )}
    >
      {children}
    </section>
  );
}

export function Label({ children, className = "" }) {
  return (
    <p className={cn("text-[10px] font-black uppercase tracking-[0.14em] text-[#5F6B76] dark:text-[#A8B3C0]", className)}>
      {children}
    </p>
  );
}

export function Pill({ tone = "navy", children }) {
  const tones = {
    navy: "bg-[#E7F1FA] text-[#163044] dark:bg-[#24303C] dark:text-[#F5F3EE]",
    green: "bg-[#DDF5E8] text-[#146C43] dark:bg-[#173B2B] dark:text-[#7FE0B0]",
    amber: "bg-[#FFF1D6] text-[#8A5A12] dark:bg-[#3A2E17] dark:text-[#F2C46D]",
    red: "bg-[#FDE3E3] text-[#B42318] dark:bg-[#3A1D1D] dark:text-[#F59A9A]",
    teal: "bg-[#E5F4F2] text-[#0F6B6B] dark:bg-[#123433] dark:text-[#7FD6CF]",
  };
  return (
    <span className={cn("inline-flex h-6 items-center rounded-full px-2.5 text-[11px] font-black", tones[tone] || tones.navy)}>
      {children}
    </span>
  );
}

export function StatusTimeline({ steps }) {
  return (
    <ol className="flex flex-wrap gap-1.5">
      {steps.map((step) => (
        <li key={step.key}>
          <span
            className={cn(
              "inline-flex h-7 items-center rounded-full px-2.5 text-[11px] font-black",
              step.state === "current" && "bg-[#1F9D6A] text-white",
              step.state === "done" && "bg-[#DDF5E8] text-[#146C43] dark:bg-[#173B2B] dark:text-[#7FE0B0]",
              step.state === "todo" && "bg-[#F7F4EC] text-[#5F6B76]/70 dark:bg-white/5 dark:text-[#A8B3C0]/70"
            )}
          >
            {step.state === "done" ? `✓ ${step.label}` : step.label}
          </span>
        </li>
      ))}
    </ol>
  );
}

const STATE_TONES = {
  green: "border-[#BDE8D1] bg-[#EFFAF4] text-[#146C43] dark:border-[#1F4A36] dark:bg-[#132A20] dark:text-[#7FE0B0]",
  amber: "border-[#F3D9A4] bg-[#FFF8EA] text-[#8A5A12] dark:border-[#4A3A1A] dark:bg-[#2A2214] dark:text-[#F2C46D]",
  navy: "border-[#CFE0EE] bg-[#F2F8FD] text-[#163044] dark:border-[#24384A] dark:bg-[#15212C] dark:text-[#CFE3F5]",
  red: "border-[#F3C4C4] bg-[#FFF3F3] text-[#B42318] dark:border-[#4A2020] dark:bg-[#2A1515] dark:text-[#F59A9A]",
};

export function StateCard({ tone = "green", icon = "lock", title, body, aside }) {
  return (
    <div className={cn("flex items-start gap-3 rounded-2xl border px-3.5 py-3", STATE_TONES[tone] || STATE_TONES.green)}>
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/70 dark:bg-white/10">
        <StateIcon name={icon} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black leading-tight">{title}</p>
        {body ? <p className="mt-0.5 text-[12px] font-semibold leading-snug opacity-80">{body}</p> : null}
      </div>
      {aside ? <div className="shrink-0 text-right">{aside}</div> : null}
    </div>
  );
}

/** Solid teal escrow banner used on Open + Accept + Assigned. */
export function SecuredBanner({ title = "Payment Secured — Held by Khaki", body, icon = "lock" }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-[#1F9D6A] px-3.5 py-3 text-white dark:bg-[#178A5C]">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20">
        <StateIcon name={icon} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black leading-tight">{title}</p>
        {body ? <p className="mt-0.5 text-[12px] font-semibold leading-snug text-white/85">{body}</p> : null}
      </div>
    </div>
  );
}

/** Escrow hold summary for Assigned / In progress / Review. */
export function HeldPaymentCard({
  price,
  payout,
  viewer = "guest",
  title,
  body,
  footer,
}) {
  const heading = title || `${formatPHP(price)} Held by Khaki`;
  const detail =
    body ||
    `${formatPHP(payout)} will be released to the Tasker on completion.`;
  const note =
    footer ||
    (viewer === "tasker"
      ? "Task is locked to you — no other Tasker can accept."
      : "Payment stays held until the work is approved.");

  return (
    <div className="rounded-2xl border border-[#1F9D6A]/35 bg-[#EFFAF4] px-3.5 py-3 dark:border-[#1F4A36] dark:bg-[#132A20]">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1F9D6A]/15 text-[#146C43] dark:bg-white/10 dark:text-[#7FE0B0]">
          <StateIcon name="lock" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="money text-sm font-black text-[#146C43] dark:text-[#7FE0B0]">{heading}</p>
          <p className="mt-0.5 text-[12px] font-semibold leading-snug text-[#146C43]/85 dark:text-[#7FE0B0]/85">{detail}</p>
        </div>
      </div>
      <p className="mt-2.5 flex items-center gap-1.5 text-[11px] font-semibold text-[#146C43]/80 dark:text-[#7FE0B0]/80">
        <span aria-hidden>🔒</span>
        {note}
      </p>
    </div>
  );
}

/** Review / dispute explainer list. */
export function WhatHappensNext({ items }) {
  if (!items?.length) return null;
  return (
    <Card>
      <Label>What happens next</Label>
      <ul className="mt-2.5 space-y-2.5">
        {items.map((item) => (
          <li key={item.title} className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FFF1D6] text-[#8A5A12] dark:bg-[#3A2E17] dark:text-[#F2C46D]">
              <StateIcon name={item.icon || "clock"} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-black text-[#163044] dark:text-[#F5F3EE]">{item.title}</p>
              <p className="mt-0.5 text-[12px] font-semibold leading-snug text-[#5F6B76] dark:text-[#A8B3C0]">{item.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function DetailGrid({ rows }) {
  if (!rows?.length) return null;
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
      {rows.map((row) => (
        <div key={row.label} className="min-w-0">
          <dt className="text-[10px] font-black uppercase tracking-[0.12em] text-[#5F6B76] dark:text-[#A8B3C0]">{row.label}</dt>
          <dd className="mt-0.5 truncate text-[13px] font-black text-[#163044] dark:text-[#F5F3EE]">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function InfoCallout({ children }) {
  return (
    <div className="flex items-start gap-2.5 rounded-2xl border border-[#E6DDD0] px-3.5 py-3 dark:border-white/10">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#E7F1FA] text-[11px] font-black text-[#163044] dark:bg-[#24303C] dark:text-[#F5F3EE]">
        i
      </span>
      <p className="text-[12px] font-semibold leading-snug text-[#5F6B76] dark:text-[#A8B3C0]">{children}</p>
    </div>
  );
}

export function MetaLine({ location, posted }) {
  if (!location && !posted) return null;
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] font-semibold text-[#5F6B76] dark:text-[#A8B3C0]">
      {location ? <span>{location}</span> : null}
      {location && posted ? <span aria-hidden className="text-[#C9D6E0] dark:text-white/20">·</span> : null}
      {posted ? <span>{posted}</span> : null}
    </p>
  );
}

function StateIcon({ name }) {
  const common = { viewBox: "0 0 24 24", className: "h-4 w-4", fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
  if (name === "clock") return <svg {...common}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>;
  if (name === "check") return <svg {...common}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>;
  if (name === "alert") return <svg {...common}><path d="M12 8v5M12 16.5h.01" /><circle cx="12" cy="12" r="8.5" /></svg>;
  if (name === "wallet") return <svg {...common}><rect x="3.5" y="6.5" width="17" height="12" rx="2.5" /><path d="M16 12.5h2" /></svg>;
  return <svg {...common}><rect x="5" y="10.5" width="14" height="9" rx="2" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></svg>;
}

export function PriceBreakdown({ price, fee, payout, rate, payoutLabel = "You receive", compact = false }) {
  return (
    <dl className={cn("space-y-1.5", compact ? "text-[13px]" : "text-sm")}>
      <div className="flex items-center justify-between">
        <dt className="font-semibold text-[#5F6B76] dark:text-[#A8B3C0]">Task price</dt>
        <dd className="money font-black text-[#163044] dark:text-[#F5F3EE]">{formatPHP(price)}</dd>
      </div>
      <div className="flex items-center justify-between">
        <dt className="font-semibold text-[#5F6B76] dark:text-[#A8B3C0]">Khaki fee ({feePercent(rate)})</dt>
        <dd className="money font-black text-[#B42318] dark:text-[#F59A9A]">−{formatPHP(fee)}</dd>
      </div>
      <div className="flex items-center justify-between border-t border-dashed border-[#E6DDD0] pt-1.5 dark:border-white/10">
        <dt className="font-black text-[#163044] dark:text-[#F5F3EE]">{payoutLabel}</dt>
        <dd className="money text-lg font-black text-[#1F9D6A] dark:text-[#3DDC97]">{formatPHP(payout)}</dd>
      </div>
    </dl>
  );
}

export function PartyCard({ label, person, fallbackName, rating, href, badges = [] }) {
  const name = person?.full_name || fallbackName || "Khaki user";
  const body = (
    <div className="flex items-center gap-3">
      <ChatAvatar name={name} src={person?.avatar_url || person?.profile_photo} size="sm" className="h-11 w-11 text-sm" />
      <div className="min-w-0 flex-1">
        <Label>{label}</Label>
        <p className="mt-0.5 truncate text-[15px] font-black text-[#163044] dark:text-[#F5F3EE]">{name}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-semibold text-[#5F6B76] dark:text-[#A8B3C0]">
          {rating?.count ? (
            <span><span className="text-[#E6A817]">★</span> {rating.avg.toFixed(1)} ({rating.count})</span>
          ) : (
            <span>No ratings yet</span>
          )}
          {person?.location_area ? <span>{person.location_area}</span> : null}
        </p>
      </div>
      {badges.length ? (
        <div className="flex shrink-0 flex-col items-end gap-1">
          {badges.map((badge) => (
            <span key={badge} className="rounded-full bg-[#DDF5E8] px-2 py-0.5 text-[10px] font-black text-[#146C43] dark:bg-[#173B2B] dark:text-[#7FE0B0]">
              ✓ {badge}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
  if (!href) return <Card className="p-3.5">{body}</Card>;
  return (
    <Link href={href} className="block rounded-[1.25rem] border border-[#E6DDD0] bg-white p-3.5 shadow-[0_6px_20px_rgba(22,48,68,0.06)] transition hover:border-[#C9D6E0] dark:border-white/10 dark:bg-[#1A1E27]">
      {body}
    </Link>
  );
}

export function personBadges(person) {
  if (!person) return [];
  const out = [];
  if (person.verification_status === "verified" || person.verified_at) out.push("ID verified");
  if (person.phone) out.push("Phone");
  return out;
}

export function ActionBar({ children }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 lg:static lg:mt-4 lg:p-0">
      <div className="pointer-events-auto flex w-full max-w-lg gap-2 rounded-[1.35rem] border border-[#E6DDD0] bg-white/95 p-2 shadow-[0_-10px_30px_rgba(22,48,68,0.12)] backdrop-blur dark:border-white/10 dark:bg-[#11141A]/95 lg:max-w-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-0 lg:dark:bg-transparent">
        {children}
      </div>
    </div>
  );
}

export function Button({ variant = "primary", className = "", children, ...props }) {
  const styles = {
    primary: "bg-[#163044] text-[#F7F4EC] dark:bg-[#F5F3EE] dark:text-[#11141A]",
    green: "bg-[#1F9D6A] text-white",
    soft: "bg-[#E7F1FA] text-[#163044] dark:bg-[#24303C] dark:text-[#F5F3EE]",
    outline: "border border-[#D9D3C5] bg-white text-[#163044] dark:border-white/15 dark:bg-transparent dark:text-[#F5F3EE]",
    danger: "border border-[#F3C4C4] bg-white text-[#B42318] dark:border-[#4A2020] dark:bg-transparent dark:text-[#F59A9A]",
  };
  const Tag = props.href ? Link : "button";
  return (
    <Tag
      {...(Tag === "button" ? { type: props.type || "button" } : {})}
      {...props}
      className={cn(
        "flex h-12 flex-1 items-center justify-center gap-1.5 rounded-2xl px-4 text-sm font-black transition disabled:opacity-50",
        styles[variant] || styles.primary,
        className
      )}
    >
      {children}
    </Tag>
  );
}

export function Stars({ value, onChange, size = "md" }) {
  const big = size === "md";
  return (
    <div className="flex gap-1" role={onChange ? "radiogroup" : undefined}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          aria-label={`${n} star${n === 1 ? "" : "s"}`}
          className={cn(big ? "text-[28px]" : "text-base", "leading-none", n <= value ? "text-[#F5C518]" : "text-[#E4D7B8] dark:text-white/15")}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export function CheckRow({ checked, onChange, children }) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 rounded-xl px-1 py-1.5">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span
        aria-hidden
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 text-[11px] font-black",
          checked ? "border-[#1F9D6A] bg-[#1F9D6A] text-white" : "border-[#C9D6E0] bg-white dark:border-white/20 dark:bg-transparent"
        )}
      >
        {checked ? "✓" : ""}
      </span>
      <span className="text-[13px] font-semibold leading-snug text-[#163044] dark:text-[#E7EEF4]">{children}</span>
    </label>
  );
}

export function Sheet({ open, title, subtitle, onClose, children, footer }) {
  const [shown, setShown] = useState(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    let frame = 0;
    let timer = 0;
    if (open) {
      setShown(true);
      setActive(false);
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => setActive(true));
      });
    } else {
      setActive(false);
      timer = window.setTimeout(() => setShown(false), 380);
    }
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!shown || typeof document === "undefined") return null;

  return createPortal(
    <div className={cn("fixed inset-0 z-[120] flex items-end justify-center p-3 sm:p-4", !active && "pointer-events-none")} role="presentation">
      <button type="button" aria-label="Close" className={cn("share-dialog-shade absolute inset-0 bg-black/65", active && "is-open")} onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "share-dialog-card relative z-10 flex max-h-[min(88dvh,640px)] w-full max-w-md flex-col overflow-hidden rounded-[1.5rem] bg-white shadow-[0_24px_60px_rgba(0,0,0,0.35)] dark:bg-[#1A1E27]",
          active && "is-open"
        )}
      >
        <div className="px-4 pb-2 pt-3">
          <span aria-hidden className="mx-auto mb-2 block h-1.5 w-10 rounded-full bg-[#163044]/15 dark:bg-white/20" />
          <h2 className="text-lg font-black text-[#163044] dark:text-[#F5F3EE]">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-[12px] font-semibold leading-snug text-[#5F6B76] dark:text-[#A8B3C0]">{subtitle}</p> : null}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-3">{children}</div>
        {footer ? <div className="flex gap-2 border-t border-[#EFE7DA] px-4 py-3 dark:border-white/10">{footer}</div> : null}
      </div>
    </div>,
    document.body
  );
}

export function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-black text-[#5F6B76] dark:text-[#A8B3C0]">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "h-11 w-full rounded-xl border border-[#E6DDD0] bg-[#FFFCF7] px-3 text-sm font-semibold text-[#163044] outline-none focus:border-[#163044] dark:border-white/10 dark:bg-[#11141A] dark:text-[#F5F3EE] dark:focus:border-[#7EB6F0]";
