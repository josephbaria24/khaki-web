"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Clock, MapPin, Search, Wallet } from "@/components/icons";
import AppShell from "@/components/AppShell";
import Container from "@/components/Container";
import SectionIntro from "@/components/SectionIntro";
import { useAuth } from "@/lib/AuthContext";
import { LOCATIONS, SCHEDULE_LABELS, SERVICE_CATEGORIES, cn, formatPHP, postingFee, serviceByKey } from "@/lib/khaki";
import { getBarangays } from "@/lib/palawanLocations";
import { canOpenPost, canPostTask } from "@/lib/roles";
import { api } from "@/lib/store";
import { toast } from "@/lib/toast";

function Field({ label, children }) {
  return (
    <div>
      <p className="mb-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#163044]/50">{label}</p>
      {children}
    </div>
  );
}

function Chip({ on, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1.5 text-[11px] font-bold leading-none",
        on ? "bg-[#163044] text-[#F7F4EC]" : "bg-[#F3EFE3] text-[#2A3F4D]"
      )}
    >
      {children}
    </button>
  );
}

const fieldClass =
  "h-11 w-full rounded-full bg-[#F3EFE3] px-4 text-sm font-semibold text-[#163044] outline-none placeholder:font-medium placeholder:text-[#2A3F4D]/40";

