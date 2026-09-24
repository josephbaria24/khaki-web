"use client";

import Link from "next/link";
import { formatPHP } from "@/lib/khaki";
import { isPosterMode } from "@/lib/roles";
import Reicon from "@/components/icons/Reicon";
import SectionIntro from "@/components/SectionIntro";

export default function DashboardShortcuts({ user, postingFees = 0, myTasks = [] }) {
  const poster = isPosterMode(user);
  const mine = myTasks.filter((t) => t.client_id === user?.id || t.accepted_tasker_id === user?.id);
  const active = mine.filter((t) => !["released", "cancelled"].includes(t.status)).length;
  const completed = mine.filter((t) => t.status === "released").length;

  const hero = poster
    ? {
        href: "/post",
        title: "Mag-post ng gawain",
        sub: "I-describe ang kailangan mo",
        cta: "Mag-post",
        icon: "add-square",
        iconColor: "#2E8A5A",
        bg: "#CFF5D6",
      }
    : {
        href: "/browse",
        title: "Maghanap ng gawain",
        sub: "Open jobs near you",
        cta: "Maghanap",
        icon: "search",
        iconColor: "#E06A2F",
        bg: "#FFE4D6",
      };

  const left = poster
    ? {
        href: "/my-jobs",
        title: "Aking mga gawain",
        value: String(active),
        label: active === 1 ? "Active post" : "Active posts",
        icon: "briefcase",
        iconColor: "#C94B78",
        bg: "#F8D5E0",
      }
    : {
        href: "/my-jobs",
        title: "My Jobs",
        value: String(active),
        label: active === 1 ? "Active job" : "Active jobs",
        icon: "briefcase",
        iconColor: "#C94B78",
        bg: "#F8D5E0",
      };

  const right = poster
    ? {
        href: "/wallet",
        title: "Posting fees",
        value: formatPHP(postingFees),
        label: "2% when you mag-post",
        icon: "wallet",
        iconColor: "#3A73C4",
        bg: "#D4E6FF",
      }
    : {
        href: "/profile",
        title: "Profile",
        value: String(completed),
        label: "Jobs completed",
        icon: "user",
        iconColor: "#163044",
        bg: "#D4E6FF",
      };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
      <SectionIntro
        pill={poster ? "Poster" : "Tasker"}
        title={poster ? "Mag-post ng gawain" : "Maghanap ng job o task"}
        sub={
          poster
            ? "I-post, i-track ang status, at i-rate after a successful job."
            : "Sumali sa bidding. I-adjust ang fee mo anytime habang pending."
        }
      />

      <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4">
        <Link
          href={hero.href}
          className="bento-widget col-span-2 min-h-[10.5rem] sm:min-h-[11.5rem]"
          style={{ background: hero.bg }}
        >
          <div className="relative z-[1] max-w-[calc(100%-4.75rem)] sm:max-w-[calc(100%-5.5rem)]">
            <p className="text-[1.35rem] font-black leading-tight text-[#163044] sm:text-2xl">{hero.title}</p>
            <p className="mt-1 text-[13px] leading-snug text-[#2A3F4D]/70 sm:text-sm">{hero.sub}</p>
            <span className="bento-pill">{hero.cta}</span>
          </div>
          <Reicon name={hero.icon} color={hero.iconColor} className="bento-icon" />
        </Link>

        <Link href={left.href} className="bento-widget min-h-[10.5rem]" style={{ background: left.bg }}>
          <p className="relative z-[1] pr-[3.25rem] text-[13px] font-black text-[#163044] sm:pr-16 sm:text-sm">{left.title}</p>
          <p className="relative z-[1] mt-3 pr-[3.25rem] text-[1.75rem] font-black leading-none tracking-tight text-[#163044] sm:pr-16 sm:text-3xl">
            {left.value}
          </p>
          <p className="relative z-[1] mt-1 pr-[3.25rem] text-[11px] font-semibold text-[#2A3F4D]/65 sm:pr-16 sm:text-xs">{left.label}</p>
          <Reicon name={left.icon} color={left.iconColor} className="bento-icon-sm" />
        </Link>

        <Link href={right.href} className="bento-widget min-h-[10.5rem]" style={{ background: right.bg }}>
          <p className="relative z-[1] pr-[3.25rem] text-[13px] font-black text-[#163044] sm:pr-16 sm:text-sm">{right.title}</p>
          <p className="relative z-[1] mt-3 truncate pr-[3.25rem] text-[1.75rem] font-black leading-none tracking-tight text-[#163044] sm:pr-16 sm:text-3xl">
            {right.value}
          </p>
          <p className="relative z-[1] mt-1 pr-[3.25rem] text-[11px] font-semibold text-[#2A3F4D]/65 sm:pr-16 sm:text-xs">{right.label}</p>
          <Reicon name={right.icon} color={right.iconColor} className="bento-icon-sm" />
        </Link>
      </div>
    </div>
  );
}
