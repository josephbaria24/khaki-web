"use client";

import { useMemo } from "react";
import { formatPHP } from "@/lib/khaki";
import { buildAdminDashboard, CHART_COLORS } from "@/lib/adminDashboard";
import { ShieldCheck, Wallet, Briefcase, User, Bell } from "@/components/icons";

export default function AdminOverview({ overview, users, logs, transactions, onOpenTab }) {
  const data = useMemo(
    () => buildAdminDashboard({ overview, users, logs, transactions }),
    [overview, users, logs, transactions]
  );
  const growthUp = data.feeGrowth >= 0;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[1.75rem] bg-[#2A3F4D] p-6 text-[#F7F4EC] shadow-soft lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#F7F4EC]/60">Marketplace pulse</p>
            <p className="mt-2 text-4xl font-black tabular-nums sm:text-5xl">{formatPHP(data.postingFees)}</p>
            <p className="mt-1 text-sm text-[#F7F4EC]/70">Posting fees collected · {data.tasks} gawain total</p>
          </div>
          <div className="grid grid-cols-3 gap-3 lg:min-w-[28rem]">
            <HeroMini label="This month" value={formatPHP(data.feesThisMonth)} />
            <HeroMini label="Last month" value={formatPHP(data.feesLastMonth)} />
            <HeroMini
              label="Growth"
              value={`${growthUp ? "+" : ""}${data.feeGrowth.toFixed(0)}%`}
              accent={growthUp ? "#C8F0D8" : "#FAD4DC"}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Kpi icon={User} label="Users" value={data.users} hint={`${data.suspended} suspended`} />
        <Kpi icon={Briefcase} label="Tasks" value={data.tasks} hint={`${data.openTasks} open`} />
        <Kpi icon={ShieldCheck} label="Pending apps" value={data.pendingVerifications} hint="Verification queue" warn={data.pendingVerifications > 0} onClick={() => onOpenTab?.("verification")} />
        <Kpi icon={Bell} label="Open gawain" value={data.openTasks} hint="Live on marketplace" />
        <Kpi icon={Wallet} label="Fees this month" value={formatPHP(data.feesThisMonth)} hint="2% posting fee" />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {data.attention.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onOpenTab?.(item.tab)}
            className={`rounded-2xl border bg-card p-4 text-left shadow-card transition hover:shadow-soft ${
              item.tone === "warn" ? "border-amber-300" : item.tone === "danger" ? "border-red-300" : "border-transparent"
            }`}
          >
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{item.label}</p>
            <p className="mt-1 text-2xl font-black tabular-nums">{item.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.hint}</p>
          </button>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-3" title="Activity · last 14 days" sub="New accounts vs posted gawain">
          <Legend items={[{ label: "New users", color: CHART_COLORS.sand }, { label: "Tasks posted", color: CHART_COLORS.olive }]} />
          <GroupedBars
            data={data.days}
            series={[
              { key: "users", color: CHART_COLORS.sand },
              { key: "tasks", color: CHART_COLORS.olive },
            ]}
          />
        </Card>
        <Card className="xl:col-span-2" title="Verification mix" sub="All registered accounts">
          <div className="flex flex-col items-center gap-5 sm:flex-row">
            <Donut slices={data.verification} center={data.users} centerLabel="accounts" />
            <SliceList slices={data.verification} />
          </div>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card title="Posting fees · 6 months" sub="Platform take from posted gawain">
          <SingleBars data={data.months} valueKey="fees" format={(value) => formatPHP(value)} color={CHART_COLORS.oliveMid} />
        </Card>
        <Card title="Role mix" sub="Signup roles on Khaki">
          <div className="flex flex-col items-center gap-5 sm:flex-row">
            <Donut slices={data.roles} center={data.users} centerLabel="people" />
            <SliceList slices={data.roles} />
          </div>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card title="Task pipeline" sub="Where gawain sit right now">
          {data.taskStatus.length === 0 ? (
            <Empty>No tasks yet — the pipeline fills as posters go live.</Empty>
          ) : (
            <>
              <StackedBar slices={data.taskStatus} />
              <SliceList slices={data.taskStatus} />
            </>
          )}
        </Card>
        <Card title="Top categories" sub="Most posted gawain types">
          {data.categories.length === 0 ? (
            <Empty>Categories appear once tasks are posted.</Empty>
          ) : (
            <HBars rows={data.categories} />
          )}
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card title="Recent activity" sub="Latest admin and user actions" action={{ label: "View all", onClick: () => onOpenTab?.("activity") }}>
          {data.recentLogs.length === 0 ? (
            <Empty>No activity yet.</Empty>
          ) : (
            <ul className="space-y-3">
              {data.recentLogs.map((log) => (
                <li key={log.id} className="border-b border-border/60 pb-3 last:border-0 last:pb-0">
                  <p className="text-sm font-semibold">{log.actor_name} · {String(log.action || "").replaceAll("_", " ")}</p>
                  <p className="text-xs text-muted-foreground">{log.detail}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Recent posting fees" sub="2% recorded when gawain are posted" action={{ label: "View all", onClick: () => onOpenTab?.("transactions") }}>
          {data.recentTx.length === 0 ? (
            <Empty>No transactions yet.</Empty>
          ) : (
            <ul className="space-y-3">
              {data.recentTx.map((row) => (
                <li key={row.id} className="flex items-center justify-between gap-3 border-b border-border/60 pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-semibold capitalize">{row.kind} · {row.status}</p>
                    <p className="text-xs text-muted-foreground">{row.from} → {row.to}</p>
                  </div>
                  <p className="font-black tabular-nums">{formatPHP(row.amount)}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
    </div>
  );
}

function HeroMini({ label, value, accent }) {
  return (
    <div className="rounded-2xl bg-white/10 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#F7F4EC]/55">{label}</p>
      <p className="mt-1 text-base font-black tabular-nums sm:text-lg" style={accent ? { color: accent } : undefined}>{value}</p>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, hint, warn, onClick }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`rounded-2xl bg-card p-5 text-left shadow-card ${onClick ? "transition hover:shadow-soft" : ""} ${warn ? "ring-1 ring-amber-300" : ""}`}
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#E8DCC4] text-[#2A3F4D]">
          <Icon className="h-4 w-4" />
        </span>
        <p className="text-[11px] font-bold uppercase tracking-wide">{label}</p>
      </div>
      <p className="mt-3 text-2xl font-black tabular-nums xl:text-3xl">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </Tag>
  );
}

function Card({ title, sub, children, className = "", action }) {
  return (
    <div className={`rounded-[1.75rem] bg-card p-5 shadow-card lg:p-6 ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold">{title}</h3>
          {sub ? <p className="text-[11px] text-muted-foreground">{sub}</p> : null}
        </div>
        {action ? (
          <button type="button" onClick={action.onClick} className="text-xs font-bold text-[#163044]">
            {action.label}
          </button>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function Legend({ items }) {
  return (
    <div className="mb-3 flex flex-wrap gap-3">
      {items.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

function GroupedBars({ data, series }) {
  const max = Math.max(...data.flatMap((row) => series.map((item) => Number(row[item.key] || 0))), 1);
  return (
    <div className="flex h-48 items-end gap-1 sm:gap-1.5">
      {data.map((row) => (
        <div key={row.key} className="flex min-w-0 flex-1 flex-col items-center gap-1">
          <div className="flex h-40 w-full items-end justify-center gap-px sm:gap-0.5">
            {series.map((item) => {
              const value = Number(row[item.key] || 0);
              return (
                <div
                  key={item.key}
                  title={`${item.key}: ${value}`}
                  className="w-[46%] rounded-t-md"
                  style={{ height: `${value ? Math.max((value / max) * 100, 6) : 2}%`, background: value ? item.color : "#EDE6D6" }}
                />
              );
            })}
          </div>
          <span className="text-[9px] font-semibold text-muted-foreground sm:text-[10px]">{row.weekday}</span>
        </div>
      ))}
    </div>
  );
}

function SingleBars({ data, valueKey, format, color }) {
  const max = Math.max(...data.map((row) => Number(row[valueKey] || 0)), 1);
  return (
    <div className="flex h-48 items-end gap-2">
      {data.map((row) => {
        const value = Number(row[valueKey] || 0);
        return (
          <div key={row.key} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <p className="text-[10px] font-bold tabular-nums text-muted-foreground">{value ? format(value) : "—"}</p>
            <div
              className="w-full rounded-t-lg"
              style={{ height: `${value ? Math.max((value / max) * 140, 8) : 4}px`, background: value ? color : "#EDE6D6" }}
            />
            <span className="text-[10px] font-semibold text-muted-foreground">{row.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function Donut({ slices, center, centerLabel, size = 168 }) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0) || 1;
  const thickness = 22;
  const radius = size / 2 - thickness;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#EDE6D6" strokeWidth={thickness} />
      {slices.map((slice) => {
        const length = (slice.value / total) * circumference;
        const node = (
          <circle
            key={slice.key}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={slice.color}
            strokeWidth={thickness}
            strokeDasharray={`${length} ${circumference - length}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        );
        offset += length;
        return node;
      })}
      <text x="50%" y="48%" textAnchor="middle" fill="#2A3F4D" fontSize="22" fontWeight="800">{center}</text>
      <text x="50%" y="61%" textAnchor="middle" fill="#6B6558" fontSize="11">{centerLabel}</text>
    </svg>
  );
}

function SliceList({ slices }) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0) || 1;
  return (
    <ul className="w-full space-y-2">
      {slices.map((slice) => (
        <li key={slice.key} className="flex items-center justify-between gap-3 text-sm">
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: slice.color }} />
            <span className="capitalize">{slice.label}</span>
          </span>
          <span className="tabular-nums text-muted-foreground">{slice.value} · {Math.round((slice.value / total) * 100)}%</span>
        </li>
      ))}
    </ul>
  );
}

function StackedBar({ slices }) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0) || 1;
  return (
    <div className="mb-4 flex h-4 overflow-hidden rounded-full bg-[#EDE6D6]">
      {slices.map((slice) => (
        <div key={slice.key} style={{ width: `${(slice.value / total) * 100}%`, background: slice.color }} title={`${slice.label}: ${slice.value}`} />
      ))}
    </div>
  );
}

function HBars({ rows }) {
  const max = Math.max(...rows.map((row) => row.value), 1);
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-semibold">{row.label}</span>
            <span className="tabular-nums text-muted-foreground">{row.value}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-[#EDE6D6]">
            <div className="h-full rounded-full" style={{ width: `${Math.max((row.value / max) * 100, 6)}%`, background: row.color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Empty({ children }) {
  return <p className="py-8 text-center text-sm text-muted-foreground">{children}</p>;
}