function PostSelect({ id, openId, setOpenId, value, options, onChange, placeholder = "Select" }) {
  const open = openId === id;
  const [shown, setShown] = useState(open);
  const [query, setQuery] = useState("");
  const wrapRef = useRef(null);
  const searchRef = useRef(null);
  const selected = options.find((o) => o.value === value);
  const q = query.trim().toLowerCase();
  const filtered = q
    ? options.filter((o) => `${o.label} ${o.desc || ""}`.toLowerCase().includes(q))
    : options;

  useEffect(() => {
    if (open) {
      setShown(true);
      setQuery("");
      const frame = window.requestAnimationFrame(() => searchRef.current?.focus());
      return () => window.cancelAnimationFrame(frame);
    }
    if (!shown) return undefined;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setShown(false), reduced ? 0 : 180);
    return () => window.clearTimeout(timer);
  }, [open, shown]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpenId(null);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpenId(null);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, setOpenId]);

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        className={`${fieldClass} flex items-center justify-between gap-2 text-left`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpenId(open ? null : id)}
      >
        <span className={cn("min-w-0 truncate", !selected && "font-medium text-[#2A3F4D]/40")}>
          {selected?.label || placeholder}
        </span>
        <ChevronLeft className={cn("post-select-chevron h-4 w-4 shrink-0 text-[#163044]/55", open && "is-open")} />
      </button>
      {shown ? (
        <div
          className={cn("post-select-menu", !open && "is-leaving")}
          onAnimationEnd={(e) => {
            if (e.target !== e.currentTarget) return;
            if (!open) setShown(false);
          }}
        >
          <div className="shrink-0 border-b border-black/5 px-2 pb-2 pt-2">
            <label className="relative flex items-center">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#163044]/40" />
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.preventDefault();
                }}
                placeholder="Search"
                className="h-9 w-full rounded-full bg-[#F3EFE3] pl-8 pr-3 text-xs font-semibold text-[#163044] outline-none placeholder:font-medium placeholder:text-[#2A3F4D]/40"
              />
            </label>
          </div>
          <div role="listbox" className="min-h-0 flex-1 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-3.5 py-6 text-center text-[12px] font-semibold text-[#2A3F4D]/50">No matches</p>
            ) : (
              filtered.map((option) => {
                const active = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={active}
                    className={cn(
                      "block w-full px-3.5 py-2.5 text-left text-sm font-bold text-[#163044] hover:bg-[#F3EFE3]",
                      active && "bg-[#F3EFE3]"
                    )}
                    onClick={() => {
                      onChange(option.value);
                      setOpenId(null);
                    }}
                  >
                    {option.label}
                    {option.desc ? (
                      <span className="mt-0.5 block text-[11px] font-medium leading-snug text-[#2A3F4D]/55">{option.desc}</span>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function PostPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [form, setForm] = useState({
    title: "",
    categoryKey: SERVICE_CATEGORIES[0].key,
    groupTitle: "",
    location_area: LOCATIONS[0],
    barangay: "",
    location_detail: "",
    is_remote: false,
    schedule_type: "flexible",
    schedule_date: "",
    details: "",
    budget_php: 200,
  });
  const [error, setError] = useState("");
  const [openSelect, setOpenSelect] = useState(null);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const { categoryKey, groupTitle, details, ...rest } = form;
      const service = serviceByKey(categoryKey);
      const task = await api.tasks.create({
        ...rest,
        category: service.enumValue,
        details: groupTitle && details ? `${groupTitle}\n\n${details}` : groupTitle || details,
      });
      toast.success("Gawain posted");
      router.push(`/task/${task.id}`);
    } catch (err) {
      const msg = err.message || "Could not post gawain";
      setError(msg);
      toast.error(msg);
    }
  };

  const service = serviceByKey(form.categoryKey);
  const barangays = getBarangays(form.location_area);
  const needsDate = form.schedule_type === "on_date" || form.schedule_type === "before_date";
  const fee = formatPHP(postingFee(Number(form.budget_php) || 0));

  if (!canOpenPost(user)) {
    return (
      <AppShell>
        <Container className="py-5 lg:py-8">
          <SectionIntro
            pill="POST"
            title="Poster mode lang"
            sub="I-switch sa Poster sa taas para mag-post ng gawain. Tasker mode is for maghanap at bidding."
          />
        </Container>
      </AppShell>
    );
  }

  if (!canPostTask(user)) {
    const pending = user?.verification_status === "pending";
    return (
      <AppShell>
        <Container className="py-5 lg:py-8">
          <SectionIntro
            pill="POST"
            title={pending ? "Hintayin ang approval" : "I-verify muna"}
            sub={
              pending
                ? "Naka-submit na ang verification mo. Admin will review it before you can post or accept gawain."
                : "One verification lang — after approval, puwede kang mag-post at mag-bid sa same account."
            }
          />
          <Link href="/verify" className="btn-olive mt-5 h-11 px-5 text-sm">
            {pending ? "Tingnan ang application" : "I-verify ang account"}
          </Link>
        </Container>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Container className="py-5 lg:py-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-3 inline-flex items-center gap-1 text-[12px] font-bold text-[#2A3F4D]/65 hover:text-[#163044] lg:hidden"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        <SectionIntro
          className="mb-5"
          pill="POST"
          title="Mag-post ng gawain"
          sub="I-describe ang kailangan mo. 2% posting fee lang — kayo ng tasker ang mag-aayos ng bayad."
        />
        <form onSubmit={submit} className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
          <div className="space-y-4 rounded-[1.5rem] bg-[#FFFCF7] p-4 shadow-card sm:p-5">
            {error ? <p className="rounded-2xl bg-destructive/10 px-3 py-2 text-[12px] font-semibold text-destructive">{error}</p> : null}

            <Field label="Gawain">
              <input
                className={fieldClass}
                placeholder="What needs to be done?"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                required
                minLength={4}
              />
            </Field>

            <Field label="Category">
              <PostSelect
                id="category"
                openId={openSelect}
                setOpenId={setOpenSelect}
                value={form.categoryKey}
                placeholder="Choose a category"
                options={SERVICE_CATEGORIES.map((c) => ({ value: c.key, label: c.title, desc: c.desc }))}
                onChange={(key) => {
                  set("categoryKey", key);
                  set("groupTitle", "");
                }}
              />
            </Field>

            <Field label={`What kind of ${service.title.toLowerCase()}?`}>
              <PostSelect
                id="kind"
                openId={openSelect}
                setOpenId={setOpenSelect}
                value={form.groupTitle}
                placeholder="Choose one"
                options={service.groups.map((group) => ({ value: group.title, label: group.title, desc: group.desc }))}
                onChange={(title) => set("groupTitle", title)}
              />
            </Field>

            <Field label="Kailan">
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(SCHEDULE_LABELS).map(([k, v]) => (
                  <Chip key={k} on={form.schedule_type === k} onClick={() => set("schedule_type", k)}>
                    {v}
                  </Chip>
                ))}
              </div>
              {needsDate ? (
                <div className="relative mt-2">
                  <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#163044]/45" />
                  <input
                    type="date"
                    className={`${fieldClass} pl-9`}
                    value={form.schedule_date}
                    onChange={(e) => set("schedule_date", e.target.value)}
                  />
                </div>
              ) : null}
            </Field>

            <Field label="Saan">
              <div className="mb-2 flex flex-wrap gap-1.5">
                <Chip on={!form.is_remote} onClick={() => set("is_remote", false)}>
                  On-site
                </Chip>
                <Chip on={form.is_remote} onClick={() => set("is_remote", true)}>
                  Remote · any town
                </Chip>
              </div>
              {!form.is_remote ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#163044]/45" />
                    <select
                      className={`${fieldClass} appearance-none pl-9`}
                      value={form.location_area}
                      onChange={(e) => {
                        set("location_area", e.target.value);
                        set("barangay", "");
                      }}
                    >
                      {LOCATIONS.map((l) => (
                        <option key={l}>{l}</option>
                      ))}
                    </select>
                  </div>
                  <select
                    className={`${fieldClass} appearance-none`}
                    value={form.barangay}
                    onChange={(e) => set("barangay", e.target.value)}
                  >
                    <option value="">Barangay (optional)</option>
                    {barangays.map((b) => (
                      <option key={b}>{b}</option>
                    ))}
                  </select>
                  <input
                    className={`${fieldClass} sm:col-span-2`}
                    placeholder="Sitio, street, or landmark"
                    value={form.location_detail}
                    onChange={(e) => set("location_detail", e.target.value)}
                  />
                </div>
              ) : null}
            </Field>

            <Field label="Detalye">
              <textarea
                className="min-h-24 w-full rounded-[1.15rem] bg-[#F3EFE3] p-3 text-sm font-medium text-[#163044] outline-none placeholder:text-[#2A3F4D]/40"
                placeholder="Dagdag detalye, notes, or instructions"
                value={form.details}
                onChange={(e) => set("details", e.target.value)}
              />
            </Field>
          </div>

          <aside className="rounded-[1.5rem] bg-[#163044] p-4 text-[#F7F4EC] shadow-soft lg:sticky lg:top-24">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#F7F4EC]/55">Budget guide</p>
            <label className="mt-2 flex items-center gap-2 rounded-full bg-[#102636] px-4">
              <Wallet className="h-4 w-4 shrink-0 text-[#C9D6E0]" />
              <span className="text-sm font-black text-[#C9D6E0]">₱</span>
              <input
                className="h-11 w-full bg-transparent text-lg font-black text-[#F7F4EC] outline-none"
                type="number"
                min={50}
                value={form.budget_php}
                onChange={(e) => set("budget_php", e.target.value)}
                required
              />
            </label>
            <div className="mt-3 flex items-center justify-between rounded-2xl bg-[#F7F4EC]/10 px-3 py-2">
              <span className="text-[11px] font-semibold text-[#F7F4EC]/70">Posting fee 2%</span>
              <span className="rounded-full bg-[#C8F0D8] px-2.5 py-0.5 text-[11px] font-black text-[#163044]">{fee}</span>
            </div>
            <p className="mt-2 text-[11px] leading-snug text-[#F7F4EC]/55">
              Guide lang — kayo ng tasker ang mag-aayos ng bayad sa work.
            </p>
            <button type="submit" className="mt-4 h-11 w-full rounded-full bg-[#E8DCC4] text-sm font-black text-[#163044]">
              I-post ang gawain
            </button>
          </aside>
        </form>
      </Container>
    </AppShell>
  );
}
