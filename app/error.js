"use client";

import PageErrorFallback from "@/components/PageErrorFallback";

export default function Error({ error, reset }) {
  return <PageErrorFallback error={error} onRetry={reset} />;
}
