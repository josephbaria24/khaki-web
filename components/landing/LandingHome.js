"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ShieldCheck, Wallet } from "@/components/icons";
import CategoryCard from "@/components/landing/CategoryCard";
import CategoryBreakdown from "@/components/landing/CategoryBreakdown";
import { formatPHP } from "@/lib/khaki";
import {
  LANDING,
  LANDING_CATEGORIES,
  LANDING_DISCLAIMER,
  LANDING_EARN_POINTS,
  LANDING_FAQS,
  LANDING_STEPS,
  LANDING_TASK_TABS,
  LANDING_TASKERS,
  LANDING_TASKS,
  LANDING_TRUST,
} from "@/lib/landingContent";
import { useAuth } from "@/lib/AuthContext";
import { canOpenPost } from "@/lib/roles";
import { Collapse } from "@/components/ui/motion";

function Stars({ count = 5, className = "h-3.5 w-3.5" }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${count} stars`}>
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} viewBox="0 0 20 20" className={className} fill={LANDING.olive} aria-hidden>
          <path d="M10 1.5l2.47 5.01 5.53.8-4 3.9.94 5.5L10 14.1 5.06 16.71l.94-5.5-4-3.9 5.53-.8L10 1.5z" />
        </svg>
      ))}
    </span>
  );
}

function CheckMark() {
  return (
    <span
      className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
      style={{ background: LANDING.sage, color: LANDING.oliveDeep }}
    >
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden>
        <path d="M3.5 8.2l3 3.3 6-6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function FaqItem({ item, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-black/5 bg-card p-5 shadow-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-between gap-4 text-left text-base font-bold text-foreground"
      >
        {item.q}
        <span
          className={`shrink-0 text-muted-foreground transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? "rotate-180" : "rotate-0"}`}
          aria-hidden
        >
          ▾
        </span>
      </button>
      <Collapse open={open}>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
      </Collapse>
    </div>
  );
}

function SectionWrap({ children, className = "", id }) {
  return (
    <section id={id} className={className}>
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}

function ScrollRow({ children }) {
  const ref = useRef(null);
  const scroll = (dir) => {
    ref.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <div ref={ref} className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 pt-1 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
        {children}
      </div>
      <button
        type="button"
        onClick={() => scroll(-1)}
        className="absolute left-0 top-1/2 hidden h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-card shadow-soft lg:flex"
        aria-label="Scroll previous"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => scroll(1)}
        className="absolute right-0 top-1/2 hidden h-11 w-11 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-card shadow-soft lg:flex"
        aria-label="Scroll next"
      >
        <ArrowRight className="h-5 w-5" />
      </button>
    </div>
  );
}

function TaskPreviewCard({ task }) {
  return (
    <article className="w-[240px] shrink-0 rounded-[1.35rem] bg-card p-5 shadow-card">
      <p className="text-xs font-bold uppercase tracking-wide" style={{ color: LANDING.olive }}>
        {task.category}
      </p>
      <p className="mt-2 min-h-[48px] text-[15px] font-bold leading-snug text-foreground">{task.title}</p>
      <div className="mt-4 flex items-center justify-between">
        <p className="text-lg font-black text-foreground">{formatPHP(task.budget)}</p>
        <Stars count={task.stars} />
      </div>
    </article>
  );
}

export default function LandingHome() {
  const { isAuthenticated, user } = useAuth();
  const [tab, setTab] = useState(LANDING_TASK_TABS[0]);
  const postHref = isAuthenticated ? (canOpenPost(user) ? "/post" : "/browse") : "/register";
  const earnHref = "/register?role=tasker";
  const visibleTasks = useMemo(() => LANDING_TASKS.filter((t) => t.tab === tab), [tab]);

  return (
    <div className="landing-page w-full min-w-0">
      <section className="overflow-x-clip bg-[#FBF8F1] px-0 pb-3 pt-3 sm:pt-5 md:px-8 md:py-6 lg:px-[6vw] lg:py-8">
        <div className="hero-mobile-card relative mx-auto w-[95%] min-w-0 overflow-hidden rounded-[1.75rem] bg-[#163044] text-white shadow-[0_22px_50px_rgba(22,48,68,0.28)] min-[380px]:rounded-[1.85rem] md:w-full md:max-w-5xl md:rounded-[2.15rem] lg:max-w-none">
          <div
            className="pointer-events-none absolute inset-x-8 top-8 h-36 rounded-full bg-[#3E7498]/45 blur-3xl md:hidden"
            aria-hidden
          />
          <div className="hero-art-stage relative overflow-hidden lg:hidden h-[min(105vw,24rem)] min-[400px]:h-[min(92vw,26rem)] sm:h-[min(72vw,28rem)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/transparent-hero-protrait.png"
              alt=""
              className="hero-art-float hero-art-mask absolute inset-x-0 top-0 z-[1] h-[calc(100%+1.5rem)] w-full object-cover object-[center_44%]"
            />
            <div className="hero-art-fade pointer-events-none absolute inset-x-0 -bottom-px z-[2] h-[56%]" aria-hidden />
          </div>
          <div className="hero-art-stage relative hidden aspect-[16/9] overflow-hidden lg:block lg:aspect-[2/1]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/transparent-hero.png"
              alt=""
              className="hero-art-float hero-art-mask absolute inset-x-0 top-0 z-[1] h-[calc(100%+1.5rem)] w-full object-cover object-[center_46%]"
            />
            <div className="hero-art-fade pointer-events-none absolute inset-x-0 -bottom-px z-[2] h-[34%]" aria-hidden />
          </div>
          <div className="stagger-children relative z-[1] min-w-0 px-4 pb-6 pt-1 text-center min-[380px]:px-5 min-[380px]:pb-7 sm:px-8 sm:pb-9 md:px-12 md:pb-12 md:pt-2 lg:px-16">
            <h1 className="mx-auto max-w-full text-[1.7rem] font-black uppercase leading-[0.9] tracking-[-0.045em] text-white min-[360px]:text-[2rem] min-[400px]:text-[2.2rem] sm:text-[2.75rem] md:text-[3rem] lg:text-[3.4rem]">
              Get anything
              <br />
              done
            </h1>
            <p className="mx-auto mt-3 max-w-[16.5rem] text-[13.5px] font-medium leading-snug text-white/80 min-[380px]:mt-4 min-[380px]:text-[15px] sm:max-w-xs sm:text-base md:max-w-md md:text-lg">
              Post any task. Pick a trusted Palawan local. Get it done.
            </p>
            <div className="mx-auto mt-5 flex w-full flex-col gap-2.5 min-[380px]:mt-6 md:mt-7 md:max-w-xl md:flex-row md:justify-center">
              <Link
                href={postHref}
                className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#2F8AD4] px-4 text-[13.5px] font-bold text-white shadow-[0_10px_24px_rgba(47,138,212,0.38)] transition-transform duration-200 active:scale-[0.98] min-[380px]:h-[3.25rem] min-[380px]:text-[15px] md:flex-1"
              >
                Post your task for free
              </Link>
              <Link
                href={earnHref}
                className="inline-flex h-12 w-full items-center justify-center rounded-full bg-white px-4 text-[13.5px] font-bold text-[#163044] transition-transform duration-200 active:scale-[0.98] min-[380px]:h-[3.25rem] min-[380px]:text-[15px] md:flex-1"
              >
                Earn money as a Tasker
              </Link>
            </div>
            <div className="mt-6 flex items-center justify-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10" aria-hidden>
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="currentColor">
                  <path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm6.2-.4a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2ZM4.2 18.2c.4-2.3 2.4-3.7 4.8-3.7s4.4 1.4 4.8 3.7c.1.5-.3.8-.8.8H5c-.5 0-.9-.3-.8-.8Zm8.3-.2c-.2-1.5.2-2.8 1.2-3.7.4-.3.9-.5 1.4-.6 1.9.2 3.4 1.5 3.7 3.6.1.5-.3.9-.8.9h-4.8c-.3 0-.6-.1-.7-.2Z" />
                </svg>
              </span>
              <div className="text-left">
                <p className="text-sm font-bold leading-none text-white">Palawan-wide</p>
                <p className="mt-1 text-[11px] font-medium leading-none text-white/65">Every town · 2% until Feb 2027</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="landing-promo">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-4 px-4 py-4 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-black text-[#F7F4EC]">2% posting fee until February 2027</p>
            <p className="text-sm text-[#F7F4EC]/80">Charged when you post. The task payment is between you and the tasker.</p>
          </div>
          <Link href="/register" className="btn-sand inline-flex h-10 items-center px-5 text-xs">
            Join now
          </Link>
        </div>
      </div>

      <SectionWrap id="how-it-works" className="scroll-mt-24 bg-background py-16 lg:py-20">
        <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: LANDING.olive }}>
          How it works
        </p>
        <h2 className="mt-3 max-w-xl text-3xl font-black tracking-tight text-foreground sm:text-4xl">
          Post your first task in seconds
        </h2>
        <p className="mt-3 max-w-lg text-muted-foreground">
          Save yourself hours and get your Palawan to-do list completed.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {LANDING_STEPS.map((step) => (
            <article key={step.num} className="soft-card p-5">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-black"
                style={{ background: LANDING.sage, color: LANDING.oliveDeep }}
              >
                {step.num}
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={step.image}
                alt=""
                className="mx-auto mt-3 h-40 w-full object-contain sm:h-44"
              />
              <p className="mt-4 text-base font-black leading-snug text-foreground">{step.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
            </article>
          ))}
        </div>
        <Link href={postHref} className="btn-olive mt-10 inline-flex h-12 items-center px-7 text-sm">
          Post your task
        </Link>
      </SectionWrap>

      <section className="bg-[#FBF8F1] py-12 lg:py-16">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-black text-foreground sm:text-3xl">What can you get done?</h2>
          <p className="mt-2 text-muted-foreground">Popular Palawan categories, ready when you are.</p>
        </div>
        <div className="landing-marquee mt-8 hidden overflow-hidden sm:block">
          <div className="landing-marquee-track">
            {[...LANDING_CATEGORIES, ...LANDING_CATEGORIES].map((cat, i) => (
              <CategoryCard key={`${cat.key}-${i}`} cat={cat} />
            ))}
          </div>
        </div>
        <div className="no-scrollbar mt-8 grid auto-cols-max grid-flow-col grid-rows-2 gap-3 overflow-x-auto px-4 pb-2 sm:hidden">
          {LANDING_CATEGORIES.map((cat) => (
            <CategoryCard key={cat.key} cat={cat} compact />
          ))}
        </div>
        <div className="mx-auto mt-4 w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <CategoryBreakdown />
          <Link href="/#how-it-works" className="mt-8 inline-block text-sm font-bold underline-offset-4 hover:underline" style={{ color: LANDING.olive }}>
            Learn how Khaki works
          </Link>
        </div>
      </section>

      <SectionWrap className="bg-background py-16 lg:py-20">
        <h2 className="text-3xl font-black tracking-tight text-foreground">See what others are getting done</h2>
        <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto pb-1">
          {LANDING_TASK_TABS.map((item) => {
            const active = item === tab;
            return (
              <button
                key={item}
                type="button"
                onClick={() => setTab(item)}
                className={active ? "chip-active whitespace-nowrap" : "chip-inactive whitespace-nowrap"}
                style={active ? { background: LANDING.olive, color: LANDING.cream } : undefined}
              >
                {item}
              </button>
            );
          })}
        </div>
        <div key={tab} className="mt-8 animate-fade-in-up">
          <ScrollRow>
            {visibleTasks.map((task) => (
              <TaskPreviewCard key={task.title} task={task} />
            ))}
          </ScrollRow>
        </div>
        <Link href={postHref} className="btn-olive mt-8 inline-flex h-12 items-center px-7 text-sm">
          Post your task for free
        </Link>
      </SectionWrap>

      <section className="bg-[#FBF8F1] py-16 lg:py-20">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black tracking-tight text-foreground">Trust and safety features for your protection</h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {LANDING_TRUST.map((item, i) => (
              <div key={item.title}>
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{ background: LANDING.sage, color: LANDING.oliveDeep }}
                >
                  {i === 0 ? <Wallet className="h-5 w-5" /> : i === 1 ? <Stars count={1} className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
                </span>
                <h3 className="mt-4 text-lg font-black text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
          <Link href={postHref} className="btn-olive mt-10 inline-flex h-12 items-center px-7 text-sm">
            Post your task for free
          </Link>
        </div>
      </section>

      <section id="earn" className="landing-hero scroll-mt-24">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-20">
          <div className="rounded-[2rem] bg-white p-6 shadow-[0_16px_40px_rgba(16,38,54,0.16)] sm:p-8">
            <p className="text-sm font-black" style={{ color: LANDING.oliveDeep }}>
              160+ Palawan taskers already earning
            </p>
            <div className="mt-5 space-y-3">
              {LANDING_TASKERS.slice(0, 3).map((person) => (
                <div
                  key={person.name}
                  className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-[0_8px_22px_rgba(16,38,54,0.12)]"
                >
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-black"
                    style={{ background: person.tone, color: LANDING.oliveDeep }}
                  >
                    {person.initial}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-bold text-[#2C2A22]">{person.name}</p>
                    <p className="text-xs text-[#2C2A22]/65">
                      {person.rating} · {person.location}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="text-[#F7F4EC]">
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Be your own boss</h2>
            <p className="mt-3 max-w-md text-[#F7F4EC]/85">
              Whether you&apos;re great at pabili, tours, or home repair, find your next job on Khaki.
            </p>
            <ul className="mt-6 space-y-3">
              {LANDING_EARN_POINTS.map((point) => (
                <li key={point} className="flex items-start gap-3 text-sm sm:text-base">
                  <CheckMark />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            <Link href={earnHref} className="btn-sand mt-8 inline-flex h-12 items-center px-7 text-sm">
              Earn money as a Tasker
            </Link>
          </div>
        </div>
      </section>

      <SectionWrap className="bg-background py-16 lg:py-20">
        <p className="text-sm font-bold text-muted-foreground">Taskers have earned income on Khaki</p>
        <h2 className="mt-2 max-w-2xl text-3xl font-black tracking-tight text-foreground">
          Start earning with Palawan&apos;s local services marketplace.
        </h2>
        <div className="mt-10">
          <ScrollRow>
            {LANDING_TASKERS.map((person) => (
              <article key={person.name} className="w-[300px] shrink-0 rounded-[1.5rem] bg-card p-6 shadow-card">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-14 w-14 items-center justify-center rounded-full text-lg font-black"
                    style={{ background: person.tone, color: LANDING.oliveDeep }}
                  >
                    {person.initial}
                  </span>
                  <div>
                    <p className="font-black text-foreground">{person.name}</p>
                    <p className="text-sm text-muted-foreground">{person.location}</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="flex items-center gap-1 text-lg font-black">
                      {person.rating} <Stars count={1} />
                    </p>
                    <p className="text-muted-foreground">Overall rating</p>
                  </div>
                  <div>
                    <p className="text-lg font-black">{person.completion}</p>
                    <p className="text-muted-foreground">Completion</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  <span className="font-bold text-foreground">Specialties: </span>
                  {person.specialties}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-foreground/80">{person.bio}</p>
                <div className="mt-4 rounded-2xl p-4" style={{ background: LANDING.cream }}>
                  <p className="text-xs font-bold uppercase tracking-wide" style={{ color: LANDING.olive }}>
                    What the reviews say
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-[#2C2A22]">&ldquo;{person.quote}&rdquo;</p>
                  <p className="mt-2 text-xs font-bold text-[#2C2A22]/60">— {person.reviewer}</p>
                </div>
              </article>
            ))}
          </ScrollRow>
        </div>
      </SectionWrap>

      <SectionWrap id="faq" className="bg-[#FBF8F1] py-16 lg:py-20">
        <div className="flex items-center gap-3">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg font-black"
            style={{ background: LANDING.olive, color: LANDING.cream }}
          >
            ?
          </span>
          <h2 className="text-3xl font-black tracking-tight text-foreground">Frequently Asked Questions</h2>
        </div>
        <div className="mt-8 space-y-3">
          {LANDING_FAQS.map((item, i) => (
            <FaqItem key={item.q} item={item} defaultOpen={i === 0} />
          ))}
        </div>
      </SectionWrap>

      <SectionWrap className="bg-background pb-16 lg:pb-20">
        <div className="rounded-2xl border border-black/10 bg-card p-5 shadow-card sm:p-6">
          <div className="flex items-start gap-3">
            <span
              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
              style={{ background: LANDING.sage, color: LANDING.oliveDeep }}
            >
              <ShieldCheck className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-black text-foreground">{LANDING_DISCLAIMER.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{LANDING_DISCLAIMER.body}</p>
            </div>
          </div>
        </div>
      </SectionWrap>
    </div>
  );
}
