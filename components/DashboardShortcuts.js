"use client";

import Link from "next/link";
import { formatPHP } from "@/lib/khaki";
import { LANDING } from "@/lib/landingContent";
import { isPosterMode } from "@/lib/roles";

export default function DashboardShortcuts({ user, postingFees = 0, myTasks = [] }) {
  const poster = isPosterMode(user);
  const actions = poster
    ? [
        {
          href: "/post",
          title: "Mag-post ng gawain",
          sub: "I-describe ang kailangan mo",
          image: "/images/posttask.png",
          bg: "#E8DCC4",
          cover: true,
        },
        {
          href: "/my-jobs",
          title: "Aking mga gawain",
          sub: "Status at kung sino'ng kumuha",
          image: "/images/mypostedtask.png",
          bg: "#D5DEC4",
          cover: true,
        },
        {
          href: "/wallet",
          title: "Posting fees",
          sub: "2% when you mag-post",
          image: "/images/mywallet.png",
          bg: "#C9D6E0",
          cover: true,
        },
      ]
    : [
        {
          href: "/browse",
          title: "Maghanap ng gawain",
          sub: "Open jobs near you",
          image: "/images/findjob.png",
          bg: "#E8D4C8",
          cover: true,
        },
        {
          href: "/my-jobs",
          title: "My Jobs",
          sub: "Bids at ongoing work",
          image: "/images/myjob.png",
          bg: "#C9D8D4",
          cover: true,
        },
        {
          href: "/profile",
          title: "Profile",
          sub: "Ratings at verification",
          image: "/images/mywallet.png",
          bg: "#C9D6E0",
          cover: true,
        },
      ];

  const mine = myTasks.filter((t) => t.client_id === user?.id || t.accepted_tasker_id === user?.id);
  const active = mine.filter((t) => !["released", "cancelled"].includes(t.status)).length;
  const completed = mine.filter((t) => t.status === "released").length;

  const stats = [
    { label: poster ? "Active posts" : "Active jobs", value: String(active), href: "/my-jobs" },
    { label: "Posting fees", value: formatPHP(postingFees), href: "/wallet" },
    { label: "Tapos na", value: String(completed), href: "/my-jobs" },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: LANDING.olive }}>
        {poster ? "Poster mode" : "Tasker mode"}
      </p>
      <h2 className="mt-2 text-2xl font-black text-foreground sm:text-3xl">
        {poster ? "Mag-post ng gawain" : "Maghanap ng job o task"}
      </h2>
      <p className="mt-2 text-muted-foreground">
        {poster
          ? "I-post ang kailangan mo, i-track ang status, at i-rate ang tasker after a successful job."
          : "Sumali sa bidding kung open ang job. I-adjust ang fee mo anytime habang pending."}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {actions.map((action, i) => (
          <Link
            key={action.title}
            href={action.href}
            className={`interactive-card min-w-0 rounded-[1.25rem] bg-[#FFFCF7] p-2.5 shadow-card sm:rounded-[1.5rem] sm:p-3 ${
              i === 2 ? "col-span-2 sm:col-span-1" : ""
            }`}
          >
            <div
              className={`relative overflow-hidden rounded-[1rem] sm:rounded-[1.15rem] ${
                i === 2
                  ? "h-28 sm:h-40"
                  : "aspect-[4/3] sm:aspect-auto sm:h-40"
              }`}
              style={{ background: action.bg }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={action.image}
                alt=""
                className={
                  action.cover
                    ? "absolute inset-0 h-full w-full object-cover"
                    : "absolute inset-0 h-full w-full object-contain p-2 drop-shadow-sm"
                }
              />
            </div>
            <p className="mt-2 text-[13px] font-black leading-tight text-foreground sm:mt-3 sm:text-base">
              {action.title}
            </p>
            <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-muted-foreground sm:text-sm">{action.sub}</p>
          </Link>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-[1.35rem] bg-[#FFFCF7] p-4 shadow-card transition-transform duration-200 hover:-translate-y-0.5"
          >
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{stat.label}</p>
            <p className="mt-2 truncate text-lg font-black text-foreground sm:text-xl">{stat.value}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
