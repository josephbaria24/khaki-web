"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Beach, Car, ChevronLeft, Clean, Compass, Laptop, Lock, MapPin, Scissor, Sparkles, Wrench } from "@/components/icons";
import MarketingEditor from "@/components/admin/MarketingEditor";
import { formatPHP, timeAgo } from "@/lib/khaki";
import {
  PERMISSION_ROWS,
  ROLE_MODULES,
  STAFF_ROLES,
  buildPortalSnapshot,
  cloneAccess,
  moduleAllowed,
  moduleCounts,
} from "@/lib/adminPortals";
import { applyMarketingToPortalCategories } from "@/lib/marketingContent";
import { api } from "@/lib/store";

const TONE = {
  marketing: { bg: "#FFF6D8", ink: "#7A5600", chip: "#F6C453" },
  accounting: { bg: "#E7F6EC", ink: "#146C3A", chip: "#B7E4C7" },
  it: { bg: "#E7F0FF", ink: "#1E4E8C", chip: "#C9DBFF" },
  investor: { bg: "#F8EFD6", ink: "#7A5A1E", chip: "#E6D3A1" },
};

const CAT_COLORS = ["#163044", "#3E7498", "#C4B07A", "#8BA8B8", "#C9893A", "#4F8A72", "#C45C4A", "#6B6558"];

const CAT_LOOK = {
  transport: { Icon: Car, color: "#2F6F9A", bg: "#E7F1FA" },
  tourism: { Icon: Beach, color: "#1F9D6A", bg: "#E4F6EB" },
  repair: { Icon: Wrench, color: "#C46A2E", bg: "#FFF1E4" },
  cleaning: { Icon: Clean, color: "#3A73C4", bg: "#E7F1FA" },
  digital: { Icon: Laptop, color: "#5B4B8A", bg: "#EEE8FF" },
  salon: { Icon: Scissor, color: "#C43A6A", bg: "#FFE8EE" },
  pets: { Icon: Compass, color: "#8A6A3B", bg: "#F6EFE2" },
  other: { Icon: Sparkles, color: "#3D5C6E", bg: "#E6EEF2" },
};

