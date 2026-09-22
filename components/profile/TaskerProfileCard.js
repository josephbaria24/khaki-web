"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MapPin, ShieldCheck } from "@/components/icons";
import { CATEGORIES, LOCATIONS } from "@/lib/khaki";
import { LANDING } from "@/lib/landingContent";
import { Collapse, Stagger } from "@/components/ui/motion";
import { buildTaskerCard, PRICE_TYPES, pricingModelLabel, skillLabel } from "@/lib/taskerProfile";

const OLIVE = LANDING.olive;
const OLIVE_DEEP = LANDING.oliveDeep;
const CARD = "#FFFCF7";

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z" strokeLinejoin="round" />
      <path d="M13.5 6.5 17.5 10.5" strokeLinecap="round" />
    </svg>
  );
}

function CheckMini() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="m5 12 5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IdBadge() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="12" r="2" />
      <path d="M14 10h5M14 14h3" strokeLinecap="round" />
    </svg>
  );
}

function HeartIcon({ filled }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
      <path d="M12 20s-7-4.4-9.2-8.2C1.2 9 2.4 6 5.2 5.4 7 5 8.7 5.8 12 8.4c3.3-2.6 5-3.4 6.8-3 2.8.6 4 3.6 2.4 6.4C19 15.6 12 20 12 20Z" strokeLinejoin="round" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" strokeLinecap="round" />
      <path d="M12 4v12M8 8l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PersonFallback() {
  return (
    <svg viewBox="0 0 24 24" className="h-12 w-12 text-[#7B8A6A] lg:h-16 lg:w-16" fill="currentColor">
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 19.2c.6-3.4 3.2-5.2 6.5-5.2s5.9 1.8 6.5 5.2" />
    </svg>
  );
}

function SectionCard({ children, className = "" }) {
  return (
    <div className={`rounded-[1.45rem] p-4 shadow-[0_8px_28px_rgba(42,63,77,0.08)] md:p-5 lg:rounded-[1.7rem] lg:p-6 ${className}`} style={{ background: CARD }}>
      {children}
    </div>
  );
}

function SectionHead({ title, onEdit, editing }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-[15px] font-black text-foreground lg:text-lg">{title}</h2>
      {onEdit ? (
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1 text-[12px] font-bold transition-transform duration-200 hover:scale-105 active:scale-95 lg:text-sm"
          style={{ color: OLIVE }}
        >
          <span className={`inline-flex transition-transform duration-300 ${editing ? "rotate-90" : "rotate-0"}`}>
            <PencilIcon />
          </span>
          {editing ? "Close" : "Edit"}
        </button>
      ) : null}
    </div>
  );
}

function fieldClass() {
  return "h-11 w-full rounded-full bg-[#F3EFE3] px-4 text-sm text-foreground outline-none transition-colors duration-200 focus:bg-white";
}

