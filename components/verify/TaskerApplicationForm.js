"use client";

import { useMemo, useState } from "react";
import { fileMeta } from "@/lib/roles";
import { getBarangays, MUNICIPALITY_NAMES } from "@/lib/palawanLocations";
import SignaturePad from "@/components/verify/SignaturePad";
import {
  APPLICATION_ID_TYPES,
  APPLICATION_SKILLS,
  DECLARATION_TEXT,
  EXPERIENCE_YEARS,
  WEEKDAYS,
  applicationPayload,
  emptyTaskerApplication,
  toggleList,
  validateTaskerApplication,
} from "@/lib/taskerApplication";

const TEAL = "#0D666A";

function LineField({ label, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-[13px] font-bold text-foreground">{label}</span>
      {children}
    </label>
  );
}

const line =
  "mt-1 w-full border-0 border-b border-[#0D666A]/35 bg-transparent px-0.5 py-1.5 text-sm text-foreground outline-none focus:border-[#0D666A]";

function Check({ on, disabled, onToggle, label }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      className="flex items-center gap-2 text-left text-[13px] font-semibold text-foreground disabled:opacity-70"
    >
      <span
        className="flex h-4 w-4 items-center justify-center rounded-[3px] border"
        style={{ borderColor: TEAL, background: on ? TEAL : "transparent" }}
      >
        {on ? <span className="text-[10px] font-black text-white">✓</span> : null}
      </span>
      {label}
    </button>
  );
}

