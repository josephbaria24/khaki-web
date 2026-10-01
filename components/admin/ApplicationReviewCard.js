"use client";

import { useState } from "react";
import { formatPHP } from "@/lib/khaki";
import { DECLARATION_TEXT, readSubmittedApplication } from "@/lib/taskerApplication";
import { ROLE_LABELS } from "@/lib/roles";
import { SignaturePreview } from "@/components/verify/SignaturePad";
import { Collapse } from "@/components/ui/motion";
import { Briefcase, Calendar, Mail, MapPin, ShieldCheck, User, Wallet } from "@/components/icons";

function shown(value) {
  if (value === 0) return "0";
  if (value === false) return "No";
  if (value === true) return "Yes";
  if (value === undefined || value === null || value === "") return "—";
  return String(value);
}

function Row({ label, value }) {
  return (
    <p className="text-xs leading-relaxed">
      <span className="font-semibold" style={{ color: "#5C6570" }}>{label}: </span>
      <span style={{ color: "#163044" }}>{shown(value)}</span>
    </p>
  );
}

function Section({ icon: Icon, title, tint, ink, children, className = "" }) {
  return (
    <section className={`rounded-xl p-3 ${className}`} style={{ background: tint }}>
      <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.12em]" style={{ color: ink }}>
        <Icon className="h-3.5 w-3.5" />
        {title}
      </p>
      <div className="mt-1.5 space-y-0.5">{children}</div>
    </section>
  );
}