export default function TaskerProfileCard({
  profile,
  reviews = [],
  tasks = [],
  isOwn = false,
  ctaHref = "/post",
  showCta = true,
  onCta,
  onSave,
}) {
  const card = useMemo(() => buildTaskerCard(profile, reviews, tasks), [profile, reviews, tasks]);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [bioOpen, setBioOpen] = useState(false);
  const [open, setOpen] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [headerForm, setHeaderForm] = useState({ full_name: "", location_area: "", phone: "" });
  const [aboutForm, setAboutForm] = useState({ bio: "", headline: "" });
  const [skillsForm, setSkillsForm] = useState({ skills: [], price_type: "Per Hour", price_amount: "", price_description: "" });

  useEffect(() => {
    setHeaderForm({
      full_name: profile?.full_name || "",
      location_area: profile?.location_area || LOCATIONS[0],
      phone: profile?.phone || "",
    });
    setAboutForm({
      bio: profile?.bio || "",
      headline: profile?.headline || "",
    });
    setSkillsForm({
      skills: Array.isArray(profile?.skills) && profile.skills.length ? profile.skills : [],
      price_type: profile?.price_type || "Per Hour",
      price_amount: profile?.price_amount ? String(profile.price_amount) : "",
      price_description: profile?.price_description || "",
    });
  }, [profile]);

  const stars = card.reviewCount ? Math.round(card.avg) : 0;
  const bio = card.bio || "";
  const bioLong = bio.length > 160;
  const canEdit = Boolean(isOwn && onSave);
  const title = isOwn && onSave ? "Edit Khaki Profile" : "Khaki Tasker Profile";

  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({ title: profile.full_name, url });
        return;
      }
    } catch {
      /* fall through */
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };

  const saveSection = async (patch) => {
    if (!onSave) return;
    setError("");
    setSaving(true);
    try {
      await onSave(patch);
      setOpen("");
    } catch (err) {
      setError(err.message || "Could not save.");
    } finally {
      setSaving(false);
    }
  };

  const toggleSkill = (skill) => {
    setSkillsForm((prev) => {
      const has = prev.skills.includes(skill);
      return { ...prev, skills: has ? prev.skills.filter((s) => s !== skill) : [...prev.skills, skill] };
    });
  };

  return (
    <Stagger className="mx-auto w-full max-w-[420px] space-y-3 md:max-w-[560px] lg:max-w-[640px] lg:space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-[1.35rem] px-4 py-3 text-white shadow-[0_8px_24px_rgba(42,63,77,0.18)] lg:px-5 lg:py-3.5" style={{ background: OLIVE_DEEP }}>
        <h1 className="text-[15px] font-black tracking-tight lg:text-lg">{title}</h1>
        <div className="flex items-center gap-1.5">
          {!isOwn ? (
            <button
              type="button"
              onClick={() => setSaved((v) => !v)}
              className={`flex h-8 w-8 items-center justify-center rounded-full bg-white/15 transition-all duration-200 hover:bg-white/25 hover:scale-105 active:scale-90 ${saved ? "text-[#FAD4DC] scale-110" : "text-white"}`}
              aria-label="Save tasker"
            >
              <span className={`inline-flex transition-transform duration-300 ${saved ? "scale-110" : "scale-100"}`}>
                <HeartIcon filled={saved} />
              </span>
            </button>
          ) : null}
          <button type="button" onClick={share} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white transition-all duration-200 hover:bg-white/25 hover:scale-105 active:scale-90" aria-label="Share profile">
            <ShareIcon />
          </button>
        </div>
      </div>

      <SectionCard>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3 lg:gap-4">
            <div
              className="flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E4D9B8] lg:h-[96px] lg:w-[96px]"
              style={{ boxShadow: `0 0 0 2px #fff, 0 0 0 3.5px ${OLIVE}55` }}
            >
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <PersonFallback />
              )}
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-[20px] font-black leading-tight text-foreground lg:text-[26px]">{card.displayName}</h2>
                <p className="shrink-0 text-[15px] font-black lg:text-lg" style={{ color: OLIVE_DEEP }}>
                  {card.rateLabel}
                </p>
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[13px] font-semibold">
                <span className="tracking-tight" style={{ color: "#E4B84A" }}>
                  {"★".repeat(stars || 0)}
                  <span className="text-[#D7D2C4]">{"★".repeat(Math.max(0, 5 - stars))}</span>
                </span>
                {card.reviewCount ? (
                  <span className="text-foreground">
                    <span className="font-black">{card.avg.toFixed(1)}</span>
                    <span className="font-medium text-muted-foreground"> ({card.reviewCount} reviews)</span>
                  </span>
                ) : (
                  <span className="font-medium text-muted-foreground">No reviews yet</span>
                )}
              </p>
              <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Verification Badges</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {card.verified ? (
                  <>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#DCEFE6] px-2.5 py-1 text-[11px] font-bold text-[#1F6B4A]">
                      <IdBadge />
                      ID Check
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#DCEFE6] px-2.5 py-1 text-[11px] font-bold text-[#1F6B4A]">
                      <CheckMini />
                      Check
                    </span>
                  </>
                ) : card.pendingVerify ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#F3E2B8] px-2.5 py-1 text-[11px] font-bold text-[#8A6A18]">Pending ID</span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#F3EFE3] px-2.5 py-1 text-[11px] font-bold text-muted-foreground">Unverified</span>
                )}
                {card.isAdmin ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#E8DCC4] px-2.5 py-1 text-[11px] font-bold text-[#2A3F4D]">
                    <ShieldCheck className="h-3.5 w-3.5" color="#2A3F4D" />
                    Admin
                  </span>
                ) : null}
              </div>
              <p className="mt-2 flex items-center gap-1 text-[12px] font-semibold text-muted-foreground lg:text-sm">
                <MapPin className="h-3.5 w-3.5 shrink-0" color={OLIVE} />
                Active in {card.town}
              </p>
            </div>
          </div>
          {canEdit ? (
            <button
              type="button"
              onClick={() => setOpen(open === "header" ? "" : "header")}
              className="inline-flex items-center gap-1 text-[12px] font-bold transition-transform duration-200 hover:scale-105 active:scale-95"
              style={{ color: OLIVE }}
            >
              <span className={`inline-flex transition-transform duration-300 ${open === "header" ? "rotate-90" : "rotate-0"}`}>
                <PencilIcon />
              </span>
              {open === "header" ? "Close" : "Edit"}
            </button>
          ) : null}
        </div>
        <Collapse open={canEdit && open === "header"}>
          <div className="mt-4 space-y-3 border-t border-[#E8E4D6] pt-4">
            <input className={fieldClass()} value={headerForm.full_name} onChange={(e) => setHeaderForm({ ...headerForm, full_name: e.target.value })} placeholder="Full name" />
            <input className={fieldClass()} value={headerForm.phone} onChange={(e) => setHeaderForm({ ...headerForm, phone: e.target.value })} placeholder="09xx" />
            <select className={fieldClass()} value={headerForm.location_area} onChange={(e) => setHeaderForm({ ...headerForm, location_area: e.target.value })}>
              {LOCATIONS.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
            <button type="button" disabled={saving} onClick={() => saveSection(headerForm)} className="btn-olive inline-flex h-10 items-center px-5 text-xs disabled:opacity-60">
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </Collapse>
      </SectionCard>

      {!isOwn ? (
        <SectionCard>
          <SectionHead title="Services & Stats" />
          <p className="text-[12px] font-bold text-muted-foreground">Work Photos</p>
          <WorkPhotoGrid photos={card.workPhotos} count={card.photoCount} />
        </SectionCard>
      ) : null}

      <SectionCard>
        <SectionHead title={isOwn ? "About" : "Meet Your Tasker"} editing={open === "about"} onEdit={canEdit ? () => setOpen(open === "about" ? "" : "about") : null} />
        <Collapse open={!(canEdit && open === "about")}>
          {bio ? (
            <>
              <p className={`profile-bio text-[13px] leading-relaxed text-muted-foreground lg:text-[15px] lg:leading-7 ${bioOpen || !bioLong ? "is-open" : ""}`}>
                {bio}
              </p>
              {bioLong ? (
                <button type="button" onClick={() => setBioOpen((v) => !v)} className="mt-2 text-[12px] font-bold transition-opacity duration-200 hover:opacity-70" style={{ color: OLIVE }}>
                  {bioOpen ? "Show less" : "Read more"}
                </button>
              ) : null}
            </>
          ) : (
            <p className="text-[13px] text-muted-foreground">{isOwn ? "Add a short intro so clients know you." : "No intro yet."}</p>
          )}
        </Collapse>
        <Collapse open={canEdit && open === "about"}>
          <div className="space-y-3">
            <input className={fieldClass()} value={aboutForm.headline} onChange={(e) => setAboutForm({ ...aboutForm, headline: e.target.value })} placeholder="Headline — e.g. Airport runs around PPC" />
            <textarea
              className="min-h-28 w-full rounded-[1.2rem] bg-[#F3EFE3] p-4 text-sm text-foreground outline-none transition-colors duration-200 focus:bg-white"
              value={aboutForm.bio}
              onChange={(e) => setAboutForm({ ...aboutForm, bio: e.target.value })}
              placeholder="Introduce yourself to clients"
            />
            <button type="button" disabled={saving} onClick={() => saveSection(aboutForm)} className="btn-olive inline-flex h-10 items-center px-5 text-xs disabled:opacity-60">
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </Collapse>
      </SectionCard>

      <SectionCard>
        <SectionHead title={isOwn ? "Skills & Pricing" : "Pricing & Options"} editing={open === "skills"} onEdit={canEdit ? () => setOpen(open === "skills" ? "" : "skills") : null} />
        <Collapse open={!(canEdit && open === "skills")}>
          <div className="space-y-3 text-[13px] lg:text-sm">
            <div className="flex items-start justify-between gap-3">
              <span className="font-semibold text-muted-foreground">Pricing Model</span>
              <span className="font-black text-foreground">{pricingModelLabel(card.priceType)}</span>
            </div>
            {card.skills.length ? (
              <div>
                <p className="font-semibold text-muted-foreground">{isOwn ? "Categories" : "Task categories"}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {card.skills.map((skill) => (
                    <span key={skill} className="rounded-full bg-[#F3EFE3] px-3 py-1 text-[12px] font-bold text-foreground">
                      {skill}
                      {card.rateLabel !== "Quote per job" ? <span className="ml-1" style={{ color: OLIVE }}>· {card.rateLabel}</span> : null}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">{isOwn ? "Pick the gawain you take." : "Rates quoted per job"}</p>
            )}
            {card.priceDescription ? <p className="leading-relaxed text-muted-foreground">{card.priceDescription}</p> : null}
            <div>
              <p className="font-semibold text-muted-foreground">Availability</p>
              <p className="mt-0.5 text-foreground">
                {profile?.headline || `Flexible around ${card.town}. Clients post a gawain and you bid when free.`}
              </p>
            </div>
          </div>
        </Collapse>
        <Collapse open={canEdit && open === "skills"}>
          <div className="space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Set your own categories</p>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => {
                const on = skillsForm.skills.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleSkill(cat)}
                    className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition-all duration-200 hover:scale-105 active:scale-95 ${on ? "text-white" : "bg-[#F3EFE3] text-foreground"}`}
                    style={on ? { background: OLIVE } : undefined}
                  >
                    {skillLabel(cat)}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Description of task</p>
            <textarea
              className="min-h-20 w-full rounded-[1.2rem] bg-[#F3EFE3] p-3 text-sm outline-none transition-colors duration-200 focus:bg-white"
              value={skillsForm.price_description}
              onChange={(e) => setSkillsForm({ ...skillsForm, price_description: e.target.value })}
              placeholder="What you cover, tools, and typical jobs"
            />
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Rates</p>
            <div className="flex flex-wrap gap-1.5">
              {PRICE_TYPES.map((type) => {
                const on = skillsForm.price_type === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSkillsForm({ ...skillsForm, price_type: type })}
                    className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition-all duration-200 hover:scale-105 active:scale-95 ${on ? "text-white" : "bg-[#F3EFE3] text-foreground"}`}
                    style={on ? { background: OLIVE } : undefined}
                  >
                    {pricingModelLabel(type)}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="50"
                max="5000"
                step="50"
                value={Number(skillsForm.price_amount) || 50}
                onChange={(e) => setSkillsForm({ ...skillsForm, price_amount: e.target.value })}
                className="flex-1 accent-[#3D5C6E]"
              />
              <input
                className={`${fieldClass()} w-28 shrink-0 text-center`}
                inputMode="numeric"
                value={skillsForm.price_amount}
                onChange={(e) => setSkillsForm({ ...skillsForm, price_amount: e.target.value.replace(/[^\d.]/g, "") })}
                placeholder="₱"
              />
            </div>
            <p className="text-[12px] font-bold transition-all duration-200" style={{ color: OLIVE_DEEP }}>
              ₱50 — ₱{Number(skillsForm.price_amount || 50).toLocaleString("en-PH")}
            </p>
            <button
              type="button"
              disabled={saving}
              onClick={() =>
                saveSection({
                  skills: skillsForm.skills,
                  price_type: skillsForm.price_type,
                  price_amount: skillsForm.price_amount ? Number(skillsForm.price_amount) : null,
                  price_description: skillsForm.price_description,
                })
              }
              className="btn-olive inline-flex h-10 items-center px-5 text-xs disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </Collapse>
      </SectionCard>

      {isOwn ? (
        <SectionCard>
          <SectionHead title="Work Photos Manager" />
          <p className="mb-3 text-[12px] text-muted-foreground">Photos from completed gawain show here automatically.</p>
          <WorkPhotoGrid photos={card.workPhotos} count={card.photoCount} />
        </SectionCard>
      ) : null}

      {error ? <p className="text-center text-sm font-semibold text-red-600">{error}</p> : null}

      {showCta && !isOwn && !(card.isAdmin && !isOwn) ? (
        <div className="pt-1">
          {onCta ? (
            <button type="button" onClick={onCta} className="flex h-12 w-full items-center justify-center rounded-full text-[16px] font-black text-white transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] lg:h-14 lg:text-lg" style={{ background: OLIVE }}>
              Request This Tasker
            </button>
          ) : (
            <Link href={ctaHref} className="flex h-12 w-full items-center justify-center rounded-full text-[16px] font-black text-white transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] lg:h-14 lg:text-lg" style={{ background: OLIVE }}>
              Request This Tasker
            </Link>
          )}
          <button type="button" onClick={() => setSaved((v) => !v)} className="mt-2 flex w-full items-center justify-center gap-1.5 text-[12px] font-bold text-muted-foreground transition-transform duration-200 hover:scale-105 active:scale-95">
            <span className={`inline-flex transition-transform duration-300 ${saved ? "scale-110" : "scale-100"}`}>
              <HeartIcon filled={saved} />
            </span>
            {saved ? "Saved to shortlist" : "or add to shortlist"}
          </button>
        </div>
      ) : null}

      {isOwn && card.isAdmin ? (
        <Link href="/admin" className="flex h-12 w-full items-center justify-center rounded-full text-[16px] font-black text-white transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] lg:h-14" style={{ background: OLIVE }}>
          Open admin
        </Link>
      ) : null}

      {copied ? <p className="animate-fade-in text-center text-[11px] text-muted-foreground">Link copied</p> : null}
      <p className="pb-1 text-center text-[11px] text-muted-foreground lg:text-sm">khakiworks.com · {card.isAdmin ? "Admin Profile" : "Tasker Profile"}</p>
    </Stagger>
  );
}

function WorkPhotoGrid({ photos, count }) {
  const tiles = photos.length ? photos.slice(0, 4) : [];
  return (
    <div className="relative mt-2 overflow-hidden rounded-[1.15rem] bg-[#EDE6D4]">
      {tiles.length ? (
        <div className={`grid gap-1 ${tiles.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
          {tiles.map((src) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={src} src={src} alt="" className="h-28 w-full object-cover lg:h-36" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-1">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex h-24 items-center justify-center bg-[#E8DCC4]/70 lg:h-32">
              <svg viewBox="0 0 24 24" className="h-7 w-7 text-[#7B8A6A]" fill="none" stroke="currentColor" strokeWidth="1.6">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <circle cx="9" cy="11" r="2" />
                <path d="m21 16-4.5-4.5L8 20" />
              </svg>
            </div>
          ))}
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#2A3F4D]/70 via-transparent to-transparent" />
      <p className="absolute bottom-3 left-3 text-[22px] font-black leading-none text-white lg:text-[28px]">
        {count || 0}
        <span className="ml-2 text-[13px] font-bold lg:text-sm">work photos</span>
      </p>
    </div>
  );
}
