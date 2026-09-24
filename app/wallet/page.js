"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import Container from "@/components/Container";
import { formatPHP } from "@/lib/khaki";
import { api } from "@/lib/store";

export default function PostingFeesPage() {
  const [fees, setFees] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.fees.mine()
      .then(setFees)
      .catch((e) => {
        setFees([]);
        setError(e.message || "Could not load posting fees.");
      });
  }, []);

  const total = fees.reduce((sum, row) => sum + Number(row.fee_php || 0), 0);

  return (
    <AppShell>
      <Container className="space-y-6 py-6 lg:py-10">
        <div>
          <h1 className="page-title">Posting fees</h1>
          <p className="page-sub">
            Khaki records a 2% fee when you post a gawain. Job pay stays between you and the tasker — no Khaki wallet, no GCash withdraw.
          </p>
        </div>
        {error ? <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
        <div className="rounded-2xl bg-[#E8DCC4] p-6">
          <p className="text-xs font-semibold text-[#2A3F4D]/70">Recorded posting fees</p>
          <p className="mt-1 text-3xl font-black text-[#2A3F4D]">{formatPHP(total)}</p>
          <p className="mt-2 text-xs text-[#2A3F4D]/70">{fees.length} posted gawain</p>
        </div>
        <div className="space-y-3">
          {fees.length === 0 && !error ? (
            <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
              Wala pang posting fee. Mag-post ng gawain at mare-record ang 2%.
            </p>
          ) : null}
          {fees.map((row) => (
            <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-card p-4 shadow-card">
              <div>
                <p className="font-bold">{formatPHP(row.fee_php)} · 2% of {formatPHP(row.budget_php)}</p>
                <p className="text-xs text-muted-foreground">
                  {row.created_at ? new Date(row.created_at).toLocaleString() : ""}
                </p>
              </div>
              {row.task_id ? (
                <Link href={`/task/${row.task_id}`} className="text-xs font-bold text-[#163044] underline">
                  View gawain
                </Link>
              ) : null}
            </div>
          ))}
        </div>
      </Container>
    </AppShell>
  );
}