export default function RolePortals({ overview, users, logs, transactions, onOpenTab, lockedPortal = null, onCreateUser }) {
  const snap = useMemo(
    () => buildPortalSnapshot({ overview, users, logs, transactions }),
    [overview, users, logs, transactions]
  );
  const [portal, setPortal] = useState(lockedPortal || "super");
  const [access, setAccess] = useState(() => cloneAccess());
  const [picked, setPicked] = useState(null);
  const [hint, setHint] = useState("");
  const [section, setSection] = useState("overview");
  const router = useRouter();

  const setPerm = (role, perm, value) => {
    setAccess((prev) => ({ ...prev, [role]: { ...prev[role], [perm]: value } }));
    setHint("");
  };

  const applyPicked = (value) => {
    if (!picked) {
      setHint("Select a cell in the matrix first.");
      return;
    }
    setPerm(picked.role, picked.perm, value);
  };

  if (portal !== "super") {
    const role = STAFF_ROLES.find((item) => item.id === portal);
    return (
      <RoleScreen
        role={role}
        snap={snap}
        access={access}
        users={users}
        transactions={transactions}
        section={section}
        setSection={setSection}
        onBack={lockedPortal ? null : () => {
          setSection("overview");
          setPortal("super");
        }}
        onOpen={(mod) => openModule(mod, { onOpenTab, setSection, router, allowLeave: !lockedPortal })}
      />
    );
  }

  return (
    <div className="space-y-4">
      <PortalBar
        kicker="Main portal"
        title="Super Admin"
        detail="All access"
        chip="SA"
        chipStyle={{ background: "#F6C453", color: "#3F2E00" }}
      />

      <div>
        <h2 className="text-2xl font-black tracking-tight text-[#163044] sm:text-3xl dark:text-[#F5F3EE]">Super Admin Dashboard</h2>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">Master control for the marketplace, payments, verification, and staff portals.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard label="Total users" value={snap.people} hint={`${snap.activeNow} active now`} />
        <StatCard
          label="System health"
          value={snap.health === "healthy" ? "Healthy" : "Review"}
          hint={snap.health === "healthy" ? "All systems operational" : `${snap.waiting} items need a look`}
          accent={snap.health === "healthy" ? "#1B7A45" : "#B45309"}
        />
      </div>

      <section>
        <h3 className="text-base font-black text-[#163044] dark:text-[#F5F3EE]">User roles</h3>
        <p className="text-xs text-muted-foreground">Open a staff portal. The admin menu still reaches every tool.</p>
        <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
          {STAFF_ROLES.map((role) => {
            const counts = moduleCounts(role.id, access);
            const tone = TONE[role.id];
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => {
                  setSection("overview");
                  setPortal(role.id);
                }}
                className="rounded-2xl border border-[#163044]/8 bg-card p-3 text-left shadow-card transition hover:-translate-y-0.5 hover:shadow-soft dark:border-white/10"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="rounded-lg px-2 py-1 text-[11px] font-black" style={{ background: tone.chip, color: tone.ink }}>{role.code}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${role.access === "View only" ? "bg-[#F8EFD6] text-[#7A5A1E]" : "bg-[#E7F6EC] text-[#146C3A]"}`}>{role.access}</span>
                </div>
                <p className="mt-3 text-sm font-black sm:text-base">{role.name}</p>
                <p className="text-xs font-semibold text-muted-foreground">{counts.on} modules</p>
                <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-muted-foreground">{role.summary}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-[#163044]/8 bg-card p-4 shadow-card dark:border-white/10">
        <h3 className="text-base font-black">Permission matrix</h3>
        <p className="text-xs text-muted-foreground">Toggle what each staff portal can open. Super Admin keeps the full menu.</p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[36rem] border-separate border-spacing-y-1 text-left text-sm">
            <thead>
              <tr className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                <th className="px-2 py-2 font-bold">Permission</th>
                {STAFF_ROLES.map((role) => (
                  <th key={role.id} className="px-2 py-2 text-center font-black" style={{ color: TONE[role.id].ink }}>{role.code}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSION_ROWS.map((row, index) => (
                <tr key={row.id} className="bg-[#FBF8F1] dark:bg-white/5">
                  <td className="rounded-l-xl px-2 py-2.5 font-semibold">
                    <span className="mr-2 text-[11px] text-muted-foreground">{index + 1}</span>
                    {row.label}
                  </td>
                  {STAFF_ROLES.map((role) => {
                    const on = Boolean(access[role.id]?.[row.id]);
                    const selected = picked?.role === role.id && picked?.perm === row.id;
                    return (
                      <td key={role.id} className="px-2 py-1.5 text-center last:rounded-r-xl">
                        <button
                          type="button"
                          aria-pressed={on}
                          onClick={() => {
                            setPicked({ role: role.id, perm: row.id });
                            setPerm(role.id, row.id, !on);
                          }}
                          className={`inline-grid h-8 w-8 place-items-center rounded-full text-sm font-black ${on ? "bg-[#D9F5E3] text-[#1B7A45]" : "bg-[#F8D6D6] text-[#C04545]"} ${selected ? "ring-2 ring-[#163044] ring-offset-2 ring-offset-card dark:ring-offset-[#1A1E27]" : ""}`}
                        >
                          {on ? "✓" : "×"}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {hint ? <p className="mt-2 text-xs font-semibold text-[#B45309]">{hint}</p> : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <Action onClick={() => applyPicked(true)} tone="solid">Grant access</Action>
          <Action onClick={() => applyPicked(false)}>Revoke access</Action>
          <Action onClick={() => { if (onCreateUser) onCreateUser(); else onOpenTab?.("users"); }} tone="sand">Create account</Action>
          <Action onClick={() => onOpenTab?.("activity")}>Activity log</Action>
          <Action onClick={() => onOpenTab?.("verification")} tone="ink">Verification</Action>
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black">Staff accounts</h3>
            <p className="text-xs text-muted-foreground">Marketing, accounting, IT, and investor logins.</p>
          </div>
          <Action onClick={() => onCreateUser?.()} tone="sand">Create account</Action>
        </div>
        {users.filter((user) => user.staff_portal).length === 0 ? (
          <p className="rounded-2xl bg-card p-4 text-sm text-muted-foreground shadow-card">No staff logins yet.</p>
        ) : (
          <div className="grid gap-2 lg:grid-cols-2">
            {users.filter((user) => user.staff_portal).map((user) => (
              <div key={user.id} className="flex items-center justify-between gap-3 rounded-2xl bg-card px-3 py-3 shadow-card">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black">{user.full_name || "Staff"}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{user.email || "No email"}</p>
                </div>
                <span className="rounded-full bg-[#F6C453] px-2 py-1 text-[10px] font-black uppercase text-[#3F2E00]">{user.staff_portal}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-2 flex items-end justify-between gap-3">
          <div>
            <h3 className="text-base font-black">Active sessions</h3>
            <p className="text-xs text-muted-foreground">People seen in the app · {snap.sessions.length} recent</p>
          </div>
        </div>
        {snap.sessions.length === 0 ? (
          <p className="rounded-2xl bg-card p-4 text-sm text-muted-foreground shadow-card">No recent sessions yet.</p>
        ) : (
          <div className="grid gap-2 lg:grid-cols-2">
            {snap.sessions.map((user) => (
              <SessionRow key={user.id} user={user} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function RoleScreen({ role, snap, access, users, transactions = [], section, setSection, onBack, onOpen }) {
  const tone = TONE[role.id];
  const mods = ROLE_MODULES[role.id] || [];
  const allowed = (mod) => moduleAllowed(role.id, mod, access);
  const counts = moduleCounts(role.id, access);

  return (
    <div key={role.id} className="portal-role-enter space-y-4">
      {onBack ? (
        <button type="button" onClick={onBack} className="inline-flex items-center gap-1 text-sm font-bold text-[#163044] dark:text-[#F5F3EE]">
          <ChevronLeft className="h-4 w-4" />
          Super Admin
        </button>
      ) : null}
      <PortalBar
        kicker={`${role.name} portal`}
        title={role.access === "View only" ? "View only" : "Role access"}
        detail={role.summary}
        chip={role.code}
        chipStyle={{ background: tone.chip, color: tone.ink }}
      />

      {role.id === "marketing" ? (
        <MarketingView
          mods={mods}
          allowed={allowed}
          counts={counts}
          snap={snap}
          section={section}
          setSection={setSection}
          onOpen={onOpen}
          tone={tone}
        />
      ) : null}
      {role.id === "accounting" ? (
        <AccountingView
          mods={mods}
          allowed={allowed}
          counts={counts}
          snap={snap}
          transactions={transactions}
          section={section}
          setSection={setSection}
          onOpen={onOpen}
          tone={tone}
        />
      ) : null}
      {role.id === "it" ? (
        <ItView
          mods={mods}
          allowed={allowed}
          counts={counts}
          snap={snap}
          users={users}
          access={access}
          section={section}
          setSection={setSection}
          onOpen={onOpen}
          tone={tone}
        />
      ) : null}
      {role.id === "investor" ? (
        <InvestorView
          mods={mods}
          allowed={allowed}
          counts={counts}
          snap={snap}
          section={section}
          setSection={setSection}
          onOpen={onOpen}
          tone={tone}
        />
      ) : null}
    </div>
  );
}

function PortalTabs({ tabs, active, onChange, activeClass = "bg-[#F7F4EC] text-[#163044]" }) {
  return (
    <div className="portal-tabs flex gap-1 overflow-x-auto rounded-2xl bg-[#163044] p-1">
      {tabs.map((tab) => {
        const on = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`portal-tab shrink-0 rounded-xl px-3 py-2 text-xs font-black ${on ? `portal-tab-active ${activeClass}` : "text-[#F7F4EC]/75"}`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function PortalSection({ sectionKey, children, className = "space-y-4" }) {
  return (
    <div key={sectionKey} className={`portal-section-enter ${className}`.trim()}>
      {children}
    </div>
  );
}

function MarketingView({ mods, allowed, counts, snap, section, setSection, onOpen, tone }) {
  const [marketing, setMarketing] = useState(null);
  const categories = useMemo(
    () => applyMarketingToPortalCategories(snap.categories, marketing),
    [snap.categories, marketing]
  );

  useEffect(() => {
    let live = true;
    api.marketing.get().then((raw) => {
      if (live) setMarketing(raw);
    }).catch(() => {});
    return () => { live = false; };
  }, []);

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "modules", label: "Modules" },
    { id: "categories", label: "Categories" },
    { id: "content", label: "Content" },
  ];
  const active = tabs.some((tab) => tab.id === section) ? section : "overview";
  return (
    <div className="space-y-4">
      <PortalTabs tabs={tabs} active={active} onChange={setSection} />
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl px-4 py-3" style={{ background: tone.bg, color: tone.ink }}>
        <p className="text-sm font-black">Marketing role</p>
        <p className="text-xs font-bold">{counts.on} open · {counts.off} locked</p>
      </div>
      <PortalSection sectionKey={`marketing-${active}`}>
        {active === "overview" ? <CategoryGrid categories={categories} /> : null}
        {active === "categories" ? (
          <MarketingEditor mode="categories" onSaved={setMarketing} />
        ) : null}
        {active === "content" ? (
          <MarketingEditor mode="content" onSaved={setMarketing} />
        ) : null}
        {active === "modules" || active === "overview" ? (
          <ModuleGrid mods={mods} allowed={allowed} onOpen={onOpen} />
        ) : null}
      </PortalSection>
    </div>
  );
}

function AccountingView({ mods, allowed, counts, snap, transactions = [], section, setSection, onOpen, tone }) {
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "formula", label: "Pricing" },
    { id: "categories", label: "Value" },
    { id: "ledger", label: "Ledger" },
    { id: "modules", label: "Modules" },
  ];
  const active = tabs.some((tab) => tab.id === section) ? section : "overview";
  const fees = useMemo(
    () => (transactions || []).filter((row) => row.kind === "posting_fee"),
    [transactions]
  );

  return (
    <div className="space-y-4">
      <PortalTabs tabs={tabs} active={active} onChange={setSection} activeClass="bg-[#B7E4C7] text-[#146C3A]" />
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl px-4 py-3" style={{ background: tone.bg, color: tone.ink }}>
        <p className="text-sm font-black">Accounting role</p>
        <p className="text-xs font-bold">{counts.on} open · {counts.off} locked</p>
      </div>
      <PortalSection sectionKey={`accounting-${active}`}>
        {active === "overview" ? <AccountingOverview snap={snap} fees={fees} onOpenSection={setSection} /> : null}
        {active === "formula" ? <AccountingFormula snap={snap} /> : null}
        {active === "categories" ? <AccountingCategories snap={snap} /> : null}
        {active === "ledger" ? <AccountingLedger snap={snap} fees={fees} onOpen={onOpen} mods={mods} /> : null}
        {active === "modules" ? <ModuleGrid mods={mods} allowed={allowed} onOpen={onOpen} /> : null}
        {active === "overview" ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {mods.filter(allowed).slice(0, 4).map((mod) => (
              <button key={mod.id} type="button" onClick={() => onOpen(mod)} className="rounded-2xl bg-card p-3 text-left shadow-card">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-black">{mod.title}</p>
                  <span className="rounded-full bg-[#E7F6EC] px-2 py-0.5 text-[10px] font-black uppercase text-[#146C3A]">Open</span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">{mod.detail}</p>
              </button>
            ))}
          </div>
        ) : null}
      </PortalSection>
    </div>
  );
}

function AccountingOverview({ snap, fees, onOpenSection }) {
  const growth = Number(snap.dash.feeGrowth || 0);
  const maxFee = Math.max(...snap.dash.months.map((month) => month.fees), 1);
  const feeCount = fees.length;
  const avgFee = feeCount ? (Number(snap.dash.postingFees) || 0) / feeCount : 0;
  const lastMonth = Number(snap.dash.feesLastMonth || 0);

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-[1.75rem] bg-[#163044] text-[#F7F4EC]">
        <div className="relative px-5 py-5 sm:px-6 sm:py-6">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-[#2F8F5B]/35 blur-2xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-0 left-1/3 h-24 w-48 rounded-full bg-[#B7E4C7]/15 blur-2xl"
          />
          <div className="relative flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">Collected this month</p>
              <p className="mt-1 text-4xl font-black tabular-nums tracking-tight sm:text-5xl">{formatPHP(snap.dash.feesThisMonth)}</p>
              <p className="mt-2 text-sm font-semibold text-[#B7E4C7]">
                {growth >= 0 ? "+" : ""}{growth.toFixed(0)}% vs last month · {formatPHP(lastMonth)} prior
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpenSection("ledger")}
              className="rounded-full bg-[#B7E4C7] px-4 py-2 text-xs font-black text-[#146C3A]"
            >
              Open ledger
            </button>
          </div>
          <div className="relative mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <HeroMini label="All-time fees" value={formatPHP(snap.dash.postingFees)} />
            <HeroMini label="Task value" value={formatPHP(snap.gmv)} />
            <HeroMini label="Avg fee" value={formatPHP(avgFee)} />
            <HeroMini label="Fee records" value={String(feeCount)} />
          </div>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <Mini label="Open gawain" value={String(snap.openTasks)} />
        <Mini label="Fees last month" value={formatPHP(lastMonth)} />
        <Mini label="Marketplace posts" value={String(snap.dash.tasks || 0)} />
      </div>

      <div className="rounded-[1.5rem] bg-card p-4 shadow-card sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-black">Monthly posting fees</h3>
            <p className="text-[11px] text-muted-foreground">Last 6 months · from recorded fees</p>
          </div>
          <button type="button" onClick={() => onOpenSection("formula")} className="text-xs font-black text-[#146C3A]">
            Pricing rules →
          </button>
        </div>
        <div className="mt-4 flex h-32 items-end gap-2">
          {snap.dash.months.map((month) => (
            <div key={month.key} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[10px] font-bold tabular-nums text-muted-foreground">
                {month.fees > 0 ? formatPHP(month.fees) : "—"}
              </span>
              <div
                className="w-full rounded-t-lg bg-gradient-to-t from-[#163044] to-[#2F8F5B]"
                style={{ height: `${Math.max(10, (month.fees / maxFee) * 100)}%` }}
              />
              <span className="text-[10px] font-bold text-muted-foreground">{month.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-[#B7E4C7]/60 bg-[#E7F6EC]/70 p-4 dark:border-[#2F8F5B]/40 dark:bg-[#143028]/80">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#146C3A] dark:text-[#B7E4C7]">Live formula</p>
            <p className="mt-1 text-sm font-black text-[#163044] dark:text-[#F5F3EE]">2% of budget · min ₱1 · escrow share 20%</p>
          </div>
          <button type="button" onClick={() => onOpenSection("formula")} className="rounded-full bg-[#146C3A] px-3 py-1.5 text-[10px] font-black uppercase text-[#F7F4EC]">
            Details
          </button>
        </div>
      </div>
    </div>
  );
}

function AccountingFormula({ snap }) {
  const exampleBudget = 1000;
  const exampleFee = Math.max(1, Math.round(exampleBudget * 0.02));
  const exampleEscrow = Math.round(exampleBudget * 0.2);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-black">Pricing formula</h3>
        <p className="text-xs text-muted-foreground">Rules applied when a gawain is posted or escrow is used.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <FormulaCard
          kicker="Posting fee"
          value="2%"
          detail="Of the task budget, charged when a poster publishes a gawain."
          accent="#146C3A"
          soft="#E7F6EC"
        />
        <FormulaCard
          kicker="Minimum"
          value="₱1"
          detail="Floor for every posting fee — small budgets still contribute."
          accent="#8A5A12"
          soft="#F8EBD4"
        />
        <FormulaCard
          kicker="Escrow share"
          value="20%"
          detail="Platform share when a job locks funds in escrow."
          accent="#1E4E8C"
          soft="#E7F0FF"
        />
      </div>

      <div className="rounded-[1.5rem] bg-card p-4 shadow-card sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-black">Worked example</h3>
          <span className="rounded-full bg-[#E7F6EC] px-2.5 py-1 text-[10px] font-black uppercase text-[#146C3A]">Active</span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Budget <span className="font-black text-foreground">{formatPHP(exampleBudget)}</span>
          {" → "}posting fee <span className="font-black text-[#146C3A]">{formatPHP(exampleFee)}</span>
          {" · "}escrow platform share <span className="font-black text-[#1E4E8C]">{formatPHP(exampleEscrow)}</span>
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Mini label="Live task value" value={formatPHP(snap.gmv)} />
          <Mini label="Fees this month" value={formatPHP(snap.dash.feesThisMonth)} />
          <Mini label="Open gawain" value={String(snap.openTasks)} />
        </div>
      </div>

      <div className="rounded-[1.5rem] bg-[#163044] p-4 text-[#F7F4EC] sm:p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/50">How fees update</p>
        <ul className="mt-3 space-y-2 text-sm font-semibold text-white/85">
          <li>Posting fee is recorded when a gawain is published.</li>
          <li>Monthly totals roll from those fee records — not estimates.</li>
          <li>Escrow share applies only when a job uses escrow payout.</li>
        </ul>
      </div>
    </div>
  );
}

function AccountingCategories({ snap }) {
  const total = snap.gmv || 1;
  const ranked = [...snap.categories].sort((a, b) => b.value - a.value);
  const maxValue = Math.max(...ranked.map((cat) => cat.value), 1);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="text-lg font-black">Task value by category</h3>
          <p className="text-xs text-muted-foreground">Budgets on live posted gawain · {formatPHP(snap.gmv)} total</p>
        </div>
        <p className="text-xs font-black text-[#146C3A]">{snap.categories.length} categories</p>
      </div>

      <div className="overflow-hidden rounded-[1.5rem] bg-card p-4 shadow-card sm:p-5">
        <div className="mb-4 flex h-3 overflow-hidden rounded-full bg-[#EDE6D6] dark:bg-white/10">
          {ranked.map((cat, index) => (
            <div
              key={cat.key}
              title={`${cat.short}: ${formatPHP(cat.value)}`}
              style={{ width: `${(cat.value / total) * 100}%`, background: CAT_COLORS[index % CAT_COLORS.length] }}
            />
          ))}
        </div>
        <ul className="space-y-3">
          {ranked.map((cat, index) => {
            const look = CAT_LOOK[cat.key] || CAT_LOOK.other;
            const Icon = look.Icon;
            const pct = Math.round((cat.value / total) * 100);
            return (
              <li key={cat.key} className="flex items-center gap-3">
                <span
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
                  style={{ background: look.bg, color: look.color }}
                >
                  <Icon className="h-5 w-5" color={look.color} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-sm font-black">{cat.short}</p>
                    <p className="shrink-0 text-sm font-black tabular-nums">{formatPHP(cat.value)}</p>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#EDE6D6] dark:bg-white/10">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(4, (cat.value / maxValue) * 100)}%`,
                        background: CAT_COLORS[index % CAT_COLORS.length],
                      }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">{cat.tasks} posted · {pct}% of value</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function AccountingLedger({ snap, fees, onOpen, mods }) {
  const growth = Number(snap.dash.feeGrowth || 0);
  const total = fees.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const average = fees.length ? total / fees.length : 0;
  const recent = fees.slice(0, 12);
  const txMod = mods.find((mod) => mod.id === "tx");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="text-lg font-black">Fee ledger</h3>
          <p className="text-xs text-muted-foreground">Posting fees recorded when gawain go live.</p>
        </div>
        {txMod ? (
          <button type="button" onClick={() => onOpen(txMod)} className="rounded-full bg-[#163044] px-3.5 py-2 text-xs font-black text-[#F7F4EC]">
            Full payments
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-2xl bg-[#163044] p-3 text-[#F7F4EC]">
          <p className="text-[10px] font-bold uppercase tracking-wide text-white/55">Records</p>
          <p className="mt-1 text-xl font-black tabular-nums">{fees.length}</p>
        </div>
        <div className="rounded-2xl bg-[#E7F6EC] p-3 text-[#146C3A] dark:bg-[#143028] dark:text-[#B7E4C7]">
          <p className="text-[10px] font-bold uppercase tracking-wide opacity-80">Total</p>
          <p className="mt-1 text-xl font-black tabular-nums">{formatPHP(total || snap.dash.postingFees)}</p>
        </div>
        <Mini label="Average" value={formatPHP(average)} />
        <Mini label="This month" value={formatPHP(snap.dash.feesThisMonth)} />
      </div>

      <div className="rounded-[1.5rem] bg-[#E7F6EC] p-4 dark:bg-[#143028]">
        <p className="text-[11px] font-bold uppercase tracking-wide text-[#146C3A] dark:text-[#B7E4C7]">Month vs prior</p>
        <p className="mt-1 text-2xl font-black tabular-nums text-[#163044] dark:text-[#F5F3EE]">
          {growth >= 0 ? "+" : ""}{growth.toFixed(0)}%
        </p>
        <p className="text-xs font-semibold text-[#146C3A] dark:text-[#B7E4C7]">
          {formatPHP(snap.dash.feesThisMonth)} now · {formatPHP(snap.dash.feesLastMonth || 0)} last month
        </p>
      </div>

      <div className="overflow-hidden rounded-[1.5rem] bg-card shadow-card">
        <div className="flex items-center justify-between gap-2 border-b border-[#163044]/8 px-4 py-3 dark:border-white/10">
          <h3 className="text-sm font-black">Recent posting fees</h3>
          <span className="text-[11px] font-bold text-muted-foreground">{recent.length} shown</span>
        </div>
        {recent.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">No posting fees recorded yet.</p>
        ) : (
          <ul className="divide-y divide-[#163044]/8 dark:divide-white/10">
            {recent.map((row) => (
              <li key={row.id} className="flex items-center gap-3 px-4 py-3">
                <span className="h-2 w-2 shrink-0 rounded-full bg-[#2F8F5B]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black">{row.from || "Poster"}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {row.created_at ? new Date(row.created_at).toLocaleString() : "—"}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-black tabular-nums text-[#146C3A]">{formatPHP(row.amount)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function FormulaCard({ kicker, value, detail, accent, soft }) {
  return (
    <div className="rounded-[1.5rem] p-4" style={{ background: soft, color: accent }}>
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] opacity-80">{kicker}</p>
      <p className="mt-2 text-4xl font-black tracking-tight">{value}</p>
      <p className="mt-2 text-xs font-semibold opacity-80">{detail}</p>
    </div>
  );
}

function HeroMini({ label, value }) {
  return (
    <div className="rounded-2xl bg-white/10 px-3 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-wide text-white/55">{label}</p>
      <p className="mt-0.5 text-sm font-black tabular-nums sm:text-base">{value}</p>
    </div>
  );
}

function ItView({ mods, allowed, counts, snap, users, access, section, setSection, onOpen, tone }) {
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "users", label: "Users" },
    { id: "access", label: "Access" },
    { id: "modules", label: "Modules" },
  ];
  const active = tabs.some((tab) => tab.id === section) ? section : "overview";
  const rows = users.slice(0, 8);

  return (
    <div className="space-y-4">
      <PortalTabs tabs={tabs} active={active} onChange={setSection} activeClass="bg-[#C9DBFF] text-[#1E4E8C]" />
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl px-4 py-3" style={{ background: tone.bg, color: tone.ink }}>
        <p className="text-sm font-black">IT role</p>
        <p className="text-xs font-bold">{counts.on} open · {counts.off} locked</p>
      </div>
      <PortalSection sectionKey={`it-${active}`}>
        {active === "overview" || active === "users" ? (
          <>
            {active === "overview" ? (
              <>
                <div>
                  <h3 className="text-lg font-black">IT dashboard</h3>
                  <p className="text-xs text-muted-foreground">Accounts, sessions, and the staff access map.</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Mini label="Total users" value={String(snap.people)} />
                  <Mini label="Active now" value={String(snap.activeNow)} />
                  <Mini label="Health" value={snap.health === "healthy" ? "Healthy" : "Review"} />
                </div>
              </>
            ) : null}
            <div className="overflow-x-auto rounded-[1.5rem] bg-card p-4 shadow-card">
              <h3 className="text-sm font-black">Users</h3>
              <table className="mt-2 w-full min-w-[32rem] text-left text-sm">
                <thead>
                  <tr className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    <th className="py-2">User</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Last active</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((user) => (
                    <tr key={user.id} className="border-t border-[#163044]/8 dark:border-white/10">
                      <td className="py-2.5 pr-3">
                        <p className="font-bold">{user.full_name || "Account"}</p>
                        <p className="text-[11px] text-muted-foreground">{user.email || user.location_area || "—"}</p>
                      </td>
                      <td className="capitalize">{user.role || "poster"}</td>
                      <td>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${user.status === "suspended" ? "bg-[#F8D6D6] text-[#C04545]" : "bg-[#E7F6EC] text-[#146C3A]"}`}>
                          {user.status === "suspended" ? "Suspended" : "Active"}
                        </span>
                      </td>
                      <td className="text-xs text-muted-foreground">{user.last_seen_at ? timeAgo(user.last_seen_at) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length === 0 ? <p className="text-sm text-muted-foreground">No users yet.</p> : null}
            </div>
          </>
        ) : null}
        {active === "access" || active === "overview" ? (
          <div className="rounded-[1.5rem] bg-card p-4 shadow-card">
            <h3 className="text-sm font-black">Staff access · IT view</h3>
            <ul className="mt-2 space-y-1.5">
              {PERMISSION_ROWS.map((row) => (
                <li key={row.id} className="flex items-center justify-between gap-2 rounded-xl bg-[#FBF8F1] px-3 py-2 text-xs dark:bg-white/5">
                  <span className="font-semibold">{row.label}</span>
                  <span className="flex gap-1">
                    {STAFF_ROLES.map((role) => (
                      <span key={role.id} className={`rounded-md px-1.5 py-0.5 font-black ${access[role.id]?.[row.id] ? "bg-[#D9F5E3] text-[#1B7A45]" : "bg-[#F3EFE6] text-[#B0A89A] dark:bg-white/10"}`}>
                        {role.code}
                      </span>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {active === "modules" ? <ModuleGrid mods={mods} allowed={allowed} onOpen={onOpen} /> : null}
      </PortalSection>
    </div>
  );
}

function InvestorView({ mods, allowed, counts, snap, section, setSection, onOpen, tone }) {
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "growth", label: "Growth" },
    { id: "categories", label: "Categories" },
    { id: "modules", label: "Modules" },
  ];
  const active = tabs.some((tab) => tab.id === section) ? section : "overview";
  const maxFee = Math.max(...snap.dash.months.map((month) => month.fees), 1);
  const totalCat = snap.categories.reduce((sum, cat) => sum + cat.value, 0) || 1;
  const growth = snap.dash.feeGrowth || 0;

  return (
    <div className="space-y-4">
      <PortalTabs tabs={tabs} active={active} onChange={setSection} activeClass="bg-[#E6D3A1] text-[#7A5A1E]" />
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl px-4 py-3" style={{ background: tone.bg, color: tone.ink }}>
        <p className="text-sm font-black">Investor role</p>
        <p className="text-xs font-bold">{counts.on} open · {counts.off} locked · read only</p>
      </div>
      <PortalSection sectionKey={`investor-${active}`}>
        {active === "overview" ? (
          <>
            <div>
              <h3 className="text-lg font-black">Investor dashboard</h3>
              <p className="text-xs text-muted-foreground">Read only · posting fees and marketplace value</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-[#163044] p-4 text-[#F7F4EC]">
                <p className="text-[10px] font-bold uppercase tracking-wide text-white/60">Fees collected</p>
                <p className="mt-1 text-2xl font-black tabular-nums">{formatPHP(snap.dash.postingFees)}</p>
                <p className="text-[11px] text-[#E6D3A1]">{growth >= 0 ? "+" : ""}{growth.toFixed(0)}% this month</p>
              </div>
              <Mini label="Task value" value={formatPHP(snap.gmv)} />
              <Mini label="Open gawain" value={String(snap.openTasks)} />
              <Mini label="Active users" value={String(snap.activeNow)} />
            </div>
            <Link href="/browse" className="flex items-center justify-between rounded-2xl bg-[#F7F1E4] px-4 py-3 text-sm font-black dark:bg-white/5">
              <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" /> Open the live map</span>
              <span className="text-xs font-bold text-muted-foreground">{snap.openTasks} open</span>
            </Link>
          </>
        ) : null}
        {active === "growth" ? (
          <div className="rounded-[1.5rem] bg-card p-4 shadow-card">
            <h3 className="text-sm font-black">Monthly posting fees</h3>
            <div className="mt-4 flex h-28 items-end gap-2">
              {snap.dash.months.map((month) => (
                <div key={month.key} className="flex flex-1 flex-col items-center gap-1">
                  <div className="w-full rounded-t-lg bg-[#163044] dark:bg-[#E6D3A1]" style={{ height: `${Math.max(8, (month.fees / maxFee) * 100)}%` }} />
                  <span className="text-[10px] font-bold text-muted-foreground">{month.label}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {active === "categories" ? (
          <div className="rounded-[1.5rem] bg-card p-4 shadow-card">
            <h3 className="text-sm font-black">Value by category</h3>
            <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-[#EDE6D6] dark:bg-white/10">
              {snap.categories.map((cat, index) => (
                <div key={cat.key} style={{ width: `${(cat.value / totalCat) * 100}%`, background: CAT_COLORS[index % CAT_COLORS.length] }} />
              ))}
            </div>
            <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1">
              {snap.categories.map((cat, index) => (
                <li key={cat.key} className="flex items-center gap-2 text-[11px]">
                  <span className="h-2 w-2 rounded-full" style={{ background: CAT_COLORS[index % CAT_COLORS.length] }} />
                  <span className="font-semibold">{cat.short}</span>
                  <span className="ml-auto tabular-nums text-muted-foreground">{Math.round((cat.value / totalCat) * 100)}%</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {active === "modules" ? <ModuleGrid mods={mods} allowed={allowed} onOpen={onOpen} /> : null}
      </PortalSection>
    </div>
  );
}

function CategoryGrid({ categories }) {
  return (
    <div>
      <h3 className="text-sm font-black">Categories · 8 on the marketplace</h3>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {categories.map((cat) => {
          const look = CAT_LOOK[cat.key] || CAT_LOOK.other;
          const Icon = look.Icon;
          return (
            <div
              key={cat.key}
              className="rounded-2xl border border-transparent px-3 py-3 shadow-card dark:border-white/10"
              style={{ background: look.bg }}
            >
              <span
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 shadow-sm dark:bg-black/20"
                style={{ color: look.color }}
              >
                <Icon className="h-5 w-5" color={look.color} />
              </span>
              <p className="mt-2.5 text-sm font-black" style={{ color: look.color }}>{cat.short}</p>
              <p className="mt-0.5 text-[11px] font-semibold opacity-70" style={{ color: look.color }}>
                {cat.tasks} {cat.tasks === 1 ? "task" : "tasks"}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ModuleGrid({ mods, allowed, onOpen }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {mods.map((mod) => {
        const on = allowed(mod);
        if (!on) {
          return (
            <div key={mod.id} className="rounded-2xl bg-[#E7E2D6] p-3 text-[#6B6558] dark:bg-[#2A303C] dark:text-[#94A3B8]">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-black">{mod.title}</p>
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase"><Lock className="h-3.5 w-3.5" /> Locked</span>
              </div>
              <p className="mt-1 text-[11px]">No access</p>
            </div>
          );
        }
        return (
          <button key={mod.id} type="button" onClick={() => onOpen(mod)} className="rounded-2xl bg-card p-3 text-left shadow-card">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-black">{mod.title}</p>
              <span className="rounded-full bg-[#E7F6EC] px-2 py-0.5 text-[10px] font-black uppercase text-[#146C3A]">{mod.tone === "view" ? "View" : "Edit"}</span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">{mod.detail}</p>
          </button>
        );
      })}
    </div>
  );
}

function openModule(mod, { onOpenTab, setSection, router, allowLeave = true }) {
  if (!allowLeave) {
    if (mod.section) setSection(mod.section);
    return;
  }
  if (mod.href) {
    router?.push(mod.href);
    return;
  }
  if (mod.tab) onOpenTab?.(mod.tab);
  else if (mod.section) setSection(mod.section);
}

function PortalBar({ kicker, title, detail, chip, chipStyle }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[1.35rem] bg-[#163044] px-4 py-3 text-[#F7F4EC]">
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">{kicker}</p>
        <p className="truncate text-sm font-black">{title}</p>
        <p className="truncate text-[11px] text-white/65">{detail}</p>
      </div>
      <span className="shrink-0 rounded-full px-3 py-1 text-xs font-black" style={chipStyle}>{chip}</span>
    </div>
  );
}

function StatCard({ label, value, hint, accent }) {
  return (
    <div className="rounded-[1.35rem] border border-[#163044]/8 bg-card p-4 shadow-card dark:border-white/10">
      <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-black tabular-nums" style={accent ? { color: accent } : undefined}>{value}</p>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function Mini({ label, value }) {
  return (
    <div className="rounded-2xl bg-[#F7F1E4] p-3 dark:bg-white/5">
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-black tabular-nums">{value}</p>
    </div>
  );
}

function Action({ children, onClick, tone = "line" }) {
  const cls = tone === "sand"
    ? "bg-[#F6C453] text-[#3F2E00]"
    : tone === "ink"
      ? "bg-[#163044] text-[#F7F4EC]"
      : tone === "solid"
        ? "bg-card text-[#163044] shadow-card dark:text-[#F5F3EE]"
        : "border border-[#163044]/15 bg-transparent text-[#163044] dark:border-white/15 dark:text-[#F5F3EE]";
  return (
    <button type="button" onClick={onClick} className={`rounded-full px-3.5 py-2 text-xs font-black ${cls}`}>{children}</button>
  );
}

function SessionRow({ user }) {
  const fresh = user.last_seen_at && Date.now() - new Date(user.last_seen_at).getTime() < 15 * 60 * 1000;
  const letter = String(user.full_name || "?").slice(0, 1).toUpperCase();
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-card px-3 py-3 shadow-card">
      {user.avatar_url ? (
        <img src={user.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
      ) : (
        <span className="grid h-10 w-10 place-items-center rounded-full bg-[#163044] text-sm font-black text-[#F7F4EC]">{letter}</span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black">{user.full_name || "Account"}</p>
        <p className="truncate text-[11px] text-muted-foreground">{user.email || user.location_area || user.role}</p>
      </div>
      <div className="text-right">
        <span className="rounded-full bg-[#F7F1E4] px-2 py-0.5 text-[10px] font-black capitalize dark:bg-white/10">{user.role || "user"}</span>
        <p className="mt-1 text-[10px] font-semibold text-muted-foreground">{fresh ? "Online now" : timeAgo(user.last_seen_at)}</p>
      </div>
    </div>
  );
}