export default function TaskerApplicationForm({ user, idDocument, onIdDocument, error, saving, locked, onSubmit }) {
  const [form, setForm] = useState(() => emptyTaskerApplication(user));
  const barangays = useMemo(() => getBarangays(form.location_area), [form.location_area]);
  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }));
  const status = user?.verification_status || "unverified";

  const submit = (e) => {
    e.preventDefault();
    const message = validateTaskerApplication(form, idDocument);
    if (message) {
      onSubmit(new Error(message));
      return;
    }
    onSubmit(null, { id_document: idDocument, ...applicationPayload(form) });
  };

  return (
    <form onSubmit={submit} className="overflow-hidden rounded-[1.6rem] bg-[#F7F4EC] shadow-[0_18px_50px_rgba(15,23,42,0.12)]">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 text-white" style={{ background: TEAL }}>
        <div className="flex items-center gap-2 text-[13px] font-black tracking-[0.12em]">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
            <path d="M20.5 7.2a4.2 4.2 0 0 1-5.8 3.9l-7.6 7.6a1.6 1.6 0 0 1-2.3-2.3l7.6-7.6a4.2 4.2 0 1 1 8.1-1.6Z" />
          </svg>
          KHAKIWORKS.COM
        </div>
        <p className="text-[11px] font-semibold text-white/85">Account Verification · Post and accept gawain</p>
      </div>

      <div className="space-y-7 px-5 py-6 sm:px-8">
        <p className="rounded-full bg-[#E8DCC4] px-4 py-2 text-center text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: TEAL }}>
          Applicant Information Form — Please fill out all sections clearly
        </p>

        {error ? <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}

        <section>
          <h2 className="flex items-center gap-2 text-lg font-black" style={{ color: TEAL }}>
            01. Personal Information
          </h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <LineField label="Full Name:" className="sm:col-span-2">
              <input className={line} value={form.full_name} disabled={locked} onChange={(e) => set({ full_name: e.target.value })} />
            </LineField>
            <LineField label="Contact No:">
              <input className={line} inputMode="tel" value={form.phone} disabled={locked} onChange={(e) => set({ phone: e.target.value })} />
            </LineField>
            <LineField label="Age:">
              <input className={line} inputMode="numeric" value={form.age} disabled={locked} onChange={(e) => set({ age: e.target.value })} />
            </LineField>
            <LineField label="Town / City:">
              <select
                className={line}
                value={form.location_area}
                disabled={locked}
                onChange={(e) => set({ location_area: e.target.value, barangay: "" })}
              >
                {MUNICIPALITY_NAMES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </LineField>
            <LineField label="Barangay:">
              <select
                className={line}
                value={form.barangay}
                disabled={locked}
                onChange={(e) => set({ barangay: e.target.value })}
              >
                <option value="">Select barangay</option>
                {barangays.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </LineField>
            <LineField label="Valid ID Type:">
              <select className={line} value={form.id_type} disabled={locked} onChange={(e) => set({ id_type: e.target.value })}>
                <option value="">Select ID</option>
                {APPLICATION_ID_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </LineField>
            <LineField label="Address in Palawan:" className="sm:col-span-2">
              <input
                className={line}
                placeholder="Street, sitio, or landmark in Puerto Princesa / your town"
                value={form.location_detail}
                disabled={locked}
                onChange={(e) => set({ location_detail: e.target.value })}
              />
            </LineField>
            <LineField label="Valid ID photo / scan:" className="sm:col-span-2">
              <input
                className="mt-2 block w-full text-sm"
                type="file"
                accept="image/*,.pdf"
                disabled={locked}
                onChange={(e) => onIdDocument(fileMeta(e.target.files?.[0]))}
              />
              {idDocument?.name ? <p className="mt-1 text-xs text-muted-foreground">Attached: {idDocument.name}</p> : null}
            </LineField>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-black" style={{ color: TEAL }}>
            02. Skills Checklist
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">Select all that apply:</p>
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            {APPLICATION_SKILLS.map((skill) => (
              <Check
                key={skill}
                label={skill}
                disabled={locked}
                on={form.skills.includes(skill)}
                onToggle={() => set({ skills: toggleList(form.skills, skill) })}
              />
            ))}
            <label className="col-span-2 flex items-center gap-2 text-[13px] font-semibold">
              <span className="flex h-4 w-4 items-center justify-center rounded-[3px] border" style={{ borderColor: TEAL, background: form.other_skill ? TEAL : "transparent" }}>
                {form.other_skill ? <span className="text-[10px] font-black text-white">✓</span> : null}
              </span>
              Other:
              <input
                className={`${line} mt-0 flex-1`}
                disabled={locked}
                value={form.other_skill}
                onChange={(e) => set({ other_skill: e.target.value })}
              />
            </label>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-black" style={{ color: TEAL }}>
            03. Experience & Availability
          </h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <LineField label="Experience Years:">
              <select className={line} value={form.experience_years} disabled={locked} onChange={(e) => set({ experience_years: e.target.value })}>
                <option value="">e.g. 0, 1-2, 3-5, 5+</option>
                {EXPERIENCE_YEARS.map((y) => (
                  <option key={y}>{y}</option>
                ))}
              </select>
            </LineField>
            <LineField label="Daily Rate Expectation (₱ / day):">
              <input className={line} inputMode="numeric" placeholder="e.g. 500" value={form.daily_rate} disabled={locked} onChange={(e) => set({ daily_rate: e.target.value })} />
            </LineField>
          </div>
          <p className="mt-4 text-[13px] font-bold">Available Days:</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
            {WEEKDAYS.map((day) => (
              <Check
                key={day}
                label={day}
                disabled={locked}
                on={form.available_days.includes(day)}
                onToggle={() => set({ available_days: toggleList(form.available_days, day) })}
              />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-black" style={{ color: TEAL }}>
            04. Payment & Emergency Contact
          </h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <LineField label="GCash Number:" className="sm:col-span-2">
              <input className={line} inputMode="tel" value={form.gcash_number} disabled={locked} onChange={(e) => set({ gcash_number: e.target.value })} />
            </LineField>
            <LineField label="Emergency Contact Name:">
              <input className={line} value={form.emergency_contact_name} disabled={locked} onChange={(e) => set({ emergency_contact_name: e.target.value })} />
            </LineField>
            <LineField label="Emergency Contact Number:">
              <input className={line} inputMode="tel" value={form.emergency_contact_number} disabled={locked} onChange={(e) => set({ emergency_contact_number: e.target.value })} />
            </LineField>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-black" style={{ color: TEAL }}>
            05. Declaration & Signature
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{DECLARATION_TEXT}</p>
          <div className="mt-3">
            <Check label="I agree to this declaration" disabled={locked} on={form.declared} onToggle={() => set({ declared: !form.declared })} />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <p className="text-[13px] font-bold text-foreground">Applicant Signature:</p>
              <SignaturePad value={form.signature} disabled={locked} onChange={(signature) => set({ signature })} />
            </div>
            <LineField label="Date:">
              <input className={line} type="date" value={form.signed_at} disabled={locked} onChange={(e) => set({ signed_at: e.target.value })} />
            </LineField>
          </div>
        </section>

        <div className="flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-wide">
          {[
            { key: "verified", label: "Approved" },
            { key: "pending", label: "Pending" },
            { key: "unverified", label: "Rejected" },
          ].map((item) => {
            const on = status === item.key && !(item.key === "unverified" && !user?.verification_note);
            return (
              <span
                key={item.key}
                className="rounded-full px-3 py-1"
                style={{ background: on ? "#D7F0EA" : "#EEEAE0", color: TEAL }}
              >
                {on ? "☑" : "☐"} {item.label}
              </span>
            );
          })}
        </div>

        {!locked ? (
          <button
            type="submit"
            disabled={saving}
            className="flex h-12 w-full items-center justify-center rounded-full text-sm font-black text-white disabled:opacity-60"
            style={{ background: TEAL }}
          >
            {saving ? "Submitting…" : "Submit application"}
          </button>
        ) : (
          <p className="text-center text-sm font-semibold" style={{ color: TEAL }}>
            {status === "verified" ? "Your application is approved. You can bid on jobs." : "Your application is pending admin review."}
          </p>
        )}
      </div>

      <p className="border-t border-[#0D666A]/15 px-5 py-3 text-center text-[11px] text-muted-foreground">
        Submit to KHAKIWORKS.COM · Palawan, Philippines · Form Version: KW-TASKER-2024
      </p>
    </form>
  );
}
