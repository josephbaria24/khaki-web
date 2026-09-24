const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const CHART_COLORS = {
  olive: "#163044",
  oliveMid: "#3E7498",
  sand: "#C4B07A",
  moss: "#8BA8B8",
  sage: "#C9D6E0",
  amber: "#C9893A",
  green: "#4F8A72",
  red: "#C45C4A",
  cream: "#F7F4EC",
  ink: "#2A3F4D",
};

const STATUS_COLORS = {
  open: "#4F8A72",
  offer_accepted: "#C9893A",
  escrow_locked: "#3E7498",
  in_progress: "#C4B07A",
  completed_pending_review: "#8BA8B8",
  disputed: "#C45C4A",
  released: "#163044",
  cancelled: "#9A9488",
};

function asDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dayKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function monthKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}`;
}

export function shortCategory(name) {
  if (!name) return "Other";
  const cut = String(name).split("(")[0].trim();
  return cut.length > 18 ? `${cut.slice(0, 16)}…` : cut;
}

export function statusLabel(status) {
  return String(status || "unknown").replaceAll("_", " ");
}

export function buildAdminDashboard({ overview = {}, users = [], logs = [], transactions = [] } = {}) {
  const tasks = overview.taskRows || [];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const days = [];
  for (let i = 13; i >= 0; i -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    days.push({
      key: dayKey(date),
      label: String(date.getDate()),
      weekday: ["S", "M", "T", "W", "T", "F", "S"][date.getDay()],
      users: 0,
      tasks: 0,
      fees: 0,
    });
  }
  const dayMap = Object.fromEntries(days.map((day) => [day.key, day]));

  const months = [];
  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: monthKey(date), label: MONTHS[date.getMonth()], fees: 0, tasks: 0 });
  }
  const monthMap = Object.fromEntries(months.map((month) => [month.key, month]));

  users.forEach((user) => {
    const date = asDate(user.created_at);
    if (!date) return;
    const bucket = dayMap[dayKey(date)];
    if (bucket) bucket.users += 1;
  });

  tasks.forEach((task) => {
    const date = asDate(task.created_at);
    if (!date) return;
    const day = dayMap[dayKey(date)];
    if (day) day.tasks += 1;
    const month = monthMap[monthKey(date)];
    if (month) month.tasks += 1;
  });

  const fees = transactions.filter((row) => row.kind === "posting_fee");
  fees.forEach((row) => {
    const date = asDate(row.created_at);
    if (!date) return;
    const amount = Number(row.amount || 0);
    const day = dayMap[dayKey(date)];
    if (day) day.fees += amount;
    const month = monthMap[monthKey(date)];
    if (month) month.fees += amount;
  });

  const thisMonthKey = monthKey(now);
  const lastMonthKey = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const feesThisMonth = monthMap[thisMonthKey]?.fees || 0;
  const feesLastMonth = monthMap[lastMonthKey]?.fees || 0;
  const feeGrowth = feesLastMonth > 0
    ? ((feesThisMonth - feesLastMonth) / feesLastMonth) * 100
    : (feesThisMonth > 0 ? 100 : 0);

  const verification = [
    { key: "verified", label: "Verified", value: users.filter((user) => user.verification_status === "verified").length, color: CHART_COLORS.green },
    { key: "pending", label: "Pending", value: users.filter((user) => user.verification_status === "pending").length, color: CHART_COLORS.amber },
    { key: "unverified", label: "Unverified", value: users.filter((user) => user.verification_status !== "verified" && user.verification_status !== "pending").length, color: CHART_COLORS.moss },
  ];

  const roles = [
    { key: "poster", label: "Poster", value: users.filter((user) => user.role === "poster").length, color: CHART_COLORS.olive },
    { key: "tasker", label: "Tasker", value: users.filter((user) => user.role === "tasker").length, color: CHART_COLORS.sand },
    { key: "admin", label: "Admin", value: users.filter((user) => user.role === "admin").length, color: CHART_COLORS.moss },
  ];

  const statusCounts = {};
  tasks.forEach((task) => {
    const status = task.status || "open";
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });
  const taskStatus = Object.keys(STATUS_COLORS)
    .map((key) => ({
      key,
      label: statusLabel(key),
      value: statusCounts[key] || 0,
      color: STATUS_COLORS[key],
    }))
    .filter((row) => row.value > 0);

  const catCounts = {};
  tasks.forEach((task) => {
    const name = shortCategory(task.category);
    catCounts[name] = (catCounts[name] || 0) + 1;
  });
  const palette = [CHART_COLORS.olive, CHART_COLORS.oliveMid, CHART_COLORS.sand, CHART_COLORS.moss, CHART_COLORS.amber, CHART_COLORS.green];
  const categories = Object.entries(catCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, value], index) => ({ label, value, color: palette[index % palette.length] }));

  const disputed = tasks.filter((task) => task.status === "disputed").length;
  const pendingVerifications = overview.pendingVerifications ?? verification.find((row) => row.key === "pending")?.value ?? 0;
  const openTasks = overview.openTasks ?? tasks.filter((task) => task.status === "open").length;
  const pendingReports = overview.pendingReports ?? 0;

  return {
    users: overview.users ?? users.length,
    tasks: overview.tasks ?? tasks.length,
    openTasks,
    pendingVerifications,
    postingFees: overview.postingFees || fees.reduce((sum, row) => sum + Number(row.amount || 0), 0),
    feesThisMonth,
    feesLastMonth,
    feeGrowth,
    suspended: users.filter((user) => user.status === "suspended").length,
    days,
    months,
    verification,
    roles,
    taskStatus,
    categories,
    attention: [
      { id: "verification", tab: "verification", label: "Pending applications", value: pendingVerifications, hint: "Need review", tone: pendingVerifications ? "warn" : "ok" },
      { id: "reports", tab: "reports", label: "Open reports", value: pendingReports, hint: "Spam / scam / prohibited", tone: pendingReports ? "warn" : "ok" },
      { id: "open", tab: "overview", label: "Open gawain", value: openTasks, hint: "Live on marketplace", tone: "ok" },
      { id: "disputed", tab: "reports", label: "Disputed tasks", value: disputed, hint: "Taken down or in review", tone: disputed ? "danger" : "ok" },
    ],
    recentLogs: logs.slice(0, 6),
    recentTx: transactions.filter((row) => row.kind === "posting_fee").slice(0, 6),
  };
}
