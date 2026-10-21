"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import PublicShell from "@/components/PublicShell";
import BrowseTaskDetail from "@/components/browse/BrowseTaskDetail";
import BrowseTaskListCard from "@/components/browse/BrowseTaskListCard";
import Refreshable from "@/components/Refreshable";
import { CHIP_CATEGORIES, shortCategory, taskMatchesChip } from "@/lib/catalog";
import ChatAvatar from "@/components/chat/Avatar";
import { cn } from "@/lib/khaki";
import { LANDING } from "@/lib/landingContent";
import { isTaskerMode } from "@/lib/roles";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/store";
import { MapPin, Search, X } from "@/components/icons";
import { PageSkeleton } from "@/components/ui/Skeleton";

const BrowseTasksMap = dynamic(() => import("@/components/browse/BrowseTasksMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[20rem] items-center justify-center bg-[#E7EEF4] text-xs font-bold text-[#2A3F4D]/50 dark:bg-[#1A1E27] dark:text-[#F5F3EE]/45">
      Loading map…
    </div>
  ),
});

function BrowseBody() {
  const { user, isAuthenticated } = useAuth();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [tasks, setTasks] = useState([]);
  const [posters, setPosters] = useState({});
  const [ready, setReady] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [showMapMobile, setShowMapMobile] = useState(false);

  useEffect(() => {
    let live = true;
    api.tasks
      .list()
      .then((list) => {
        if (!live) return;
        setTasks(list.filter((t) => t.status === "open"));
      })
      .catch(() => {
        if (live) setTasks([]);
      })
      .finally(() => {
        if (live) setReady(true);
      });
    return () => {
      live = false;
    };
  }, []);

  const filtered = useMemo(
    () =>
      tasks.filter((task) => {
        if (search && !`${task.title} ${task.details}`.toLowerCase().includes(search.toLowerCase())) return false;
        if (!taskMatchesChip(task.category, category, task)) return false;
        return true;
      }),
    [tasks, search, category]
  );

  useEffect(() => {
    if (selectedId && !filtered.some((t) => t.id === selectedId)) {
      setSelectedId(null);
    }
  }, [filtered, selectedId]);

  useEffect(() => {
    const ids = [...new Set(filtered.map((t) => t.client_id).filter(Boolean))];
    if (!ids.length) {
      setPosters({});
      return;
    }
    let live = true;
    api.profile
      .getMany(ids)
      .then((map) => {
        if (live) setPosters(map || {});
      })
      .catch(() => {
        if (live) setPosters({});
      });
    return () => {
      live = false;
    };
  }, [filtered]);

  const selected = filtered.find((t) => t.id === selectedId) || null;
  const firstName = (user?.full_name || "there").split(/\s+/)[0];
  const taskerFeed = isAuthenticated && isTaskerMode(user);
  const detailOpen = Boolean(selected);
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  const selectTask = (id) => {
    setSelectedId(id);
    // Keep map visible briefly on phone so flyTo / pin pop can finish.
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches && showMapMobile) {
      window.setTimeout(() => setShowMapMobile(false), 380);
    } else {
      setShowMapMobile(false);
    }
  };

  const returnToMap = () => {
    setSelectedId(null);
  };

  const mobileDetail =
    detailOpen && portalReady
      ? createPortal(
          <div
            className="browse-mobile-detail fixed inset-0 z-[90] flex flex-col bg-[#FBF8F1] md:hidden dark:bg-[#11141A]"
            style={{ height: "100dvh" }}
          >
            <button
              type="button"
              onClick={returnToMap}
              className="absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-md transition hover:scale-105 dark:bg-[#1A1E27]"
              aria-label="Close"
            >
              <X className="h-4 w-4" color="currentColor" />
            </button>
            <BrowseTaskDetail
              task={selected}
              poster={posters[selected.client_id]}
              user={user}
              isAuthenticated={isAuthenticated}
              onReturnToMap={returnToMap}
              className="h-full min-h-0 w-full"
            />
          </div>,
          document.body
        )
      : null;

  return (
    <div
      className="browse-page khaki-landing flex h-[calc(100svh-4rem)] flex-col overflow-hidden md:h-[calc(100svh-4.25rem)]"
      style={{ background: LANDING.page }}
    >
      <div
        className="shrink-0 border-b border-[#E6DDD0]/80 px-4 py-3 backdrop-blur sm:px-6 dark:border-white/10"
        style={{ background: `${LANDING.page}f2` }}
      >
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-3">
          {isAuthenticated ? (
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <ChatAvatar
                  name={user?.full_name}
                  src={user?.avatar_url}
                  size="sm"
                  className="h-10 w-10 text-sm ring-2 ring-white shadow-sm dark:ring-[#1A1E27]"
                />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#2A3F4D]/55 dark:text-[#F5F3EE]/50">Welcome</p>
                  <p className="truncate text-sm font-black text-[#2A3F4D] dark:text-[#F5F3EE]">Hello {firstName}</p>
                </div>
              </div>
              <p className="text-xs font-bold text-[#2A3F4D]/45 dark:text-[#F5F3EE]/40">{filtered.length} open</p>
            </div>
          ) : null}

          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <form
              onSubmit={(e) => e.preventDefault()}
              className="search-pill flex h-11 flex-1 items-center gap-2.5 rounded-xl border border-[#E6DDD0] bg-[#FFFCF7] px-3 shadow-sm dark:border-white/10 dark:bg-[#1A1E27]"
            >
              <Search className="h-4 w-4 shrink-0 text-[#163044]/55 dark:text-[#F5F3EE]/50" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search for a task"
                className="flex-1 bg-transparent text-sm text-[#2A3F4D] outline-none placeholder:text-[#2A3F4D]/40 dark:text-[#F5F3EE] dark:placeholder:text-[#F5F3EE]/40"
              />
            </form>
            <div className="no-scrollbar flex gap-2 overflow-x-auto lg:max-w-[55%]">
              {CHIP_CATEGORIES.map((c) => {
                const on = category === c;
                const label = c === "All" ? "All" : shortCategory(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={cn(
                      "shrink-0 rounded-full px-3.5 py-2 text-xs font-bold transition",
                      on ? "chip-active" : "chip-inactive"
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {taskerFeed ? (
            <p className="text-xs font-semibold text-[#2A3F4D]/55 dark:text-[#F5F3EE]/50">
              All tasks visible · Book only if qualified
            </p>
          ) : null}

          <div className="flex items-center justify-between gap-2 md:hidden">
            <p className="text-xs font-bold text-[#2A3F4D]/50 dark:text-[#F5F3EE]/45">
              {filtered.length} task{filtered.length === 1 ? "" : "s"}
            </p>
            <button
              type="button"
              onClick={() => {
                setShowMapMobile((v) => !v);
                if (!showMapMobile) setSelectedId(null);
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#163044] px-3.5 text-xs font-black text-[#F7F4EC] dark:bg-[#F5F3EE] dark:text-[#11141A]"
            >
              <MapPin className="h-3.5 w-3.5" color="currentColor" />
              {showMapMobile ? "List" : "Map"}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 flex-col overflow-hidden md:flex-row">
        {/* List column */}
        <aside
          className={cn(
            "flex min-h-0 w-full flex-col overflow-hidden border-[#E6DDD0]/80 dark:border-white/10 md:w-[min(100%,24rem)] md:shrink-0 md:border-r lg:w-[26rem]",
            showMapMobile && !detailOpen ? "hidden md:flex" : "flex",
            detailOpen ? "hidden md:flex" : ""
          )}
        >
          <div className="hidden items-center justify-between border-b border-[#E6DDD0]/80 px-4 py-2.5 md:flex dark:border-white/10">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-[#2A3F4D]/50 dark:text-[#F5F3EE]/45">
              Browse tasks
            </p>
            <p className="text-xs font-bold text-[#2A3F4D]/45 dark:text-[#F5F3EE]/40">{filtered.length}</p>
          </div>
          <Refreshable className="min-h-0 flex-1 space-y-2.5 overflow-y-auto p-3 sm:p-4">
            {!ready ? (
              <PageSkeleton rows={6} />
            ) : filtered.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-[#C9D6E0] bg-[#FFFCF7]/70 px-4 py-12 text-center text-sm text-[#2A3F4D]/50 dark:border-white/10 dark:bg-[#1A1E27] dark:text-[#F5F3EE]/45">
                Walang open jobs na tumugma sa filter.
              </p>
            ) : (
              filtered.map((task) => (
                <BrowseTaskListCard
                  key={task.id}
                  task={task}
                  poster={posters[task.client_id]}
                  selected={task.id === selectedId}
                  onSelect={selectTask}
                />
              ))
            )}
          </Refreshable>
          <div className="border-t border-[#E6DDD0]/80 p-3 dark:border-white/10">
            <Link
              href="/post"
              className="flex h-11 items-center justify-center rounded-xl bg-[#163044] text-sm font-black text-white dark:bg-[#F5F3EE] dark:text-[#11141A]"
            >
              Post a task
            </Link>
          </div>
        </aside>

        {/* Map stays mounted; detail crossfades over it on tablet+ (mobile detail uses portal) */}
        <section
          className={cn(
            "relative min-h-0 min-w-0 flex-1 overflow-hidden",
            detailOpen ? "hidden md:flex" : showMapMobile ? "flex" : "hidden md:flex"
          )}
        >
          <div
            className={cn(
              "absolute inset-0 transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
              detailOpen ? "opacity-40 md:opacity-30" : "opacity-100"
            )}
          >
            <BrowseTasksMap
              tasks={filtered}
              selectedId={selectedId}
              onSelect={selectTask}
              onExit={() => setShowMapMobile(false)}
            />
          </div>
          {detailOpen && selected ? (
            <div
              key={selected.id}
              className="browse-detail-panel absolute inset-0 z-10 bg-[#FBF8F1]/96 backdrop-blur-[2px] dark:bg-[#11141A]/96"
            >
              <BrowseTaskDetail
                task={selected}
                poster={posters[selected.client_id]}
                user={user}
                isAuthenticated={isAuthenticated}
                onReturnToMap={returnToMap}
                className="h-full w-full"
              />
            </div>
          ) : null}
        </section>
      </div>
      {mobileDetail}
    </div>
  );
}

export default function BrowsePage() {
  const { isAuthenticated } = useAuth();
  const body = <BrowseBody />;
  if (isAuthenticated) return <AppShell>{body}</AppShell>;
  return <PublicShell landing>{body}</PublicShell>;
}
