"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Basket, Beach, Calendar, Car, ChevronLeft, Clean, Clock, Compass, Flash, Laptop,
  Luggage, Motorbike, Package, Refresh, Scooter, Scissor, Search, Sparkles, Tools, Users, Van, Wallet, Wrench,
} from "@/components/icons";
import AppShell from "@/components/AppShell";
import Container from "@/components/Container";
import SectionIntro from "@/components/SectionIntro";
import { useAuth } from "@/lib/AuthContext";
import { LOCATIONS, SCHEDULE_LABELS, SERVICE_CATEGORIES, cn, formatPHP, postingFee, serviceByKey } from "@/lib/khaki";
import { BUDGET_DISCLAIMER, cleanExtras, cleanPins, missingRequiredField, pinSlotsFor, templateForKey } from "@/lib/serviceTemplates";
import { getBarangays, municipalityCoords } from "@/lib/palawanLocations";
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

const LocationPinMap = dynamic(() => import("@/components/LocationPinMap"), {
  ssr: false,
  loading: () => <div className="h-64 w-full animate-pulse rounded-2xl bg-[#F3EFE3] sm:h-72" />,
});

const GLYPHS = {
  Car, Motorbike, Van, Package, Scooter, Basket, Flash, Calendar, Refresh, Users, Luggage,
  Wrench, Beach, Clean, Laptop, Scissor, Compass, Sparkles, Tools,
};

function Glyph({ name, color = "#163044", className = "h-4 w-4" }) {
  const Icon = GLYPHS[name];
  if (!Icon) return null;
  return <Icon className={className} color={color} />;
}

function Chip({ on, icon, color, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-bold leading-none",
        on ? "border-[#163044] bg-[#163044] text-[#F7F4EC]" : "border-[#E6DDD0] bg-white text-[#163044]"
      )}
    >
      {icon ? <Glyph name={icon} color={on ? "#F7F4EC" : color} className="h-3.5 w-3.5" /> : null}
      {children}
    </button>
  );
}

