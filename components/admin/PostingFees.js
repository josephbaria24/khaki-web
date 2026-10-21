"use client";

import { formatPHP } from "@/lib/khaki";

export default function PostingFees({ transactions = [] }) {
  const total = transactions.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const average = transactions.length ? total / transactions.length : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-black text-[#163044]">Posting fees</h2>
        <p className="truncate text-[11px] font-semibold text-[#163044]/50">2% recorded when a gawain is posted</p>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        <Stat label="Count" value={String(transactions.length)} bg="#163044" fg="#F7F4EC" />
        <Stat label="Total" value={formatPHP(total)} bg="#E5F6EC" fg="#146C43" />
        <Stat label="Average" value={formatPHP(average)} bg="#F8EBD4" fg="#8A5A12" />
      </div>
      <div className="max-h-64 overflow-y-auto rounded-xl border border-[#E6D9C4] bg-white">
        {transactions.length === 0 ? (
          <p className="px-3 py-4 text-center text-xs text-muted-foreground">No posting fees yet.</p>
        ) : transactions.map((row) => (
          <div key={row.id} className="flex items-center gap-2 border-t border-[#EFE7DA] px-3 py-1.5 first:border-t-0">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#C4A15A]" />
            <p className="min-w-0 flex-1 truncate text-sm font-bold text-[#163044]">{row.from || "Poster"}</p>
            <p className="shrink-0 text-[11px] font-semibold text-[#163044]/45">
              {row.created_at ? new Date(row.created_at).toLocaleDateString("en-CA") : ""}
            </p>
            <p className="w-14 shrink-0 text-right text-sm font-black text-[#8A5A12]">{formatPHP(row.amount)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, bg, fg }) {
  return (
    <div className="rounded px-2 py-1.5" style={{ background: bg, color: fg }}>
      <p className="text-[9px] font-extrabold uppercase tracking-wide opacity-80">{label}</p>
      <p className="text-sm font-black leading-tight">{value}</p>
    </div>
  );
}
