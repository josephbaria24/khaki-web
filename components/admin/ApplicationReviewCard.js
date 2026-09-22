"use client";

import { formatPHP } from "@/lib/khaki";
import { readSubmittedApplication } from "@/lib/taskerApplication";
import { SignaturePreview } from "@/components/verify/SignaturePad";

function Row({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <p className="text-sm">
      <span className="font-semibold text-muted-foreground">{label}: </span>
      <span className="text-foreground">{value}</span>
    </p>
  );
}

export default function ApplicationReviewCard({ user, onApprove, onReject }) {
  const app = readSubmittedApplication(user);
  const skills = (app.skills || []).join(", ") || "—";
  const days = (app.available_days || []).join(", ") || "—";

  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-black">{app.full_name || user.full_name}</p>
          <p className="text-sm text-muted-foreground">{app.email || user.email}</p>
          {app.submitted_at ? (
            <p className="mt-1 text-[11px] text-muted-foreground">Submitted {new Date(app.submitted_at).toLocaleString()}</p>
          ) : null}
        </div>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-800">
          Pending review
        </span>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Personal</p>
          <Row label="Phone" value={app.phone} />
          <Row label="Age" value={app.age} />
          <Row label="Town" value={app.location_area} />
          <Row label="Barangay" value={app.barangay} />
          <Row label="Address" value={app.location_detail} />
        </div>
        <div className="space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Work</p>
          <Row label="Skills" value={skills} />
          <Row label="Experience" value={app.experience_years ? `${app.experience_years} yrs` : ""} />
          <Row label="Daily rate" value={app.daily_rate ? formatPHP(app.daily_rate) : ""} />
          <Row label="Available" value={days} />
        </div>
        <div className="space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">ID & pay</p>
          <Row label="ID type" value={app.id_type} />
          <Row label="ID file" value={app.id_document?.name || "None"} />
          <Row label="GCash" value={app.gcash_number} />
        </div>
        <div className="space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Emergency & signature</p>
          <Row label="Contact" value={app.emergency_contact_name} />
          <Row label="Number" value={app.emergency_contact_number} />
          <div className="pt-1">
            <p className="text-sm">
              <span className="font-semibold text-muted-foreground">Signature: </span>
            </p>
            <SignaturePreview value={app.signature} className="mt-1 max-w-[220px] rounded-lg bg-[#FFFCF7] px-2" />
          </div>
          <Row label="Signed" value={app.signed_at} />
          <Row label="Declaration" value={app.declared ? "Agreed" : "Not marked"} />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          className="h-10 rounded-xl bg-accent px-4 text-sm font-bold text-white"
          onClick={onApprove}
        >
          Approve
        </button>
        <button
          type="button"
          className="h-10 rounded-xl border px-4 text-sm font-bold"
          onClick={onReject}
        >
          Reject
        </button>
      </div>
    </div>
  );
}
