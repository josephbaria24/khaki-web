"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import AppShell from "@/components/AppShell";
import PublicShell from "@/components/PublicShell";
import { FadeIn, Stagger } from "@/components/ui/motion";
import { CHIP_CATEGORIES, graphicForTask, shortCategory, taskMatchesChip } from "@/lib/catalog";
import { cn, formatPHP } from "@/lib/khaki";
import { LANDING } from "@/lib/landingContent";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/store";
import { Plus, Search } from "@/components/icons";

const PAGE_BG = LANDING.page;

function initials(name) {
  return String(name || "K")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "K";
}

function JobCard({ task }) {
  const graphic = graphicForTask(task);
  const rating = (4.6 + ((String(task.id || "").length % 4) * 0.1)).toFixed(1);

  return (
    <Link
      href={`/task/${task.id}`}
      className="group block overflow-hidden rounded-[1.5rem] bg-white p-2.5 shadow-[0_8px_28px_rgba(42,63,77,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(42,63,77,0.12)]"
    >
      <div
        className="relative aspect-[4/3] overflow-hidden rounded-[1.15rem]"
        style={{ backgroundColor: graphic.bg }}
      >
        <Image
          src={graphic.image}
          alt=""
          fill
          className="object-contain p-3 transition duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, 280px"
        />
        <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[11px] font-bold text-[#2A3F4D] shadow-sm">
          <span className="text-[#C4A035]">★</span> {rating}
        </span>
      </div>
      <div className="flex items-end justify-between gap-2 px-1.5 pb-1.5 pt-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-[#2A3F4D]">{task.title}</p>
          <p className="mt-0.5 truncate text-xs text-[#2A3F4D]/55">
            {shortCategory(task.category) || "Gawain"}
          </p>
          <p className="mt-1.5 text-sm font-black text-[#3D5C6E]">
            {formatPHP(task.budget_php)}
          </p>
        </div>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#3D5C6E] text-white shadow-sm transition group-hover:bg-[#2A3F4D]">
          <Plus className="h-4 w-4" color="currentColor" />
        </span>
      </div>
    </Link>
  );
}

function BrowseBody() {
  const { user, isAuthenticated } = useAuth();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    api.tasks.list()
      .then((list) => setTasks(list.filter((t) => t.status === "open")))
      .catch(() => setTasks([]));
  }, []);

  const filtered = tasks.filter((task) => {
    if (search && !`${task.title} ${task.details}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (!taskMatchesChip(task.category, category)) return false;
    return true;
  });

  const firstName = (user?.full_name || "there").split(/\s+/)[0];

  return (
    <div className="min-h-screen" style={{ backgroundColor: PAGE_BG }}>
      <section className="mx-auto w-full max-w-6xl space-y-6 px-4 pb-12 pt-4 sm:px-6 lg:px-8 lg:pt-8">
        {isAuthenticated ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              {user?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatar_url}
                  alt=""
                  className="h-12 w-12 rounded-full object-cover ring-2 ring-white shadow-sm"
                />
              ) : (
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#C9D6E0] text-sm font-black text-[#2A3F4D] shadow-sm">
                  {initials(user?.full_name)}
                </span>
              )}
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#2A3F4D]/55">Welcome</p>
                <p className="truncate text-base font-black text-[#2A3F4D]">Hello {firstName}</p>
              </div>
            </div>
            <p className="text-xs font-bold text-[#2A3F4D]/45">{filtered.length} open</p>
          </div>
        ) : null}

        <div>
          <h1 className="text-2xl font-black leading-tight tracking-tight text-[#2A3F4D] sm:text-3xl">
            Anong gawain ang<br className="sm:hidden" /> hanap mo?
          </h1>
        </div>

        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex h-14 items-center gap-3 rounded-[1.25rem] bg-white px-4 shadow-[0_8px_28px_rgba(42,63,77,0.08)]"
        >
          <Search className="h-4 w-4 shrink-0 text-[#3D5C6E]/55" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for your services"
            className="flex-1 bg-transparent text-sm text-[#2A3F4D] outline-none placeholder:text-[#2A3F4D]/40"
          />
        </form>

        <div
          className="relative overflow-hidden rounded-[1.75rem] px-6 py-7 text-white sm:px-8"
          style={{
            background: `linear-gradient(115deg, ${LANDING.olive} 0%, ${LANDING.oliveMid} 48%, ${LANDING.oliveDeep} 100%)`,
          }}
        >
          <div className="relative z-10 max-w-sm">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/70">Promo</p>
            <h2 className="mt-2 text-xl font-black leading-snug sm:text-2xl">
              2% posting fee lang hanggang Feb 2027
            </h2>
            <p className="mt-2 text-sm text-white/80">
              Mag-post ng gawain — bayad diretso sa tasker.
            </p>
            <Link
              href="/post"
              className="mt-5 inline-flex h-10 items-center rounded-full bg-white px-5 text-xs font-bold text-[#2A3F4D] transition hover:bg-[#F7F4EC]"
            >
              Post now
            </Link>
          </div>
          <div className="pointer-events-none absolute -right-4 bottom-0 top-0 hidden w-44 items-end justify-center sm:flex md:w-56">
            <div className="relative h-full w-full">
              <Image
                src="/images/cards/featured-errands.png"
                alt=""
                fill
                className="object-contain object-bottom drop-shadow-lg"
                sizes="220px"
              />
            </div>
          </div>
        </div>

        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {CHIP_CATEGORIES.map((c) => {
            const on = category === c;
            const label = c === "All" ? "All" : shortCategory(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={cn(
                  "shrink-0 rounded-full px-4 py-2 text-xs font-bold transition",
                  on
                    ? "bg-[#3D5C6E] text-[#F7F4EC] shadow-sm"
                    : "bg-white text-[#2A3F4D] shadow-[0_2px_10px_rgba(42,63,77,0.06)]"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div>
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-lg font-black text-[#2A3F4D]">Services</h2>
            <p className="text-xs font-semibold text-[#2A3F4D]/45">{filtered.length} available</p>
          </div>

          <FadeIn delay={40}>
            <Stagger className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
              {filtered.map((task) => (
                <JobCard key={task.id} task={task} />
              ))}
            </Stagger>
          </FadeIn>

          {filtered.length === 0 ? (
            <p className="rounded-[1.5rem] border border-dashed border-[#C9D6E0] bg-white/70 py-14 text-center text-sm text-[#2A3F4D]/50">
              Walang open jobs na tumugma sa filter.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

export default function BrowsePage() {
  const { isAuthenticated } = useAuth();
  const body = <BrowseBody />;
  if (isAuthenticated) return <AppShell>{body}</AppShell>;
  return <PublicShell landing>{body}</PublicShell>;
}
