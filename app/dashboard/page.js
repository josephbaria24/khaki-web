"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import CategoryCard from "@/components/landing/CategoryCard";
import CategoryChips from "@/components/ui/CategoryChips";
import SearchPill from "@/components/ui/SearchPill";
import DashboardShortcuts from "@/components/DashboardShortcuts";
import PostedJobCard from "@/components/PostedJobCard";
import SectionIntro from "@/components/SectionIntro";
import { FadeIn } from "@/components/ui/motion";
import { CHIP_CATEGORIES, taskMatchesChip } from "@/lib/catalog";
import { LANDING, LANDING_CATEGORIES } from "@/lib/landingContent";
import { displayCategory, formatPHP } from "@/lib/khaki";
import { useAuth } from "@/lib/AuthContext";
import { canOpenPost, isPosterMode, needsTaskerVerification } from "@/lib/roles";
import { api } from "@/lib/store";
import { toast } from "@/lib/toast";
import { X } from "@/components/icons";

const PROMO_DISMISS_KEY = "khaki.dashboardPromoDismissed";

export default function DashboardPage() {
  const { user } = useAuth();
  const poster = isPosterMode(user);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [openTasks, setOpenTasks] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [postingFees, setPostingFees] = useState(0);
  const [people, setPeople] = useState({});
  const [reviews, setReviews] = useState({});
  const [myBids, setMyBids] = useState([]);
  const [promoOpen, setPromoOpen] = useState(true);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(PROMO_DISMISS_KEY) === "1") setPromoOpen(false);
    } catch {
      /* ignore */
    }
  }, []);

  const dismissPromo = () => {
    setPromoOpen(false);
    try {
      window.localStorage.setItem(PROMO_DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    api.tasks.list()
      .then((list) => {
        setOpenTasks(list.filter((t) => t.status === "open"));
        setMyTasks(list);
      })
      .catch(() => {
        setOpenTasks([]);
        setMyTasks([]);
      });
    api.fees.mine()
      .then((rows) => setPostingFees(rows.reduce((sum, row) => sum + Number(row.fee_php || 0), 0)))
      .catch(() => setPostingFees(0));
  }, [user?.active_mode]);

  const posted = myTasks.filter((t) => t.client_id === user?.id);

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
    if (!taskMatchesChip(task.category, category)) return false;
    return true;
  }).slice(0, 8);

  const postHref = canOpenPost(user) ? "/post" : "/browse";
  const pendingBids = myBids.filter((o) => o.status === "pending");

  return (
    <AppShell>
      <div className="landing-page">
        {promoOpen ? (
          <div className="landing-promo relative">
            <button
              type="button"
              onClick={dismissPromo}
              className="absolute right-3 top-3 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full text-[#F7F4EC]/70 transition hover:bg-white/10 hover:text-[#F7F4EC] sm:right-5 lg:right-7"
              aria-label="Dismiss promo"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-4 px-4 py-4 pr-12 sm:flex-row sm:items-center sm:px-6 sm:pr-14 lg:px-8 lg:pr-16">
              <div>
                {poster ? (
                  <>
                    <p className="text-sm font-black text-[#F7F4EC]">Mag-post ng gawain — 2% posting fee lang</p>
                    <p className="text-sm text-[#F7F4EC]/80">Charged when you post. Job payment stays between you and the tasker.</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-black text-[#F7F4EC]">Maghanap ng gawain sa Palawan</p>
                    <p className="text-sm text-[#F7F4EC]/80">Sumali sa bidding, i-adjust ang fee mo, at tingnan ang feedback ng poster.</p>
                  </>
                )}
              </div>
              <Link href={postHref} className="btn-sand inline-flex h-10 items-center px-5 text-xs">
                {poster ? "Mag-post ngayon" : "Maghanap"}
              </Link>
            </div>
          </div>
        ) : null}

        {needsTaskerVerification(user) ? (
          <div className="bg-[#E8DCC4]">
            <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-6 lg:px-8">
              <p className="text-sm font-semibold text-[#2A3F4D]">
                I-verify ang account mo (government ID) para makapag-post at makatanggap ng gawain. One application lang.
              </p>
              <Link href="/verify" className="btn-olive inline-flex h-10 items-center px-5 text-xs">
                I-verify ang account
              </Link>
            </div>
          </div>
        ) : null}

        <section className="bg-[#FBF8F1] py-6 sm:py-8">
          {poster ? (
            <>
              <DashboardShortcuts user={user} postingFees={postingFees} myTasks={myTasks} />
              <div className="mx-auto mt-8 w-full max-w-6xl px-4 sm:px-6 lg:px-8">
                <SectionIntro
                  pill="Poster"
                  title="Mga naka-post mong gawain"
                  sub="Status, kung sino'ng kumuha, i-edit, at i-rate after a successful job."
                  action={
                    <Link href="/post" className="btn-olive hidden h-9 items-center px-4 text-[11px] sm:inline-flex">
                      Mag-post ng gawain
                    </Link>
                  }
                />
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {posted.map((task) => (
                    <PostedJobCard
                      key={task.id}
                      task={task}
                      tasker={people[task.accepted_tasker_id]}
                      review={reviews[task.id]}
                      onCancel={async () => {
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
                  ))}
                </div>
                {posted.length === 0 ? (
                  <p className="mt-6 rounded-[1.35rem] border border-dashed border-[#C9D6E0] bg-card py-12 text-center text-sm text-muted-foreground">
                    Wala ka pang naka-post. Mag-post ng gawain para maghanap ng tulong.
                  </p>
                ) : null}

                <SectionIntro
                  className="mt-8"
                  pill="Categories"
                  title="Ano'ng kailangan mo?"
                  sub="Tap a category para mag-post."
                />
              </div>
              <div className="landing-marquee mt-4 hidden overflow-hidden sm:block">
                <div className="landing-marquee-track">
                  {[...LANDING_CATEGORIES, ...LANDING_CATEGORIES].map((cat, i) => (
                    <CategoryCard key={`${cat.key}-${i}`} cat={{ ...cat, href: "/post" }} />
                  ))}
                </div>
              </div>
              <div className="no-scrollbar mt-4 grid auto-cols-max grid-flow-col grid-rows-2 gap-3 overflow-x-auto px-4 pb-2 sm:hidden">
                {LANDING_CATEGORIES.map((cat) => (
                  <CategoryCard key={cat.key} cat={{ ...cat, href: "/post" }} compact />
                ))}
              </div>
            </>
          ) : (
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

              <FadeIn delay={80}>
                <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 snap-x snap-mandatory sm:mx-0 sm:px-0">
                  {filtered.map((task) => (
                    <Link
                      key={task.id}
                      href={`/task/${task.id}`}
                      className="w-[min(78vw,280px)] shrink-0 snap-start rounded-[1.35rem] bg-card p-5 shadow-card transition hover:-translate-y-0.5 sm:w-[260px]"
                    >
                      <p className="text-xs font-bold uppercase tracking-wide" style={{ color: LANDING.olive }}>
                        {displayCategory(task.category)}
                      </p>
                      <p className="mt-2 min-h-[48px] text-[15px] font-bold leading-snug text-foreground">{task.title}</p>
                      <div className="mt-4 flex items-end justify-between gap-3">
                        <p className="text-lg font-black text-foreground">{formatPHP(task.budget_php)}</p>
                        <p className="text-xs text-muted-foreground">{task.is_remote ? "Remote" : task.location_area}</p>
                      </div>
                      <p className="mt-2 text-[11px] font-semibold text-muted-foreground">
                        Poster: {task.client_name || "Khaki user"}
                      </p>
                    </Link>
                  ))}
                </div>
              </FadeIn>

              {filtered.length === 0 ? (
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
                        <p className="text-sm font-black">{formatPHP(bid.amount_php)}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{bid.pitch || "Walang pitch"}</p>
                        <p className="mt-2 text-[11px] font-bold" style={{ color: LANDING.olive }}>I-adjust ang fee →</p>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="pt-4">
                <DashboardShortcuts user={user} postingFees={postingFees} myTasks={myTasks} />
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
                  {[...LANDING_CATEGORIES, ...LANDING_CATEGORIES].map((cat, i) => (
                    <CategoryCard key={`${cat.key}-${i}`} cat={cat} />
                  ))}
                </div>
              </div>
              <div className="no-scrollbar mt-4 grid auto-cols-max grid-flow-col grid-rows-2 gap-3 overflow-x-auto pb-2 sm:hidden">
                {LANDING_CATEGORIES.map((cat) => (
                  <CategoryCard key={cat.key} cat={cat} compact />
                ))}
              </div>

              <Link href="/browse" className="btn-olive mt-2 inline-flex h-12 items-center px-7 text-sm">
                Maghanap ng gawain
              </Link>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