function ChoiceCard({ on, icon, color, label, lines, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 rounded-2xl border px-3.5 py-3 text-left",
        on ? "border-[#163044] bg-white shadow-sm" : "border-[#EFE7DA] bg-[#FBF8F1]"
      )}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${color}1A` }}>
        <Glyph name={icon} color={color} className="h-5 w-5" />
      </span>
      <span className="min-w-0 pt-0.5">
        <span className="block text-[15px] font-black text-[#163044]">{label}</span>
        {(lines?.length ? lines : []).map((line) => (
          <span key={line.text} className="mt-0.5 flex items-start gap-1.5 text-[12px] font-medium leading-snug text-[#2A3F4D]/70">
            {line.icon ? <Glyph name={line.icon} color={line.color} className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : null}
            <span>{line.text}</span>
          </span>
        ))}
      </span>
    </button>
  );
}

const EXAMPLE_ICONS = {
  Rent: { icon: "Car", color: "#2F6F9A" },
  "Pick up": { icon: "Package", color: "#E07A3D" },
  "Pa-deliver": { icon: "Scooter", color: "#1F9D6A" },
  Pakuha: { icon: "Basket", color: "#B45309" },
};

const CATEGORY_ICONS = {
  transport: { icon: "Car", color: "#2F6F9A", bg: "#E7F1FA" },
  tourism: { icon: "Beach", color: "#1F9D6A", bg: "#E4F6EB" },
  repair: { icon: "Wrench", color: "#C46A2E", bg: "#FFF1E4" },
  cleaning: { icon: "Clean", color: "#3A73C4", bg: "#E7F1FA" },
  digital: { icon: "Laptop", color: "#5B4B8A", bg: "#EEE8FF" },
  salon: { icon: "Scissor", color: "#C43A6A", bg: "#FFE8EE" },
  pets: { icon: "Compass", color: "#8A6A3B", bg: "#F6EFE2" },
  other: { icon: "Sparkles", color: "#3D5C6E", bg: "#E6EEF2" },
};

const fieldClass =
  "h-11 w-full rounded-xl bg-[#F3EFE3] px-4 text-sm font-semibold text-[#163044] outline-none placeholder:font-medium placeholder:text-[#2A3F4D]/40";

function PostSelect({ id, openId, setOpenId, value, options, onChange, placeholder = "Select", variant = "field", leading = null }) {
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
    <div className={cn("relative", shown && "z-40")} ref={wrapRef}>
      <button
        type="button"
        className={variant === "header" ? "flex w-full items-center gap-3 py-1 text-left" : `${fieldClass} flex items-center justify-between gap-2 text-left`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpenId(open ? null : id)}
      >
        {variant === "header" ? leading : null}
        <span className={cn("min-w-0 truncate", variant === "header" ? "flex-1 text-lg font-black text-[#163044]" : "", !selected && variant !== "header" && "font-medium text-[#2A3F4D]/40")}>
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
                className="h-9 w-full rounded-lg bg-[#F3EFE3] pl-8 pr-3 text-xs font-semibold text-[#163044] outline-none placeholder:font-medium placeholder:text-[#2A3F4D]/40"
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
                    key={option.value || "__empty"}
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
    extras: {},
    pins: {},
  });
  const [error, setError] = useState("");
  const [openSelect, setOpenSelect] = useState(null);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setExtra = (k, v) => setForm((f) => ({ ...f, extras: { ...f.extras, [k]: v } }));

  const service = serviceByKey(form.categoryKey);
  const template = templateForKey(form.categoryKey);
  const pinSlots = useMemo(() => pinSlotsFor(form.categoryKey), [form.categoryKey]);
  const barangays = getBarangays(form.location_area);
  const scheduleOptions = template?.scheduleOptions
    || Object.entries(SCHEDULE_LABELS).map(([k, v]) => ({ value: k, label: v }));
  const needsDate = form.schedule_type === "on_date" || form.schedule_type === "before_date";
  const fee = formatPHP(postingFee(Number(form.budget_php) || 0));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const missing = missingRequiredField(template, form.extras);
    if (missing) {
      const msg = `Pumili muna ng ${missing.label.toLowerCase()}.`;
      setError(msg);
      toast.error(msg);
      return;
    }
    if (Number(form.budget_php) < 50) {
      const msg = "Minimum budget is ₱50";
      setError(msg);
      toast.error(msg);
      return;
    }
    try {
      const { categoryKey, groupTitle, details, extras, pins, ...rest } = form;
      const savedPins = rest.is_remote || categoryKey === "digital" ? {} : cleanPins(categoryKey, pins);
      const task = await api.tasks.create({
        ...rest,
        category: service.enumValue,
        details: groupTitle && details ? `${groupTitle}\n\n${details}` : groupTitle || details,
        extras: {
          ...cleanExtras(template, extras),
          ...(Object.keys(savedPins).length ? { pins: savedPins } : {}),
        },
      });
      toast.success("Gawain posted");
      router.push(`/task/${task.id}`);
    } catch (err) {
      const msg = err.message || "Could not post gawain";
      setError(msg);
      toast.error(msg);
    }
  };

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

            <PostSelect
              id="category"
              variant="header"
              leading={(
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: (CATEGORY_ICONS[form.categoryKey] || CATEGORY_ICONS.other).bg }}>
                  <Glyph name={(CATEGORY_ICONS[form.categoryKey] || CATEGORY_ICONS.other).icon} color={(CATEGORY_ICONS[form.categoryKey] || CATEGORY_ICONS.other).color} className="h-5 w-5" />
                </span>
              )}
              openId={openSelect}
              setOpenId={setOpenSelect}
              value={form.categoryKey}
              placeholder="Choose a category"
              options={SERVICE_CATEGORIES.map((c) => ({ value: c.key, label: c.title, desc: c.desc }))}
              onChange={(key) => {
                const next = templateForKey(key);
                setForm((f) => ({
                  ...f,
                  categoryKey: key,
                  groupTitle: "",
                  extras: {},
                  pins: {},
                  schedule_type: next?.scheduleOptions ? next.scheduleOptions[0].value : f.schedule_type,
                }));
              }}
            />

            <div>
              <p className="text-base font-black leading-snug text-[#163044]">
                {template?.prompt || "Ano ang kailangan mo?"}
                {template?.promptHint ? <span className="font-semibold text-[#163044]/40"> ({template.promptHint})</span> : null}
              </p>
              {template?.examples?.length ? (
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <span className="text-[12px] font-semibold text-[#2A3F4D]/45">Examples:</span>
                  {template.examples.map((example) => (
                    <Chip key={example} icon={EXAMPLE_ICONS[example]?.icon} color={EXAMPLE_ICONS[example]?.color} on={form.title === example} onClick={() => set("title", example)}>
                      {example}
                    </Chip>
                  ))}
                </div>
              ) : null}
              <input
                className={`${fieldClass} mt-3`}
                placeholder="O i-type ang gawain"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                required
                minLength={4}
              />
            </div>

            {(template?.fields || []).map((field) => (
              <div key={field.key}>
                <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#163044]/45">{field.label}</p>
                <div className="space-y-2">
                  {field.options.map((option) => (
                    <ChoiceCard
                      key={option.value}
                      on={form.extras[field.key] === option.value}
                      icon={option.icon}
                      color={option.color || "#2F6F9A"}
                      label={option.label}
                      lines={option.lines}
                      onClick={() => setExtra(field.key, option.value)}
                    />
                  ))}
                </div>
              </div>
            ))}

            {!template ? (
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
            ) : null}

            <Field label={template?.scheduleOptions ? "Kailan (Schedule)" : "Kailan"}>
              {template?.scheduleOptions ? (
                <div className="flex flex-wrap gap-2">
                  {scheduleOptions.map((option) => (
                    <Chip key={option.value} icon={option.icon} color={option.color} on={form.schedule_type === option.value} onClick={() => set("schedule_type", option.value)}>
                      {option.label}
                    </Chip>
                  ))}
                </div>
              ) : (
              <PostSelect
                id="schedule"
                openId={openSelect}
                setOpenId={setOpenSelect}
                value={form.schedule_type}
                placeholder="Choose a schedule"
                options={scheduleOptions}
                onChange={(type) => set("schedule_type", type)}
              />
              )}
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
                  <PostSelect
                    id="town"
                    openId={openSelect}
                    setOpenId={setOpenSelect}
                    value={form.location_area}
                    placeholder="Town"
                    options={LOCATIONS.map((l) => ({ value: l, label: l }))}
                    onChange={(area) => {
                      set("location_area", area);
                      set("barangay", "");
                    }}
                  />
                  <PostSelect
                    id="barangay"
                    openId={openSelect}
                    setOpenId={setOpenSelect}
                    value={form.barangay}
                    placeholder="Barangay (optional)"
                    options={[
                      { value: "", label: "Any barangay" },
                      ...barangays.map((b) => ({ value: b, label: b })),
                    ]}
                    onChange={(b) => set("barangay", b)}
                  />
                  <input
                    className={`${fieldClass} sm:col-span-2`}
                    placeholder="Sitio, street, or landmark"
                    value={form.location_detail}
                    onChange={(e) => set("location_detail", e.target.value)}
                  />
                  {form.categoryKey !== "digital" ? (
                    <div className="sm:col-span-2">
                      <p className="mb-1.5 mt-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#163044]/45">
                        {pinSlots.length > 1 ? "I-pin sa mapa (pick-up at drop-off)" : "I-pin sa mapa"}
                      </p>
                      <LocationPinMap
                        center={municipalityCoords(form.location_area) || [9.7392, 118.7353]}
                        slots={pinSlots}
                        pins={form.pins}
                        onChange={(pins) => set("pins", pins)}
                      />
                    </div>
                  ) : null}
                </div>
              ) : null}
            </Field>

            <Field label="Detalye">
              <textarea
                className="min-h-24 w-full rounded-xl bg-[#F3EFE3] p-3 text-sm font-medium text-[#163044] outline-none placeholder:text-[#2A3F4D]/40"
                placeholder="Dagdag detalye, notes, or instructions"
                value={form.details}
                onChange={(e) => set("details", e.target.value)}
              />
            </Field>
          </div>

          <aside className="rounded-[1.5rem] bg-[#163044] p-4 text-[#F7F4EC] shadow-soft lg:sticky lg:top-24">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#F7F4EC]/55">Budget guide</p>
              <span className="rounded-full bg-[#F7F4EC]/10 px-2 py-0.5 text-[10px] font-bold text-[#F7F4EC]/70">Min ₱50</span>
            </div>
            <label className="mt-2 flex items-center gap-2 rounded-xl bg-[#102636] px-4">
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
            <p className="mt-2 rounded-2xl bg-[#F0A8A8]/15 px-3 py-2 text-[11px] font-semibold leading-snug text-[#F3C3C3]">
              {BUDGET_DISCLAIMER}
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
