import { SERVICE_CATEGORIES } from "@/lib/khaki";
import { buildAdminDashboard } from "@/lib/adminDashboard";

export const STAFF_ROLES = [
  { id: "marketing", code: "MK", name: "Marketing", access: "Active", summary: "Categories, map pins, and the homepage" },
  { id: "accounting", code: "AC", name: "Accounting", access: "Active", summary: "Posting fees, payouts, and task value" },
  { id: "it", code: "IT", name: "IT", access: "Active", summary: "Users, verification, teams, and logs" },
  { id: "investor", code: "INV", name: "Investor", access: "View only", summary: "Revenue and marketplace, read only" },
];

export const PERMISSION_ROWS = [
  { id: "categories", label: "Category manager" },
  { id: "map", label: "Map pins" },
  { id: "promos", label: "Promos & landing" },
  { id: "pricing", label: "Pricing rules" },
  { id: "financials", label: "Financials" },
  { id: "payouts", label: "Payouts" },
  { id: "users", label: "User management" },
  { id: "logs", label: "System logs" },
  { id: "metrics", label: "Investor metrics" },
];

export const DEFAULT_ACCESS = {
  marketing: { categories: true, map: true, promos: true, pricing: false, financials: false, payouts: false, users: false, logs: false, metrics: false },
  accounting: { categories: false, map: false, promos: false, pricing: true, financials: true, payouts: true, users: false, logs: false, metrics: false },
  it: { categories: false, map: false, promos: false, pricing: false, financials: false, payouts: false, users: true, logs: true, metrics: false },
  investor: { categories: true, map: true, promos: false, pricing: false, financials: true, payouts: false, users: false, logs: false, metrics: true },
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

export const ROLE_MODULES = {
  marketing: [
    { id: "categories", perm: "categories", title: "Category manager", detail: "Names and groups customers browse", tone: "edit" },
    { id: "map", perm: "map", title: "Map pins", detail: "Open gawain on the browse map", tone: "edit", href: "/browse" },
    { id: "promos", perm: "promos", title: "Promos & banners", detail: "Homepage category row", tone: "edit", section: "categories" },
    { id: "content", perm: "promos", title: "Landing content", detail: "Short blurbs beside each category", tone: "edit", section: "content" },
    { id: "pricing", perm: "pricing", title: "Pricing rules", detail: "Posting fee and escrow split", tone: "edit", tab: "transactions" },
    { id: "financials", perm: "financials", title: "Task financials", detail: "Budgets and collected fees", tone: "edit", tab: "transactions" },
    { id: "payouts", perm: "payouts", title: "Payouts & reports", detail: "Payments and open reports", tone: "edit", tab: "transactions" },
    { id: "platform", perm: "pricing", title: "Platform fee", detail: "2% of each posted budget", tone: "edit", tab: "transactions" },
  ],
  accounting: [
    { id: "pricing", perm: "pricing", title: "Pricing rules", detail: "2% posting fee, ₱1 minimum", tone: "edit", section: "formula" },
    { id: "financials", perm: "financials", title: "Task financials", detail: "Budgets by category", tone: "edit", section: "categories" },
    { id: "payouts", perm: "payouts", title: "Payouts & reports", detail: "Escrow and posting fees", tone: "edit", section: "ledger", tab: "transactions" },
    { id: "platform", perm: "pricing", title: "Platform fee settings", detail: "Fee stays at 2% of budget", tone: "edit", section: "formula" },
    { id: "tx", perm: "financials", title: "Transactions", detail: "Every recorded posting fee", tone: "edit", section: "ledger", tab: "transactions" },
    { id: "categories", perm: "categories", title: "Category manager", detail: "Marketing", tone: "edit" },
    { id: "map", perm: "map", title: "Map pins", detail: "Marketing", tone: "edit" },
    { id: "promos", perm: "promos", title: "Promos & banners", detail: "Marketing", tone: "edit" },
  ],
  it: [
    { id: "users", perm: "users", title: "User management", detail: "Suspend, restore, or remove accounts", tone: "edit", section: "users", tab: "users" },
    { id: "roles", perm: "users", title: "Role & permissions", detail: "Poster, tasker, and admin", tone: "edit", section: "access", tab: "users" },
    { id: "logs", perm: "logs", title: "System logs", detail: "Who changed what", tone: "edit", section: "overview", tab: "activity" },
    { id: "verify", perm: "users", title: "Verification queue", detail: "ID applications waiting", tone: "edit", section: "users", tab: "verification" },
    { id: "teams", perm: "users", title: "Teams", detail: "Tasker teams", tone: "edit", section: "users", tab: "teams" },
    { id: "pricing", perm: "pricing", title: "Pricing rules", detail: "Accounting", tone: "view" },
    { id: "categories", perm: "categories", title: "Category manager", detail: "Marketing", tone: "view" },
    { id: "promos", perm: "promos", title: "Promos & banners", detail: "Marketing", tone: "view" },
    { id: "payouts", perm: "payouts", title: "Payouts & financials", detail: "Accounting", tone: "view" },
  ],
  investor: [
    { id: "metrics", perm: "metrics", title: "Financial overview", detail: "Fees collected and task value", tone: "view", section: "overview" },
    { id: "growth", perm: "metrics", title: "Growth", detail: "Posting fees by month", tone: "view", section: "growth" },
    { id: "volume", perm: "metrics", title: "Task volume", detail: "Open and finished gawain", tone: "view", section: "overview" },
    { id: "cats", perm: "categories", title: "Category performance", detail: "Where the work sits", tone: "view", section: "categories" },
    { id: "map", perm: "map", title: "Market map", detail: "Live pins on browse", tone: "view", href: "/browse" },
    { id: "pricing", perm: "pricing", title: "Pricing rules", detail: "No edit", tone: "view" },
    { id: "users", perm: "users", title: "User management", detail: "No access", tone: "view" },
    { id: "promos", perm: "promos", title: "Marketing editor", detail: "No access", tone: "view" },
  ],
};

export function cloneAccess(source = DEFAULT_ACCESS) {
  return JSON.parse(JSON.stringify(source));
}

export function moduleAllowed(roleId, mod, access) {
  return Boolean(access?.[roleId]?.[mod.perm]);
}

export function moduleCounts(roleId, access) {
  const mods = ROLE_MODULES[roleId] || [];
  const on = mods.filter((mod) => moduleAllowed(roleId, mod, access)).length;
  return { on, off: mods.length - on, total: mods.length };
}

function categoryOf(raw) {
  const value = String(raw || "");
  return SERVICE_CATEGORIES.find((cat) => cat.title === value || cat.enumValue === value || (cat.match || []).includes(value)) || null;
}

export function buildPortalSnapshot({ overview = {}, users = [], logs = [], transactions = [] } = {}) {
  const dash = buildAdminDashboard({ overview, users, logs, transactions });
  const now = Date.now();
  const tasks = overview.taskRows || [];
  const activeNow = users.filter((user) => {
    const seen = new Date(user.last_seen_at || 0).getTime();
    return seen && now - seen < 15 * 60 * 1000;
  }).length;
  const sessions = [...users]
    .filter((user) => user.last_seen_at)
    .sort((a, b) => new Date(b.last_seen_at) - new Date(a.last_seen_at))
    .slice(0, 6);
  const categories = SERVICE_CATEGORIES.map((cat) => ({
    key: cat.key,
    title: cat.title,
    short: SHORT[cat.key] || cat.title,
    desc: cat.desc,
    tasks: 0,
    value: 0,
  }));
  const byKey = Object.fromEntries(categories.map((cat) => [cat.key, cat]));
  tasks.forEach((task) => {
    const match = categoryOf(task.category);
    const row = byKey[match?.key || "other"];
    if (!row) return;
    row.tasks += 1;
    row.value += Number(task.budget_php || 0);
  });
  const gmv = tasks.reduce((sum, task) => sum + Number(task.budget_php || 0), 0);
  const waiting = Number(dash.pendingVerifications || 0) + Number(overview.pendingReports || 0);
  return {
    dash,
    people: users.length || dash.users,
    activeNow,
    sessions,
    categories,
    gmv,
    openTasks: dash.openTasks,
    waiting,
    logs: (logs || []).slice(0, 5),
    health: waiting > 0 ? "review" : "healthy",
  };
}
