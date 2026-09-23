import { displayCategory } from "@/lib/khaki";

/** Category → pastel + icon key for browse/job cards (no photos). */

export const PASTELS = {
  pink: "#FAD4DC",
  mint: "#C8F0D8",
  yellow: "#FFF0C4",
  blue: "#D6E8FF",
  lavender: "#E8DEFF",
  peach: "#FFE4D6",
  sage: "#C9D6E0",
  sand: "#E8DCC4",
};

const CATEGORY_ICONS = {
  "Express Errands (Pabili)": { bg: PASTELS.pink, icon: "bag" },
  "Local Transport": { bg: PASTELS.blue, icon: "car" },
  "Tourism & Vehicle Services": { bg: PASTELS.mint, icon: "compass" },
  "Inter-Town Logistics": { bg: PASTELS.lavender, icon: "box" },
  "Home & Commercial Repair": { bg: PASTELS.yellow, icon: "wrench" },
  "Remote Digital Tasks": { bg: PASTELS.blue, icon: "monitor" },
  "Home Salon & Wellness (Gupit/Pahilot)": { bg: PASTELS.peach, icon: "scissors" },
  "Academic & Writing (Thesis/Sulat)": { bg: PASTELS.lavender, icon: "book" },
  "Companionship & Escort (Pa Sabay)": { bg: PASTELS.mint, icon: "users" },
  "Personal Assistance (Pa Asikaso)": { bg: PASTELS.pink, icon: "hand" },
  "Pet Care & Sitting": { bg: PASTELS.yellow, icon: "paw" },
};

function hashSeed(value) {
  const str = String(value || "");
  let h = 0;
  for (let i = 0; i < str.length; i += 1) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

/** Stable pastel + icon for a task; slight bg rotation within category for variety */
export function graphicForTask(task) {
  const category = task?.category || "";
  const base = CATEGORY_ICONS[category] || { bg: PASTELS.sage, icon: "spark" };
  const tintPool = [base.bg, PASTELS.sand, PASTELS.sage, PASTELS.mint];
  const seed = hashSeed(task?.id || task?.title || category);
  return {
    bg: tintPool[seed % tintPool.length],
    icon: base.icon,
    ink: "#2A3F4D",
  };
}

export function shortCategory(category) {
  return displayCategory(category).replace(/\s*\(.*\)/, "");
}