function fileSize(size) {
  const bytes = Number(size || 0);
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function documentSrc(doc) {
  if (!doc) return "";
  if (typeof doc === "string") return doc.startsWith("data:") || doc.startsWith("http") ? doc : "";
  if (doc.data?.startsWith?.("data:") || doc.data?.startsWith?.("http")) return doc.data;
  if (typeof doc.base64 === "string" && doc.base64) {
    return doc.base64.startsWith("data:") ? doc.base64 : `data:${doc.type || doc.mime_type || "image/jpeg"};base64,${doc.base64}`;
  }
  if (doc.url?.startsWith?.("http") || doc.url?.startsWith?.("data:")) return doc.url;
  if (doc.file_path?.startsWith?.("http") || doc.file_path?.startsWith?.("data:")) return doc.file_path;
  return "";
}

function isImageSrc(src, type) {
  if (!src) return false;
  if (src.startsWith("data:image") || src.startsWith("blob:")) return true;
  if (type?.startsWith("image/") && (src.startsWith("data:") || src.startsWith("http") || src.startsWith("blob:"))) return true;
  return /\.(png|jpe?g|webp|gif)(\?|$)/i.test(src);
}

function DocumentView({ doc }) {
  const src = documentSrc(doc);
  const name = doc?.name || doc?.file_name || "Valid ID";
  const type = doc?.type || doc?.mime_type || "";
  const meta = [name, fileSize(doc?.size || doc?.file_size)].filter(Boolean).join(" · ");
  const image = isImageSrc(src, type);

  return (
    <div className="mt-2">
      {image ? (
        <a href={src} target="_blank" rel="noreferrer" className="block">
          <img src={src} alt="Submitted valid ID" className="max-h-64 w-full rounded-xl bg-[#FFFCF7] object-contain" />
        </a>
      ) : src ? (
        <a href={src} target="_blank" rel="noreferrer" className="inline-flex text-sm font-bold text-primary underline-offset-4 hover:underline">
          Open {name}
        </a>
      ) : (
        <p className="text-xs" style={{ color: "#5C6570" }}>The ID photo was not saved with this application. Ask them to attach it again from the verification form.</p>
      )}
      {meta ? <p className="mt-2 text-xs" style={{ color: "#5C6570" }}>{meta}</p> : null}
    </div>
  );
}

const TONES = {
  pending: { bar: "#C4841D", bg: "#FEF3C7", ink: "#92400E", soft: "#FFF8E8" },
  reverify: { bar: "#C4841D", bg: "#FEF3C7", ink: "#92400E", soft: "#FFF8E8" },
  verified: { bar: "#1A7A58", bg: "#D7F0EA", ink: "#0D666A", soft: "#F3FBF8" },
  rejected: { bar: "#B42318", bg: "#FEE2E2", ink: "#991B1B", soft: "#FFF6F6" },
  unverified: { bar: "#8A94A6", bg: "#EEF2F6", ink: "#3D4A5C", soft: "#F7F8FA" },
};

export default function ApplicationReviewCard({ user, onApprove, onReject }) {
  const [open, setOpen] = useState(false);
  const app = readSubmittedApplication(user);
  const skills = (app.skills || []).filter((skill) => skill && skill !== app.other_skill);
  const statusKey = app.review_state === "reverify" && app.verification_status === "verified"
    ? "reverify"
    : app.verification_status === "pending"
      ? "pending"
      : app.verification_status === "verified"
        ? "verified"
        : app.verification_note
          ? "rejected"
          : "unverified";
  const statusLabel = statusKey === "reverify" ? "Re-verifying" : statusKey === "pending" ? "Pending" : statusKey === "verified" ? "Verified" : statusKey === "rejected" ? "Rejected" : "Unverified";
  const tone = TONES[statusKey] || TONES.unverified;
  const name = shown(app.full_name || user.full_name);
  const email = shown(app.email || user.email);
  const role = ROLE_LABELS[app.role] || app.role || "User";
  const extraDocs = [
    ...(app.documents || []).filter((doc) => doc.file_name !== app.id_document?.name),
    ...(app.credentials || []),
  ];

  return (
    <article className="overflow-hidden rounded-2xl border bg-card" style={{ borderLeftWidth: 4, borderLeftColor: tone.bar }}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: tone.bg, color: tone.ink }}>
          <ShieldCheck className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate text-sm font-black text-foreground">{name}</span>
            <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide" style={{ background: tone.bg, color: tone.ink }}>
              {statusLabel}
            </span>
          </span>
          <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
            <Mail className="h-3 w-3 shrink-0" />
            <span className="truncate">{email}</span>
            <span className="shrink-0">·</span>
            <User className="h-3 w-3 shrink-0" />
            <span className="shrink-0">{role}</span>
            {app.location_area ? (
              <>
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{app.location_area}</span>
              </>
            ) : null}
          </span>
        </span>
        <span className={`shrink-0 text-sm text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} aria-hidden>▾</span>
      </button>
      <Collapse open={open}>
        <div className="grid gap-2 border-t px-3 py-3 lg:grid-cols-2" style={{ background: tone.soft }}>
          <Section icon={User} title="Account" tint="#FFFFFF" ink={tone.ink}>
            <Row label="Role" value={role} />
            <Row label="Poster type" value={app.poster_type} />
            <Row label="Company" value={app.company_name} />
            <Row label="Headline" value={app.headline} />
            <Row label="Bio" value={app.bio} />
            <Row label="Review note" value={app.verification_note} />
            <Row label="Submitted" value={app.submitted_at ? new Date(app.submitted_at).toLocaleString() : ""} />
          </Section>
          <Section icon={MapPin} title="Personal" tint="#FFFFFF" ink={tone.ink}>
            <Row label="Phone" value={app.phone} />
            <Row label="Age" value={app.age} />
            <Row label="Town" value={app.location_area} />
            <Row label="Barangay" value={app.barangay} />
            <Row label="Address" value={app.location_detail} />
          </Section>
          <Section icon={ShieldCheck} title="Valid ID" tint="#FFFFFF" ink={tone.ink}>
            <Row label="ID type" value={app.id_type} />
            {app.id_document ? <DocumentView doc={app.id_document} /> : <Row label="ID file" value="" />}
          </Section>
          <Section icon={Briefcase} title="Work" tint="#FFFFFF" ink={tone.ink}>
            <Row label="Skills" value={skills.length ? skills.join(", ") : ""} />
            <Row label="Other skill" value={app.other_skill} />
            <Row label="Experience" value={app.experience_years} />
            <Row label="Daily rate" value={app.daily_rate ? formatPHP(app.daily_rate) : ""} />
            <Row label="Available" value={(app.available_days || []).join(", ")} />
          </Section>
          <Section icon={Wallet} title="Pay and emergency" tint="#FFFFFF" ink={tone.ink}>
            <Row label="GCash" value={app.gcash_number} />
            <Row label="Emergency contact" value={app.emergency_contact_name} />
            <Row label="Emergency number" value={app.emergency_contact_number} />
          </Section>
          <Section icon={Calendar} title="Declaration" tint="#FFFFFF" ink={tone.ink}>
            <p className="text-xs leading-relaxed" style={{ color: "#163044" }}>{DECLARATION_TEXT}</p>
            <Row label="Agreed" value={app.declared ? "Yes" : "No"} />
            <Row label="Signed" value={app.signed_at} />
            {app.signature ? (
              <SignaturePreview value={app.signature} className="mt-1 max-w-sm rounded-lg bg-[#FFFCF7] px-2" />
            ) : (
              <Row label="Signature" value="" />
            )}
          </Section>
          {extraDocs.length ? (
            <Section icon={Mail} title="Other files" tint="#FFFFFF" ink={tone.ink} className="lg:col-span-2">
              {extraDocs.map((doc) => (
                <DocumentView key={`${doc.id || doc.name || doc.file_name}-${doc.uploaded_at || ""}`} doc={doc} />
              ))}
            </Section>
          ) : null}
          {statusKey === "pending" || statusKey === "reverify" ? (
            <div className="flex flex-wrap gap-2 lg:col-span-2">
              <button type="button" className="h-9 rounded-xl px-4 text-sm font-bold text-white" style={{ background: tone.bar }} onClick={onApprove}>
                Approve
              </button>
              <button type="button" className="h-9 rounded-xl border bg-white px-4 text-sm font-bold" onClick={onReject}>
                Reject
              </button>
            </div>
          ) : null}
        </div>
      </Collapse>
    </article>
  );
}
