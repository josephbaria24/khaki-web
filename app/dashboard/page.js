"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import OpenJobCard from "@/components/dashboard/OpenJobCard";
import CategoryCard from "@/components/landing/CategoryCard";
import CategoryChips from "@/components/ui/CategoryChips";
import SearchPill from "@/components/ui/SearchPill";
import DashboardShortcuts from "@/components/DashboardShortcuts";
import PostedJobsList from "@/components/PostedJobsList";
import SectionIntro from "@/components/SectionIntro";
import { FadeIn } from "@/components/ui/motion";
import { CHIP_CATEGORIES, taskMatchesChip } from "@/lib/catalog";
import { LANDING } from "@/lib/landingContent";
import { useMarketingLanding } from "@/lib/useMarketingLanding";
import { formatPHP, skillFitsTask } from "@/lib/khaki";
import { useAuth } from "@/lib/AuthContext";
import { isPosterMode, needsTaskerVerification } from "@/lib/roles";
import { api } from "@/lib/store";
import { toast } from "@/lib/toast";
import { CircleAlert } from "@/components/icons";
import { PageSkeleton } from "@/components/ui/Skeleton";
import InstallAppBanner from "@/components/InstallAppBanner";

function interactionBadge(task, userId, bid) {
  if (userId && task.client_id === userId) return { label: "Your post", bg: "#E8DCC4", fg: "#163044" };
  if (!bid) return null;
  if (bid.status === "pending") return { label: "Bid submitted", bg: "#D1FAE5", fg: "#065F46" };
  if (bid.status === "accepted") return { label: "Accepted", bg: "#D1FAE5", fg: "#065F46" };
  if (bid.status === "declined") return { label: "Declined", bg: "#F3EFE3", fg: "#6B6459" };
  return null;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { categories: landingCategories } = useMarketingLanding();
  const poster = isPosterMode(user);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [openTasks, setOpenTasks] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [postingFees, setPostingFees] = useState(0);
  const [releasedPayouts, setReleasedPayouts] = useState(0);
  const [people, setPeople] = useState({});
  const [reviews, setReviews] = useState({});
  const [myBids, setMyBids] = useState([]);
  const [bidCounts, setBidCounts] = useState({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    api.tasks.list()
      .then((list) => {
        setOpenTasks(list.filter((t) => t.status === "open"));
        setMyTasks(list);
      })
      .catch(() => {
        setOpenTasks([]);
        setMyTasks([]);
      })
      .finally(() => setReady(true));
    api.fees.mine()
      .then((rows) => setPostingFees(rows.reduce((sum, row) => sum + Number(row.fee_php || 0), 0)))
      .catch(() => setPostingFees(0));
    api.escrow.minePayouts()
      .then((rows) => setReleasedPayouts(
        (rows || [])
          .filter((row) => row.status === "released")
          .reduce((sum, row) => sum + Number(row.tasker_payout || 0), 0)
      ))
      .catch(() => setReleasedPayouts(0));
  }, [user?.active_mode]);

  const posted = myTasks.filter((t) => t.client_id === user?.id);
  const postedKey = posted.map((t) => t.id).join(",");

  useEffect(() => {
    if (!poster || !postedKey) {
      setBidCounts({});
      return;
    }
    api.offers.countsByTask(postedKey.split(",")).then(setBidCounts).catch(() => setBidCounts({}));
  }, [poster, postedKey]);

  useEffect(() => {
    if (!poster || !user) return;
    const ids = [...new Set(posted.map((t) => t.accepted_tasker_id).filter(Boolean))];
    Promise.all(ids.map((id) => api.profile.get(id).catch(() => null))).then((rows) => {
      const map = {};
      rows.forEach((p) => { if (p) map[p.id] = p; });
      setPeople(map);
    });
    api.reviews.listByReviewer(user.id)
      .then((rows) => {
        const map = {};
        rows.forEach((r) => { map[r.task_id] = r; });
        setReviews(map);
      })
      .catch(() => setReviews({}));
  }, [poster, user, posted.length]);

  useEffect(() => {
    if (poster || !user) return;
    api.offers.listMine().then(setMyBids).catch(() => setMyBids([]));
  }, [poster, user]);

  const filtered = openTasks.filter((task) => {
    if (search && !`${task.title} ${task.details}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (!taskMatchesChip(task.category, category, task)) return false;
    return true;
  }).slice(0, 8);

  const openPosterIdsKey = filtered.map((t) => t.client_id).filter(Boolean).sort().join(",");

  useEffect(() => {
    if (poster || !user || !openPosterIdsKey) return;
    const ids = openPosterIdsKey.split(",");
    let live = true;
    Promise.all(ids.map((id) => api.profile.get(id).catch(() => null))).then((rows) => {
      if (!live) return;
      const map = {};
      rows.forEach((p) => { if (p) map[p.id] = p; });
      setPeople(map);
    });
    return () => {
      live = false;
    };
  }, [poster, user, openPosterIdsKey]);

  const pendingBids = myBids.filter((o) => o.status === "pending");
  const bidsByTask = new Map();
  for (const bid of myBids) {
    if (!bidsByTask.has(bid.task_id)) bidsByTask.set(bid.task_id, bid);
  }

  return (
    <AppShell>
      <div className="landing-page">
        {needsTaskerVerification(user) ? (
        <div className="bg-white px-4 pt-4 sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-3">
            {needsTaskerVerification(user) ? (
              <div className="relative overflow-hidden rounded-[1.4rem] bg-gradient-to-r from-[#FFF6DC] via-[#FFE4A3] to-[#F6C56B] shadow-card">
                <div className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-white/45" />
                <div className="pointer-events-none absolute -bottom-8 left-1/3 h-20 w-20 rounded-full bg-[#F59E0B]/25" />
                <div className="relative flex flex-col items-start gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F59E0B] text-white shadow-[0_8px_18px_rgba(245,158,11,0.35)]">
                      <CircleAlert className="h-5 w-5" color="#fff" />
                    </span>
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#B45309]">Kailangan i-verify</p>
                      <p className="mt-0.5 text-sm font-semibold leading-snug text-[#6B3E08]">
                        I-verify ang account mo (government ID) para makapag-post at makatanggap ng gawain. One application lang.
                      </p>
                    </div>
                  </div>
                  <Link href="/verify" className="inline-flex h-10 shrink-0 items-center rounded-full bg-[#B45309] px-5 text-xs font-bold text-white">
                    I-verify ang account
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        </div>
        ) : null}

        <section className="bg-[#ffffff] pb-6 pt-0 dark:bg-[#11141A] sm:py-6">
          {poster ? (
            <>
              <div className="dash-sheet">
                <InstallAppBanner />
                <DashboardShortcuts user={user} postingFees={postingFees} releasedPayouts={releasedPayouts} myTasks={myTasks} />
              </div>
              <div className="mx-auto mt-8 w-full max-w-6xl px-4 sm:px-6 lg:px-8">
                <SectionIntro
                  pill="Poster"
                  title="Mga naka-post mong gawain"
                  sub="Status, kung sino'ng kumuha, i-edit, at i-rate after a successful job."
                />
                {!ready ? <div className="mt-4"><PageSkeleton rows={3} /></div> : (
                <PostedJobsList
                  preview
                  tasks={posted}
                  people={people}
                  reviews={reviews}
                  bidCounts={bidCounts}
                  onCancel={async (task) => {
                    try {
                      await api.tasks.cancel(task.id);
                      const list = await api.tasks.list();
                      setOpenTasks(list.filter((t) => t.status === "open"));
                      setMyTasks(list);
                      toast.success("Gawain cancelled");
                    } catch (err) {
                      toast.error(err.message || "Could not cancel gawain");
                    }
                  }}
                />
                )}

                <SectionIntro
                  className="mt-8"
                  pill="Categories"
                  title="Ano'ng kailangan mo?"
                  sub="Tap a category para mag-post."
                />
              </div>
              <div className="landing-marquee mt-4 hidden overflow-hidden sm:block">
                <div className="landing-marquee-track">
                  {[...landingCategories, ...landingCategories].map((cat, i) => (
                    <CategoryCard key={`${cat.key}-${i}`} cat={{ ...cat, href: `/post?category=${cat.key}` }} />
                  ))}
                </div>
              </div>
              <div className="no-scrollbar mt-4 grid auto-cols-max grid-flow-col grid-rows-2 gap-3 overflow-x-auto px-4 pb-2 sm:hidden">
                {landingCategories.map((cat) => (
                  <CategoryCard key={cat.key} cat={{ ...cat, href: `/post?category=${cat.key}` }} compact />
                ))}
              </div>
            </>
          ) : (
            <>
            <InstallAppBanner />
            <div className="mx-auto w-full max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
              <div>
                <SectionIntro
                  pill="Open jobs"
                  title="Hanapin ang next gawain mo"
                  sub="Swipe the carousel or tap See all for the full list."
                  action={
                    <Link href="/browse" className="text-xs font-bold underline-offset-4 hover:underline" style={{ color: LANDING.olive }}>
                      See all
                    </Link>
                  }
                />
              </div>

              <SearchPill value={search} onChange={setSearch} placeholder="Maghanap ng job o task..." />
              <CategoryChips categories={CHIP_CATEGORIES} value={category} onChange={setCategory} />

              {!ready ? (
                <PageSkeleton rows={3} />
              ) : (
              <FadeIn delay={80}>
                <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 snap-x snap-mandatory sm:mx-0 sm:px-0">
                  {filtered.map((task) => {
                    const badge = interactionBadge(task, user?.id, bidsByTask.get(task.id))
                      || (!poster
                        ? (skillFitsTask(user?.skills, task)
                          ? { label: "Qualified", bg: "#D7F0EA", fg: "#0D666A" }
                          : { label: "Not qualified", bg: "#EFE8DC", fg: "#8A6A32" })
                        : null);
                    const posterProfile = people[task.client_id];
                    const posterName = posterProfile?.full_name || task.client_name || "Khaki user";
                    return (
                      <OpenJobCard
                        key={task.id}
                        task={task}
                        badge={badge}
                        posterName={posterName}
                        posterSrc={posterProfile?.avatar_url || posterProfile?.profile_photo}
                      />
                    );
                  })}
                </div>
              </FadeIn>
              )}

              {ready && filtered.length === 0 ? (
                <p className="rounded-[1.35rem] border border-dashed border-[#C9D6E0] bg-card py-12 text-center text-sm text-muted-foreground">
                  Walang open jobs pa. Check back soon.
                </p>
              ) : null}

              {pendingBids.length > 0 ? (
                <div className="rounded-[1.5rem] bg-[#FFFCF7] p-5 shadow-card">
                  <SectionIntro
                    pill="Bids"
                    title="Pending — puwede mo pang i-adjust"
                  />
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {pendingBids.map((bid) => (
                      <Link key={bid.id} href={`/task/${bid.task_id}`} className="rounded-2xl bg-[#F3EFE3] p-4">
                        <p className="money text-sm font-black">{formatPHP(bid.amount_php)}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{bid.pitch || "Walang pitch"}</p>
                        <p className="mt-2 text-[11px] font-bold" style={{ color: LANDING.olive }}>I-adjust ang fee →</p>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="pt-4">
                <DashboardShortcuts user={user} postingFees={postingFees} releasedPayouts={releasedPayouts} myTasks={myTasks} />
              </div>

              <div className="pt-4">
                <SectionIntro
                  pill="Categories"
                  title="Browse by type"
                  sub="Tap a category to filter open jobs."
                />
              </div>
              <div className="landing-marquee mt-4 hidden overflow-hidden sm:block">
                <div className="landing-marquee-track">
                  {[...landingCategories, ...landingCategories].map((cat, i) => (
                    <CategoryCard key={`${cat.key}-${i}`} cat={cat} />
                  ))}
                </div>
              </div>
              <div className="no-scrollbar mt-4 grid auto-cols-max grid-flow-col grid-rows-2 gap-3 overflow-x-auto pb-2 sm:hidden">
                {landingCategories.map((cat) => (
                  <CategoryCard key={cat.key} cat={cat} compact />
                ))}
              </div>

              <Link href="/browse" className="btn-olive mt-2 inline-flex h-12 items-center px-7 text-sm">
                Maghanap ng gawain
              </Link>
            </div>
            </>
          )}
        </section>
      </div>
    </AppShell>
  );
}
