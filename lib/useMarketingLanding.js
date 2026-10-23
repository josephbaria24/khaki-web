"use client";

import { useEffect, useMemo, useState } from "react";
import { LANDING_CATEGORIES } from "@/lib/landingContent";
import { applyMarketingToLanding, DEFAULT_PROMO, normalizeMarketingContent } from "@/lib/marketingContent";
import { api } from "@/lib/store";

export function useMarketingLanding() {
  const [raw, setRaw] = useState(null);

  useEffect(() => {
    let live = true;
    api.marketing.get().then((data) => {
      if (live) setRaw(data);
    }).catch(() => {});
    return () => { live = false; };
  }, []);

  const content = useMemo(() => normalizeMarketingContent(raw), [raw]);
  const categories = useMemo(
    () => applyMarketingToLanding(LANDING_CATEGORIES, raw),
    [raw]
  );

  return {
    categories,
    promo: content.promo || DEFAULT_PROMO,
  };
}
