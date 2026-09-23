import { SERVICE_CATEGORIES, displayCategory } from "@/lib/khaki";

export const PASTELS = {
  pink: "#FAD4DC",
  mint: "#C8F0D8",
  yellow: "#FFF0C4",
  blue: "#D6E8FF",
  lavender: "#E8DEFF",
  peach: "#FFE4D6",
};

export const CARD_IMAGE_KEYS = {
  featured: "featured",
  "Express Errands (Pabili)": "errands",
  "Local Transport": "transport",
  "Tourism & Vehicle Services": "tourism",
  "Inter-Town Logistics": "logistics",
  "Home & Commercial Repair": "repair",
  "Remote Digital Tasks": "digital",
  "Home Salon & Wellness (Gupit/Pahilot)": "salon",
  "Academic & Writing (Thesis/Sulat)": "academic",
  "Companionship & Escort (Pa Sabay)": "companionship",
  "Personal Assistance (Pa Asikaso)": "assistance",
  "Pet Care & Sitting": "pet",
};

const CARD_IMAGE_FILES = {
  featured: "featured-errands.png",
  errands: "grocery.png",
  tourism: "tourists.png",
  academic: "schoolworks.png",
  assistance: "service_assistance.png",
};

/** Extra art per category so same-type jobs don't all look identical */
const CARD_IMAGE_POOLS = {
  featured: ["featured-errands.png", "featured.png", "errands.png"],
  errands: ["grocery.png", "errands.png", "hanap.png", "tasks.png"],
  transport: ["transport.png", "jobs.png"],
  tourism: ["tourists.png", "tourism.png"],
  logistics: ["logistics.png", "jobs.png"],
  repair: ["repair.png", "post.png"],
  digital: ["digital.png", "tasks.png"],
  salon: ["salon.png"],
  academic: ["schoolworks.png", "academic.png"],
  companionship: ["companionship.png"],
  assistance: ["service_assistance.png", "assistance.png"],
  pet: ["pet.png"],
};

export function cardImageSrc(key) {
  const file = CARD_IMAGE_FILES[key] || `${key}.png`;
  return `/images/cards/${file}`;
}

function hashSeed(value) {
  const str = String(value || "");
  let h = 0;
  for (let i = 0; i < str.length; i += 1) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

export const CATEGORY_STYLES = {
  "Express Errands (Pabili)": { bg: PASTELS.pink, image: cardImageSrc("errands") },
  "Local Transport": { bg: PASTELS.blue, image: cardImageSrc("transport") },
  "Tourism & Vehicle Services": { bg: PASTELS.mint, image: cardImageSrc("tourism") },
  "Inter-Town Logistics": { bg: PASTELS.lavender, image: cardImageSrc("logistics") },
  "Home & Commercial Repair": { bg: PASTELS.yellow, image: cardImageSrc("repair") },
  "Remote Digital Tasks": { bg: PASTELS.blue, image: cardImageSrc("digital") },
  "Home Salon & Wellness (Gupit/Pahilot)": { bg: PASTELS.peach, image: cardImageSrc("salon") },
  "Academic & Writing (Thesis/Sulat)": { bg: PASTELS.lavender, image: cardImageSrc("academic") },
  "Companionship & Escort (Pa Sabay)": { bg: PASTELS.mint, image: cardImageSrc("companionship") },
  "Personal Assistance (Pa Asikaso)": { bg: PASTELS.pink, image: cardImageSrc("assistance") },
  "Pet Care & Sitting": { bg: PASTELS.yellow, image: cardImageSrc("pet") },
};

export const FEATURED = {
  bg: PASTELS.mint,
  badges: ["Direct pay", "2% post fee"],
  title: "Fresh errands, fast help",
  subtitle: "Quick local services across Palawan",
  image: cardImageSrc("featured"),
  href: "/browse",
};

export const CHIP_CATEGORIES = ["All", ...SERVICE_CATEGORIES.map((c) => c.title)];

export function taskMatchesChip(taskCategory, chip) {
  if (!chip || chip === "All") return true;
  const service = SERVICE_CATEGORIES.find((c) => c.title === chip);
  if (!service) return taskCategory === chip;
  return (service.match || [service.enumValue]).includes(taskCategory);
}

export function styleForCategory(category) {
  return CATEGORY_STYLES[category] || { bg: PASTELS.blue, image: FEATURED.image };
}

/** Category pastel + cutout art; image varies by task id so cards feel randomized */
export function graphicForTask(task) {
  const category = task?.category || "";
  const base = styleForCategory(category);
  const key = CARD_IMAGE_KEYS[category] || "featured";
  const pool = CARD_IMAGE_POOLS[key] || [CARD_IMAGE_FILES[key] || `${key}.png`];
  const seed = hashSeed(task?.id || task?.title || category);
  const file = pool[seed % pool.length];
  const pastels = Object.values(PASTELS);
  const bg = base.bg || pastels[seed % pastels.length];
  return { bg, image: `/images/cards/${file}` };
}

export function shortCategory(category) {
  return displayCategory(category).replace(/\s*\(.*\)/, "");
}
