"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "@/components/icons";
import AppShell from "@/components/AppShell";
import Container from "@/components/Container";
import { useAuth } from "@/lib/AuthContext";
import { LOCATIONS, SCHEDULE_LABELS, SERVICE_CATEGORIES, formatPHP, postingFee, serviceByKey } from "@/lib/khaki";
import { getBarangays } from "@/lib/palawanLocations";
import { canOpenPost, canPostTask } from "@/lib/roles";
import { api } from "@/lib/store";
import { toast } from "@/lib/toast";

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

  if (!canOpenPost(user)) {
    return (
      <AppShell>
        <Container className="py-10">
          <h1 className="page-title">Poster mode lang</h1>
          <p className="page-sub">I-switch sa Poster sa taas para mag-post ng gawain. Tasker mode is for maghanap at bidding.</p>
        </Container>
      </AppShell>
    );
  }

  if (!canPostTask(user)) {
    const pending = user?.verification_status === "pending";
    return (
      <AppShell>
        <Container className="py-10">
          <h1 className="page-title">{pending ? "Hintayin ang approval" : "I-verify muna ang account"}</h1>
          <p className="page-sub">
            {pending
              ? "Naka-submit na ang verification mo. Admin will review it before you can post or accept gawain."
              : "One verification lang — after approval, puwede kang mag-post (Poster) at mag-bid (Tasker) sa same account."}
          </p>
          <Link href="/verify" className="mt-4 inline-flex h-11 items-center rounded-xl bg-primary px-5 font-bold text-white">
            {pending ? "Tingnan ang application" : "I-verify ang account"}
          </Link>
        </Container>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Container className="py-6 lg:py-10">
        <button onClick={() => router.back()} className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground lg:hidden">
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        <div className="mb-6">
          <h1 className="page-title">Mag-post ng gawain</h1>
          <p className="page-sub">I-describe ang kailangan mo at mag-set ng budget guide. 2% posting fee lang — kayo ng tasker ang mag-aayos ng bayad.</p>
        </div>
        <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4 rounded-2xl border border-border bg-card p-5 sm:p-6">
            {error && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
            <input className="h-12 w-full rounded-xl border px-3" placeholder="What needs to be done?" value={form.title} onChange={(e) => set("title", e.target.value)} required minLength={4} />
            <div className="grid gap-4 sm:grid-cols-2">
              <select
                className="h-12 w-full rounded-xl border px-3"
                value={form.categoryKey}
                onChange={(e) => {
                  set("categoryKey", e.target.value);
                  set("groupTitle", "");
                }}
              >
                {SERVICE_CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>{c.title}</option>
                ))}
              </select>
              <select className="h-12 w-full rounded-xl border px-3" value={form.schedule_type} onChange={(e) => set("schedule_type", e.target.value)}>
                {Object.entries(SCHEDULE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">What kind of {service.title.toLowerCase()}?</p>
              <div className="flex flex-wrap gap-1.5">
                {service.groups.map((group) => {
                  const on = form.groupTitle === group.title;
                  return (
                    <button
                      key={group.title}
                      type="button"
                      onClick={() => set("groupTitle", on ? "" : group.title)}
                      className={`rounded-full px-3 py-1.5 text-xs font-bold ${on ? "bg-primary text-white" : "bg-[#F3EFE3] text-foreground"}`}
                    >
                      {group.title}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                {(service.groups.find((g) => g.title === form.groupTitle) || {}).desc || service.desc}
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_remote} onChange={(e) => set("is_remote", e.target.checked)} /> Remote task (any town in Palawan)</label>
            {!form.is_remote && (
              <div className="grid gap-4 sm:grid-cols-2">
                <select className="h-12 w-full rounded-xl border px-3" value={form.location_area} onChange={(e) => set("location_area", e.target.value)}>
                  {LOCATIONS.map((l) => <option key={l}>{l}</option>)}
                </select>
                <select className="h-12 w-full rounded-xl border px-3" value={form.barangay} onChange={(e) => set("barangay", e.target.value)}>
                  <option value="">Barangay (optional)</option>
                  {barangays.map((b) => <option key={b}>{b}</option>)}
                </select>
                <input className="h-12 w-full rounded-xl border px-3 sm:col-span-2" placeholder="Sitio, street, or landmark" value={form.location_detail} onChange={(e) => set("location_detail", e.target.value)} />
              </div>
            )}
            <textarea className="min-h-32 w-full rounded-xl border p-3" placeholder="Details" value={form.details} onChange={(e) => set("details", e.target.value)} />
          </div>
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-border bg-card p-5">
              <label className="block text-sm font-medium">
                Budget (PHP)
                <input className="mt-1 h-12 w-full rounded-xl border px-3" type="number" min={50} value={form.budget_php} onChange={(e) => set("budget_php", e.target.value)} required />
              </label>
              <p className="mt-3 text-sm font-bold">Posting fee (2%): {formatPHP(postingFee(Number(form.budget_php) || 0))}</p>
              <p className="mt-1 text-xs text-muted-foreground">Recorded when you post (2%). The listed budget is a guide only — payment for the work is between you and the tasker.</p>
              <button className="mt-4 h-12 w-full rounded-xl bg-primary font-bold text-white">I-post ang gawain</button>
            </div>
          </aside>
        </form>
      </Container>
    </AppShell>
  );
}
