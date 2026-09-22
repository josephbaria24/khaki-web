import { formatPHP } from "@/lib/khaki";

const SKILL_LABELS = {
  "Express Errands (Pabili)": "Delivery",
  "Local Transport": "Transport",
  "Tourism & Vehicle Services": "Tours",
  "Inter-Town Logistics": "Delivery",
  "Home & Commercial Repair": "Repair",
  "Remote Digital Tasks": "Digital",
  "Home Salon & Wellness (Gupit/Pahilot)": "Salon",
  "Academic & Writing (Thesis/Sulat)": "Digital",
  "Companionship & Escort (Pa Sabay)": "Assistance",
  "Personal Assistance (Pa Asikaso)": "Assistance",
  "Pet Care & Sitting": "Pets",
  "Salon & Wellness": "Salon",
  "Pet Care": "Pets",
  "Tour Guide": "Tours",
  Tutoring: "Tutoring",
  Photography: "Photography",
};

const SERVICE_NAMES = {
  Cleaning: "Home Cleaning",
  Repair: "Minor Repair",
  Delivery: "Delivery",
  Salon: "Salon & Wellness",
  Pets: "Pet Care",
  Tours: "Tour Guide",
  Tutoring: "Tutoring",
  Photography: "Photography",
  Transport: "Local Transport",
  Digital: "Digital tasks",
  Assistance: "Personal assistance",
};

export function skillLabel(value) {
  if (!value) return "";
  if (SKILL_LABELS[value]) return SKILL_LABELS[value];
  if (/clean/i.test(value)) return "Cleaning";
  if (/repair/i.test(value)) return "Repair";
  if (/pabili|errand|grocery|delivery/i.test(value)) return "Delivery";
  if (/tour/i.test(value)) return "Tours";
  if (/salon/i.test(value)) return "Salon";
  if (/pet/i.test(value)) return "Pets";
  if (/tutor/i.test(value)) return "Tutoring";
  if (/photo/i.test(value)) return "Photography";
  if (/digital/i.test(value)) return "Digital";
  return String(value).split(/[/(]/)[0].trim();
}

export const PRICE_TYPES = ["Per Hour", "Fixed Price", "Per Day", "Starting From"];

export function priceSuffix(priceType) {
  if (priceType === "Per Day") return "/day";
  if (priceType === "Per Hour") return "/hr";
  if (priceType === "Starting From") return "+";
  return "";
}

export function displayName(fullName) {
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "Tasker";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

export function pricingModelLabel(priceType) {
  if (priceType === "Per Hour") return "Hourly";
  if (priceType === "Fixed Price") return "Fixed";
  if (priceType === "Per Day") return "Per day";
  if (priceType === "Starting From") return "Starting from";
  return "Fixed or Hourly";
}

function collectWorkPhotos(id, tasks) {
  const photos = [];
  for (const t of tasks) {
    if (t.accepted_tasker_id !== id) continue;
    if (!["released", "in_progress", "completed_pending_review"].includes(t.status)) continue;
    for (const url of t.image_urls || []) {
      if (typeof url === "string" && url.trim()) photos.push(url.trim());
    }
  }
  return [...new Set(photos)].slice(0, 8);
}

function applicationBits(profile) {
  const fromCreds = (profile?.credentials || []).find((c) => c?.application)?.application || {};
  return profile?.tasker_application || fromCreds || {};
}

function serviceName(skill) {
  return SERVICE_NAMES[skill] || skill;
}

function joinSkills(skills) {
  if (!skills.length) return "";
  if (skills.length === 1) return skills[0].toLowerCase();
  return `${skills.slice(0, -1).join(", ").toLowerCase()} and ${skills[skills.length - 1].toLowerCase()}`;
}

export function cardBio(profile) {
  if (profile?.bio?.trim()) return profile.bio.trim();
  if (profile?.role === "admin") {
    return "Khaki administrator for Palawan. Reviews applications, verifies accounts, and keeps the marketplace running.";
  }
  const app = applicationBits(profile);
  const years = profile?.experience_years || app.experience_years;
  const skills = ((profile?.skills?.length ? profile.skills : app.skills) || []).map(skillLabel).filter(Boolean);
  const skillText = joinSkills(skills);
  if (years && years !== "0" && skillText) {
    return `Experienced in ${skillText}, ${years} years experience.`;
  }
  if (skillText) return `Available for ${skillText} around Palawan.`;
  return profile?.headline || "";
}

export function buildTaskerCard(profile, reviews = [], tasks = []) {
  const id = profile?.id;
  const app = applicationBits(profile);
  const done = tasks.filter((t) => t.accepted_tasker_id === id && t.status === "released");
  const avg = reviews.length
    ? reviews.reduce((sum, row) => sum + Number(row.rating || 0), 0) / reviews.length
    : 0;
  const fromJobs = [...new Set(done.map((t) => skillLabel(t.category)).filter(Boolean))];
  const rawSkills = (profile?.skills?.length ? profile.skills : app.skills) || [];
  const fromProfile = rawSkills.map(skillLabel).filter(Boolean);
  const skills = [...new Set([...fromProfile, ...fromJobs])].slice(0, 4);

  const barangay = profile?.barangay ? `Barangay ${profile.barangay}` : "";
  const town = profile?.location_area || "";
  const location = [barangay, town].filter(Boolean).join(", ");

  const amount = Number(profile?.price_amount || app.daily_rate || 0);
  const priceType = profile?.price_type || "Per Hour";
  const rateLabel = amount > 0
    ? `${formatPHP(amount)}${priceSuffix(priceType)}`
    : "Quote per job";
  const services = skills.map((name) => ({ name: serviceName(name), rate: rateLabel }));

  const isAdmin = profile?.role === "admin";
  const verified = isAdmin || profile?.verification_status === "verified";
  const gcashVerified = !isAdmin && verified && Boolean(profile?.gcash_verified || app.gcash_number);
  const badges = [];
  if (isAdmin) badges.push({ key: "admin", label: "Khaki Admin" });
  if (avg >= 4.8 && reviews.length >= 5) badges.push({ key: "top", label: "Top Rated" });
  if (done.length >= 8) badges.push({ key: "fast", label: "Fast Response" });
  if (verified && !isAdmin) badges.push({ key: "check", label: "Background Checked" });

  const workPhotos = collectWorkPhotos(id, tasks);

  return {
    avg,
    reviewCount: reviews.length,
    doneCount: done.length,
    skills: isAdmin && !skills.length ? ["Verification", "Users", "Marketplace"] : skills,
    location: location || "Palawan",
    town: town || "Palawan",
    services: isAdmin ? [] : services.slice(0, 4),
    badges,
    verified,
    isAdmin,
    gcashVerified,
    bio: cardBio(profile),
    roleLabel: isAdmin ? "Khaki Administrator" : "",
    workPhotos,
    photoCount: Math.max(workPhotos.length, done.length),
    rateLabel,
    priceType,
    priceAmount: amount,
    priceDescription: profile?.price_description || "",
    displayName: displayName(profile?.full_name),
    pendingVerify: profile?.verification_status === "pending",
  };
}
