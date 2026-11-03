/** Poster-chosen expectation. Fee is a percent of the posted budget. */
export const POSTING_EXPECTATIONS = [
  {
    stage: 1,
    title: "Stage 1 · Registered",
    detail: "for trial small tasks",
    feeRate: 0.02,
    feeLabel: "2%",
    icon: "User",
    bg: "#E4E7EC",
    fg: "#1E2936",
    iconBg: "#C9CED6",
    pill: "#D5D9E0",
  },
  {
    stage: 2,
    title: "Stage 2 · ID & Face Verified",
    detail: "trusted",
    feeRate: 0.035,
    feeLabel: "3.5%",
    icon: "ShieldCheck",
    bg: "#6E8CFF",
    fg: "#FFFFFF",
    iconBg: "#5674F0",
    pill: "rgba(255,255,255,0.22)",
  },
  {
    stage: 3,
    title: "Stage 3 · Skill Verified",
    detail: "proven skill",
    feeRate: 0.05,
    feeLabel: "5%",
    icon: "Sparkles",
    bg: "#74C98A",
    fg: "#FFFFFF",
    iconBg: "#57B472",
    pill: "rgba(255,255,255,0.24)",
  },
  {
    stage: 4,
    title: "Stage 4 · Licensed",
    detail: "licensed pro",
    feeRate: 0.07,
    feeLabel: "7%",
    icon: "Briefcase",
    bg: "#A78BFA",
    fg: "#FFFFFF",
    iconBg: "#8B6FE0",
    pill: "rgba(255,255,255,0.24)",
  },
  {
    stage: 5,
    title: "Stage 5 · Pioneer Gold Crown",
    detail: "Top 10% · 8 jobs · 4.8 stars · 95% on-time · 0 dispute",
    premium: true,
    feeRate: 0.1,
    feeLabel: "10%",
    icon: "ShieldCheck",
    bg: "linear-gradient(180deg, #F8E7B4 0%, #E2BE62 100%)",
    fg: "#3E2C08",
    iconBg: "#C9A24A",
    pill: "#C6A15A",
  },
];

export function postingRateForStage(stage) {
  const found = POSTING_EXPECTATIONS.find((item) => item.stage === Number(stage));
  return found?.feeRate || POSTING_EXPECTATIONS[0].feeRate;
}

export function postingFeeLabel(stage) {
  const found = POSTING_EXPECTATIONS.find((item) => item.stage === Number(stage));
  return found?.feeLabel || "2%";
}

export const QUALIFICATION_STAGES = [
  {
    stage: 1,
    name: "Registered",
    kicker: "Starting level",
    badge: "Account created",
    tone: "#8A94A6",
    soft: "#EEF2F6",
    ink: "#3D4A5C",
    points: ["Browse open tasks", "Finish ID and face check to post or accept work"],
  },
  {
    stage: 2,
    name: "ID & Face",
    kicker: "Verified identity",
    badge: "ID Check + Face",
    tone: "#2457A6",
    soft: "#D6E8FF",
    ink: "#163044",
    points: ["Government ID on file", "Live face photo matched by admin", "Can post and accept tasks"],
  },
  {
    stage: 3,
    name: "Skill",
    kicker: "Verified skills",
    badge: "Skill badge",
    tone: "#1A7A58",
    soft: "#D7F0EA",
    ink: "#0D666A",
    points: ["At least one finished job", "Skill shown on the tasker card", "Higher trust on browse"],
  },
  {
    stage: 4,
    name: "Licensed",
    kicker: "Professional license",
    badge: "License on file",
    tone: "#8A6410",
    soft: "#FFF0C4",
    ink: "#6B4E0A",
    points: ["PRC, TESDA, or trade license number saved", "Shown when a poster asks for a licensed tasker"],
  },
  {
    stage: 5,
    name: "Pioneer",
    kicker: "Top rated",
    badge: "Pioneer",
    tone: "#163044",
    soft: "#E8DCC4",
    ink: "#102636",
    points: ["8 finished jobs", "4.8 average from 5 reviews", "Pioneer badge on the profile"],
  },
];

export function sinceLabel(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export function roleTitle(profile, skills = []) {
  const headline = String(profile?.headline || "").trim();
  if (headline) return headline;
  if (profile?.role === "admin") return "Khaki Administrator";
  const list = (skills || []).filter(Boolean);
  if (!list.length) return "Tasker";
  if (list.length === 1) return `${list[0]} Tasker`;
  return `${list[0]} & ${list[1]} Tasker`;
}

export function profileQualification(profile, stats = {}) {
  const app = profile?.tasker_application || {};
  const selfie = Boolean(profile?.id_document?.selfie_url);
  const idVerified = profile?.role === "admin" || profile?.verification_status === "verified";
  const faceVerified = idVerified && selfie && profile?.role !== "admin";
  const done = Number(stats.done || 0);
  const assigned = Number(stats.assigned || 0);
  const avg = Number(stats.avg || 0);
  const reviews = Number(stats.reviews || 0);
  const skills = stats.skills || profile?.skills || app.skills || [];
  const licensed = Boolean(String(app.license_number || profile?.license_number || "").trim());
  const completion = assigned > 0 ? Math.round((done / assigned) * 100) : null;
  const pioneer = profile?.role !== "admin" && idVerified && done >= 8 && avg >= 4.8 && reviews >= 5;

  let stage = 1;
  if (idVerified && profile?.role !== "admin") stage = 2;
  if (stage >= 2 && done >= 1 && skills.length) stage = 3;
  if (stage >= 3 && licensed) stage = 4;
  if (pioneer) stage = 5;

  const meta = QUALIFICATION_STAGES[stage - 1];
  return {
    stage,
    stageLabel: meta?.name || "Registered",
    badge: meta?.badge || "",
    faceVerified,
    idVerified,
    selfie,
    licensed,
    pioneer,
    completion,
    completionLabel: completion == null ? "New" : `${completion}%`,
    sinceLabel: sinceLabel(profile?.created_at),
    roleTitle: roleTitle(profile, skills),
  };
}
