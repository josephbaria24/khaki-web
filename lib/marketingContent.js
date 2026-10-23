import { SERVICE_CATEGORIES } from "@/lib/khaki";

export const DEFAULT_PROMO = {
  headline: "What can you get done?",
  sub: "Popular Palawan categories, ready when you are.",
};

const SHORT = {
  transport: "Transport",
  tourism: "Tours",
  repair: "Repair",
  cleaning: "Cleaning",
  digital: "Digital",
  salon: "Wellness",
  pets: "Pets",
  other: "Errands",
};

export function defaultMarketingContent() {
  return {
    promo: { ...DEFAULT_PROMO },
    categories: Object.fromEntries(
      SERVICE_CATEGORIES.map((cat) => [
        cat.key,
        {
          title: cat.title,
          short: SHORT[cat.key] || cat.title,
          desc: cat.desc,
          featured: true,
        },
      ])
    ),
  };
}

export function normalizeMarketingContent(raw) {
  const base = defaultMarketingContent();
  const incoming = raw && typeof raw === "object" ? raw : {};
  const promo = {
    headline: String(incoming.promo?.headline || base.promo.headline).trim() || base.promo.headline,
    sub: String(incoming.promo?.sub || base.promo.sub).trim() || base.promo.sub,
  };
  const categories = {};
  SERVICE_CATEGORIES.forEach((cat) => {
    const row = incoming.categories?.[cat.key] || {};
    categories[cat.key] = {
      title: String(row.title || base.categories[cat.key].title).trim() || base.categories[cat.key].title,
      short: String(row.short || base.categories[cat.key].short).trim() || base.categories[cat.key].short,
      desc: String(row.desc || base.categories[cat.key].desc).trim() || base.categories[cat.key].desc,
      featured: row.featured === false ? false : true,
    };
  });
  return { promo, categories };
}

/** Merge saved marketing overrides onto landing category cards. */
export function applyMarketingToLanding(landingCategories, raw) {
  const content = normalizeMarketingContent(raw);
  return landingCategories
    .map((cat) => {
      const override = content.categories[cat.key];
      if (!override) return cat;
      return {
        ...cat,
        title: override.title,
        desc: override.desc,
        short: override.short,
        featured: override.featured,
      };
    })
    .filter((cat) => cat.featured !== false);
}

export function applyMarketingToPortalCategories(portalCategories, raw) {
  const content = normalizeMarketingContent(raw);
  return portalCategories.map((cat) => {
    const override = content.categories[cat.key];
    if (!override) return cat;
    return {
      ...cat,
      title: override.title,
      short: override.short,
      desc: override.desc,
      featured: override.featured,
    };
  });
}
