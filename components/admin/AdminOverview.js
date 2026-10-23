"use client";

import { useMemo, useState } from "react";
import { formatPHP } from "@/lib/khaki";
import { buildAdminDashboard, CHART_COLORS } from "@/lib/adminDashboard";
import { ShieldCheck, Wallet, Briefcase, User, Bell, Flash, Calendar } from "@/components/icons";
import RolePortals from "@/components/admin/RolePortals";

const PANELS = [
  { id: "snapshot", label: "Snapshot", icon: Flash },
  { id: "trends", label: "Trends", icon: Calendar },
  { id: "tasks", label: "Tasks", icon: Briefcase },
  { id: "recent", label: "Recent", icon: Bell },
];

export default function AdminOverview({ overview, users, logs, transactions, onOpenTab, lockedPortal = null, onCreateUser }) {
  const [panel, setPanel] = useState("snapshot");
  const [pulse, setPulse] = useState(false);
  const data = useMemo(
    () => buildAdminDashboard({ overview, users, logs, transactions }),
    [overview, users, logs, transactions]
  );
  const growthUp = data.feeGrowth >= 0;
  const attentionBadge = data.attention.reduce((sum, item) => sum + (item.tone !== "ok" && Number(item.value) > 0 ? Number(item.value) : 0), 0);
  const activeIndex = Math.max(0, PANELS.findIndex((item) => item.id === panel));

  return (
    <div className="space-y-4">
      <RolePortals
        overview={overview}
        users={users}
        logs={logs}
        transactions={transactions}
        onOpenTab={onOpenTab}
        lockedPortal={lockedPortal}
        onCreateUser={onCreateUser}
      />
      {lockedPortal ? null : (
      <>
      <button
        type="button"
        onClick={() => setPulse((value) => !value)}
        className="text-sm font-bold text-[#163044] underline-offset-4 hover:underline dark:text-[#E8E4DC]"
      >
        {pulse ? "Hide marketplace pulse" : "Marketplace pulse"}
      </button>
      {pulse ? (
      <div className="space-y-4">
      <nav
        className="overview-tablist sticky top-0 z-10 -mx-1 grid grid-cols-4 rounded-2xl border border-[#163044]/08 bg-card/95 p-1 shadow-card backdrop-blur-md dark:border-white/10"
        aria-label="Overview sections"
      >
        <span
          aria-hidden
          className="overview-tab-pill pointer-events-none absolute top-1 bottom-1 left-1 rounded-xl bg-[#163044] shadow-sm"
          style={{
            width: `calc((100% - 0.5rem) / ${PANELS.length})`,
            transform: `translate3d(calc(${activeIndex} * 100%), 0, 0)`,
          }}
        />
        {PANELS.map((item) => {
          const Icon = item.icon;
          const on = panel === item.id;
          const badge = item.id === "snapshot" && attentionBadge > 0 ? attentionBadge : 0;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setPanel(item.id)}
              aria-pressed={on}
              className={`relative z-[1] flex min-w-0 items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-xs font-black transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] sm:gap-2 sm:px-3 sm:text-sm ${
                on
                  ? "text-[#F7F4EC]"
                  : "text-[#2A3F4D] hover:text-[#163044] dark:text-[#E8E4DC] dark:hover:text-white"
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${on ? "scale-110" : "scale-100"}`} color="currentColor" />
              <span className="truncate">{item.label}</span>
              {badge ? (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-black tabular-nums transition-colors duration-300 ${on ? "bg-[#F6C56B] text-[#7A4A00]" : "bg-[#FFF4D6] text-[#B45309]"}`}>
                  {badge > 99 ? "99+" : badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {panel === "snapshot" ? (
        <div key="snapshot" className="overview-panel space-y-4">
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

          <section className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-5">
            <Kpi theme="users" icon={User} label="Users" value={data.users} hint={`${data.suspended} suspended`} />
            <Kpi theme="tasks" icon={Briefcase} label="Tasks" value={data.tasks} hint={`${data.openTasks} open`} />
            <Kpi
              theme="pending"
              icon={ShieldCheck}
              label="Pending apps"
              value={data.pendingVerifications}
              hint="Verification queue"
              pulse={data.pendingVerifications > 0}
              onClick={() => onOpenTab?.("verification")}
            />
            <Kpi theme="open" icon={Bell} label="Open gawain" value={data.openTasks} hint="Live on marketplace" />
            <Kpi theme="fees" icon={Wallet} label="Fees this month" value={formatPHP(data.feesThisMonth)} hint="From posted gawain" className="col-span-2 xl:col-span-1" />
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
        </div>
      ) : null}

      {panel === "trends" ? (
        <div key="trends" className="overview-panel space-y-4">
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
        </div>
      ) : null}

      {panel === "tasks" ? (
        <section key="tasks" className="overview-panel grid gap-4 lg:grid-cols-2">
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
      ) : null}

      {panel === "recent" ? (
        <section key="recent" className="overview-panel grid gap-4 lg:grid-cols-2">
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
          <Card title="Recent posting fees" sub="Recorded when gawain are posted" action={{ label: "View all", onClick: () => onOpenTab?.("transactions") }}>
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
      ) : null}
      </div>
      ) : null}
      </>
      )}
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

const KPI_THEMES = {
  users: {
    bg: "linear-gradient(145deg, #E8F1F8 0%, #D4E6FF 55%, #C5DBF5 100%)",
    ink: "#163044",
    muted: "#4A6578",
    iconBg: "#FFFFFF",
    iconFg: "#3A73C4",
    blob: "rgba(58,115,196,0.22)",
    ring: "rgba(58,115,196,0.28)",
  },
  tasks: {
    bg: "linear-gradient(145deg, #E7F3EA 0%, #CFF5D6 55%, #B8EBC6 100%)",
    ink: "#1A4D32",
    muted: "#3D6B4F",
    iconBg: "#FFFFFF",
    iconFg: "#2E8A5A",
    blob: "rgba(46,138,90,0.22)",
    ring: "rgba(46,138,90,0.28)",
  },
  pending: {
    bg: "linear-gradient(145deg, #FFF6DC 0%, #FFE4A3 55%, #F6C56B 100%)",
    ink: "#7A4A00",
    muted: "#9A6410",
    iconBg: "#FFFFFF",
    iconFg: "#B45309",
    blob: "rgba(180,83,9,0.2)",
    ring: "rgba(180,83,9,0.35)",
  },
  open: {
    bg: "linear-gradient(145deg, #E4F4F2 0%, #C5EBE6 55%, #9FDED6 100%)",
    ink: "#0D4F4C",
    muted: "#2A6B68",
    iconBg: "#FFFFFF",
    iconFg: "#0D666A",
    blob: "rgba(13,102,106,0.2)",
    ring: "rgba(13,102,106,0.28)",
  },
  fees: {
    bg: "linear-gradient(145deg, #F3EDE0 0%, #E8DCC4 55%, #DCC9A4 100%)",
    ink: "#3F3420",
    muted: "#6B5A38",
    iconBg: "#FFFFFF",
    iconFg: "#8A6A18",
    blob: "rgba(138,106,24,0.2)",
    ring: "rgba(138,106,24,0.28)",
  },
};

function Kpi({ theme = "users", icon: Icon, label, value, hint, pulse, onClick, className = "" }) {
  const tone = KPI_THEMES[theme] || KPI_THEMES.users;
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`admin-kpi relative overflow-hidden rounded-2xl p-3 text-left shadow-card sm:p-4 ${
        onClick ? "transition hover:-translate-y-0.5 hover:shadow-soft" : ""
      } ${pulse ? "ring-2 ring-offset-1 ring-offset-background" : ""} ${className}`}
      style={{
        background: tone.bg,
        color: tone.ink,
        "--kpi-ink": tone.ink,
        "--kpi-muted": tone.muted,
        "--kpi-icon-bg": tone.iconBg,
        "--kpi-icon-fg": tone.iconFg,
        ...(pulse ? { boxShadow: `0 0 0 2px ${tone.ring}` } : {}),
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -right-4 -top-5 h-20 w-20 rounded-full sm:h-24 sm:w-24"
        style={{ background: tone.blob }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-6 -left-3 h-16 w-16 rounded-full opacity-70"
        style={{ background: tone.blob }}
      />
      <div className="relative flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="admin-kpi-muted text-[10px] font-black uppercase tracking-[0.14em] sm:text-[11px]" style={{ color: tone.muted }}>
            {label}
          </p>
          <p className="mt-1 text-xl font-black tabular-nums leading-none sm:text-2xl xl:text-[1.7rem]">{value}</p>
          <p className="admin-kpi-muted mt-1.5 text-[11px] font-semibold leading-tight sm:text-xs" style={{ color: tone.muted }}>
            {hint}
          </p>
        </div>
        <span
          className="admin-kpi-icon relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-sm sm:h-10 sm:w-10"
          style={{ background: tone.iconBg, color: tone.iconFg }}
        >
          <Icon className="h-4 w-4 sm:h-[1.1rem] sm:w-[1.1rem]" color="currentColor" />
          {pulse ? (
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-[#B45309] ring-2 ring-white" />
          ) : null}
        </span>
      </div>
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
          <button type="button" onClick={action.onClick} className="text-xs font-bold text-foreground">
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
                  className={`w-[46%] rounded-t-md ${value ? "" : "bg-[#EDE6D6] dark:bg-[#2A303C]"}`}
                  style={{ height: `${value ? Math.max((value / max) * 100, 6) : 2}%`, background: value ? item.color : undefined }}
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
              className={`w-full rounded-t-lg ${value ? "" : "bg-[#EDE6D6] dark:bg-[#2A303C]"}`}
              style={{ height: `${value ? Math.max((value / max) * 140, 8) : 4}px`, background: value ? color : undefined }}
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
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" className="stroke-[#EDE6D6] dark:stroke-[#2A303C]" strokeWidth={thickness} />
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
      <text x="50%" y="48%" textAnchor="middle" className="fill-[#2A3F4D] dark:fill-[#F5F3EE]" fontSize="22" fontWeight="800">{center}</text>
      <text x="50%" y="61%" textAnchor="middle" className="fill-[#6B6558] dark:fill-[#F5F3EE]/60" fontSize="11">{centerLabel}</text>
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
    <div className="mb-4 flex h-4 overflow-hidden rounded-full bg-[#EDE6D6] dark:bg-[#2A303C]">
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
          <div className="h-2.5 overflow-hidden rounded-full bg-[#EDE6D6] dark:bg-[#2A303C]">
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
