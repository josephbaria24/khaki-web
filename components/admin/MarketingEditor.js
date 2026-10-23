"use client";

import { useEffect, useState } from "react";
import { Beach, Car, Clean, Compass, Laptop, Scissor, Sparkles, Wrench } from "@/components/icons";
import { normalizeMarketingContent } from "@/lib/marketingContent";
import { api } from "@/lib/store";
import { SERVICE_CATEGORIES } from "@/lib/khaki";
import { toast } from "@/lib/toast";

const ICONS = {
  transport: Car,
  tourism: Beach,
  repair: Wrench,
  cleaning: Clean,
  digital: Laptop,
  salon: Scissor,
  pets: Compass,
  other: Sparkles,
};

const LOOK = {
  transport: { color: "#2F6F9A", bg: "#E7F1FA" },
  tourism: { color: "#1F9D6A", bg: "#E4F6EB" },
  repair: { color: "#C46A2E", bg: "#FFF1E4" },
  cleaning: { color: "#3A73C4", bg: "#E7F1FA" },
  digital: { color: "#5B4B8A", bg: "#EEE8FF" },
  salon: { color: "#C43A6A", bg: "#FFE8EE" },
  pets: { color: "#8A6A3B", bg: "#F6EFE2" },
  other: { color: "#3D5C6E", bg: "#E6EEF2" },
};

export default function MarketingEditor({ mode = "categories", onSaved }) {
  const [draft, setDraft] = useState(() => normalizeMarketingContent(null));
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    let live = true;
    api.marketing.get().then((raw) => {
      if (!live) return;
      setDraft(normalizeMarketingContent(raw));
      setReady(true);
    }).catch((err) => {
      if (!live) return;
      setDraft(normalizeMarketingContent(null));
      setError(err.message || "Could not load marketing content");
      setReady(true);
    });
    return () => { live = false; };
  }, []);

  const updatePromo = (field, value) => {
    setDirty(true);
    setDraft((prev) => ({ ...prev, promo: { ...prev.promo, [field]: value } }));
  };

  const updateCat = (key, field, value) => {
    setDirty(true);
    setDraft((prev) => ({
      ...prev,
      categories: {
        ...prev.categories,
        [key]: { ...prev.categories[key], [field]: value },
      },
    }));
  };

  const save = async () => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const next = normalizeMarketingContent(draft);
      await api.marketing.save(next);
      setDraft(next);
      setDirty(false);
      onSaved?.(next);
      toast.success("Marketing content saved. Homepage will use the new copy.");
    } catch (err) {
      setError(err.message || "Could not save");
      toast.error(err.message || "Could not save");
    } finally {
      setBusy(false);
    }
  };

  if (!ready) {
    return <p className="text-sm text-muted-foreground">Loading editor…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-black">{mode === "content" ? "Landing content" : "Category manager"}</h3>
          <p className="text-xs text-muted-foreground">
            {mode === "content"
              ? "Edit the homepage headline and each category blurb customers see."
              : "Rename labels shown on the homepage. Task matching still uses the system category."}
          </p>
        </div>
        <button
          type="button"
          disabled={busy || !dirty}
          onClick={save}
          className="rounded-full bg-[#163044] px-4 py-2 text-xs font-black text-[#F7F4EC] disabled:opacity-50"
        >
          {busy ? "Saving…" : dirty ? "Save changes" : "Saved"}
        </button>
      </div>
      {error ? <p className="text-sm font-semibold text-destructive">{error}</p> : null}

      {mode === "content" ? (
        <div className="rounded-[1.35rem] bg-card p-4 shadow-card">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Homepage promo</p>
          <label className="mt-3 block text-sm font-bold">
            Headline
            <input
              value={draft.promo.headline}
              onChange={(event) => updatePromo("headline", event.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-[#163044]/10 bg-[#FBF8F1] px-3 text-sm font-semibold dark:border-white/10 dark:bg-[#11141A]"
            />
          </label>
          <label className="mt-3 block text-sm font-bold">
            Supporting line
            <textarea
              value={draft.promo.sub}
              onChange={(event) => updatePromo("sub", event.target.value)}
              rows={2}
              className="mt-1 w-full rounded-xl border border-[#163044]/10 bg-[#FBF8F1] px-3 py-2 text-sm font-semibold dark:border-white/10 dark:bg-[#11141A]"
            />
          </label>
        </div>
      ) : null}

      <div className="grid gap-3">
        {SERVICE_CATEGORIES.map((cat) => {
          const row = draft.categories[cat.key];
          const look = LOOK[cat.key] || LOOK.other;
          const Icon = ICONS[cat.key] || Sparkles;
          return (
            <div key={cat.key} className="rounded-[1.35rem] p-4 shadow-card" style={{ background: look.bg }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/80">
                    <Icon className="h-5 w-5" color={look.color} />
                  </span>
                  <div>
                    <p className="text-sm font-black" style={{ color: look.color }}>{cat.key}</p>
                    <p className="text-[11px] font-semibold opacity-70" style={{ color: look.color }}>System key · not renamed in tasks</p>
                  </div>
                </div>
                <label className="inline-flex items-center gap-2 text-xs font-bold" style={{ color: look.color }}>
                  <input
                    type="checkbox"
                    checked={row.featured}
                    onChange={(event) => updateCat(cat.key, "featured", event.target.checked)}
                  />
                  Show on homepage
                </label>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <label className="block text-xs font-bold" style={{ color: look.color }}>
                  Display title
                  <input
                    value={row.title}
                    onChange={(event) => updateCat(cat.key, "title", event.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border-0 bg-white/80 px-3 text-sm font-semibold text-[#163044]"
                  />
                </label>
                <label className="block text-xs font-bold" style={{ color: look.color }}>
                  Short label
                  <input
                    value={row.short}
                    onChange={(event) => updateCat(cat.key, "short", event.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border-0 bg-white/80 px-3 text-sm font-semibold text-[#163044]"
                  />
                </label>
              </div>
              {(mode === "content" || mode === "categories") ? (
                <label className="mt-2 block text-xs font-bold" style={{ color: look.color }}>
                  Description
                  <textarea
                    value={row.desc}
                    onChange={(event) => updateCat(cat.key, "desc", event.target.value)}
                    rows={2}
                    className="mt-1 w-full rounded-xl border-0 bg-white/80 px-3 py-2 text-sm font-semibold text-[#163044]"
                  />
                </label>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
