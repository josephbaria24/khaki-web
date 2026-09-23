import { MUNICIPALITY_NAMES } from "@/lib/palawanLocations";

export const CATEGORIES = [
  "Express Errands (Pabili)",
  "Local Transport",
  "Tourism & Vehicle Services",
  "Inter-Town Logistics",
  "Home & Commercial Repair",
  "Remote Digital Tasks",
  "Home Salon & Wellness (Gupit/Pahilot)",
  "Academic & Writing (Thesis/Sulat)",
  "Companionship & Escort (Pa Sabay)",
  "Personal Assistance (Pa Asikaso)",
  "Pet Care & Sitting",
];

export const SERVICE_CATEGORIES = [
  {
    key: "transport",
    title: "Transport & Rides",
    desc: "Van transfers, drivers, and cargo runs",
    enumValue: "Local Transport",
    match: ["Local Transport", "Inter-Town Logistics"],
    groups: [
      { title: "Van & Tricycle Rentals", desc: "Private van transfers (e.g., Puerto Princesa to El Nido/San Vicente), city tricycle rides." },
      { title: "Vehicle Rentals & Drivers", desc: "Scooter/motorbike rentals, dedicated private drivers, airport pick-up/drop-off." },
      { title: "Delivery & Logistics", desc: "Inter-town cargo hauling, local parcel runs, grocery or supplies transport." },
    ],
  },
  {
    key: "tourism",
    title: "Tourism & Tours",
    desc: "Island hopping, guides, and travel help",
    enumValue: "Tourism & Vehicle Services",
    match: ["Tourism & Vehicle Services"],
    groups: [
      { title: "Island Hopping & Boat Services", desc: "Private boat hires, tour joiner bookings, tour coordinator assistance." },
      { title: "Local Guides & Escorts", desc: "Private tour guides, trekking/hiking guides (e.g., Mt. Tapyas, Cleopatra's Needle)." },
      { title: "Travel Assistance", desc: "Booking assistance, itinerary planning, land transfer arrangements." },
    ],
  },
  {
    key: "repair",
    title: "Home Repair",
    desc: "AC, plumbing, and handyman work",
    enumValue: "Home & Commercial Repair",
    match: ["Home & Commercial Repair"],
    groups: [
      { title: "AC Maintenance", desc: "Cleaning, aircon repair, refrigerant/freon refill." },
      { title: "Plumbing & Water Systems", desc: "Pipe leak repair, water pump installation, bathroom fixture fixes." },
      { title: "Handyman & Electrical", desc: "General house repairs, wiring fixes, appliance repair, carpentry, painting." },
    ],
  },
  {
    key: "cleaning",
    title: "Home Cleaning",
    desc: "Move-in, deep clean, and tidy-ups",
    enumValue: "Home & Commercial Repair",
    match: ["Home & Commercial Repair"],
    groups: [
      { title: "Move-In / Move-Out Deep Clean", desc: "Deep cleaning for houses, apartments, Airbnb rentals, and villas." },
      { title: "Routine Housekeeping", desc: "Regular sweeping, dusting, laundry, ironing, and general tidy-ups." },
      { title: "Post-Construction & Special Cleaning", desc: "Post-renovation cleaning, sofa/mattress deep vacuuming." },
    ],
  },
  {
    key: "digital",
    title: "Digital Tasks",
    desc: "Thesis help, design, and remote work",
    enumValue: "Remote Digital Tasks",
    match: ["Remote Digital Tasks", "Academic & Writing (Thesis/Sulat)"],
    groups: [
      { title: "Academic & Student Support", desc: "Thesis formatting, proofreading, research assistance, encoding work." },
      { title: "Creative & Tech Services", desc: "Graphic design, video editing for social media, basic website maintenance." },
      { title: "Remote Administrative Work", desc: "Data entry, virtual assistant tasks, translation (Tagalog, English, Cuyonon)." },
    ],
  },
  {
    key: "salon",
    title: "Salon & Wellness",
    desc: "Gupit, pahilot, and at-home beauty",
    enumValue: "Home Salon & Wellness (Gupit/Pahilot)",
    match: ["Home Salon & Wellness (Gupit/Pahilot)"],
    groups: [
      { title: "Hair & Grooming", desc: "At-home haircuts (gupit), hair coloring, blow-outs, beard trimming." },
      { title: "Body & Massage Therapy", desc: "Traditional Filipino massage (pahilot), Swedish/foot massage, home spa setups." },
      { title: "Nails & Beauty", desc: "Home manicure, pedicure, eyelash extensions, event makeup services." },
    ],
  },
  {
    key: "pets",
    title: "Pet Care",
    desc: "Sitting, walking, and pet errands",
    enumValue: "Pet Care & Sitting",
    match: ["Pet Care & Sitting"],
    groups: [
      { title: "Pet Sitting & Boarding", desc: "In-home pet care, feeding, day-care sitting." },
      { title: "Pet Grooming & Walking", desc: "Mobile pet bathing/grooming, daily dog walking." },
      { title: "Pet Errands", desc: "Vet visits, pet food and supply runs." },
    ],
  },
  {
    key: "other",
    title: "Something Else",
    desc: "Errands, events, and custom Palawan tasks",
    enumValue: "Express Errands (Pabili)",
    match: ["Express Errands (Pabili)", "Personal Assistance (Pa Asikaso)", "Companionship & Escort (Pa Sabay)"],
    groups: [
      { title: "Errands & Queuing", desc: "Standing in line at government offices (SSS, Pag-IBIG), paying utility bills, document pickup/drop-off." },
      { title: "Event & Party Help", desc: "Event setup/teardown, catering helpers, dishwashers, photography assistant." },
      { title: "Local Palawan Needs", desc: "Buying fresh market produce (palengke run), souvenir sourcing, seasonal farm/property maintenance tasks." },
    ],
  },
];

export function serviceByKey(key) {
  return SERVICE_CATEGORIES.find((c) => c.key === key) || SERVICE_CATEGORIES[0];
}

export function serviceByTitle(title) {
  return SERVICE_CATEGORIES.find((c) => c.title === title) || null;
}

export function taskMatchesService(taskCategory, service) {
  if (!service) return false;
  return (service.match || [service.enumValue]).includes(taskCategory);
}

export function serviceForTaskCategory(taskCategory) {
  if (!taskCategory) return null;
  return SERVICE_CATEGORIES.find((c) => c.title === taskCategory) || SERVICE_CATEGORIES.find((c) => (c.match || [c.enumValue]).includes(taskCategory)) || null;
}

export function displayCategory(taskCategory) {
  return serviceForTaskCategory(taskCategory)?.title || taskCategory || "";
}

export function hasServiceSkill(skills, service) {
  const set = new Set(skills || []);
  if (set.has(service.title) || set.has(service.enumValue)) return true;
  return (service.match || []).some((m) => set.has(m));
}

export function toggleServiceSkill(skills, service) {
  const list = Array.isArray(skills) ? [...skills] : [];
  if (hasServiceSkill(list, service)) {
    const drop = new Set([service.title, service.enumValue, ...(service.match || [])]);
    return list.filter((s) => !drop.has(s));
  }
  return [...list, service.title];
}

export const LOCATIONS = MUNICIPALITY_NAMES;

export const STATUS_CONFIG = {
  open: { label: "Open pa", className: "bg-status-open/10 text-status-open", dot: "bg-status-open" },
  offer_accepted: { label: "May kumuha na", className: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  escrow_locked: { label: "Hired na", className: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
  in_progress: { label: "Ongoing", className: "bg-status-progress/10 text-status-progress", dot: "bg-status-progress" },
  completed_pending_review: { label: "I-rate na", className: "bg-purple-100 text-purple-700", dot: "bg-purple-500" },
  disputed: { label: "May issue", className: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  released: { label: "Tapos na", className: "bg-status-done/10 text-status-done", dot: "bg-status-done" },
  cancelled: { label: "Cancelled", className: "bg-destructive/10 text-destructive", dot: "bg-destructive" },
};

export const SCHEDULE_LABELS = {
  on_date: "On date",
  before_date: "Before date",
  flexible: "Flexible",
  express_2hr: "Express (2hr)",
};

export const COMMISSION_RATE = 0.02;
export const BUSINESS_COMMISSION_RATE = 0.04;
export const BOOKING_FEE_RATE = 0.0;
export const CONVENIENCE_FEE_RATE = 0.0;
export const CANCELLATION_FEE_RATE = 0.05;
export const MIN_DEPOSIT_RATE = 0.1;
export const MIN_DEPOSIT_PHP = 50;

export function formatPHP(amount) {
  return "₱" + Number(amount || 0).toLocaleString("en-PH");
}

export function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

export function scheduleLabel(task) {
  if (task.schedule_type === "express_2hr") return "Express · 2hr";
  if (task.schedule_type === "flexible") return "Flexible";
  if (!task.schedule_date) return SCHEDULE_LABELS[task.schedule_type] || "Flexible";
  const d = new Date(task.schedule_date);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Today";
  return d.toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric" });
}

export function convenienceFee(budget) {
  return Math.round(budget * CONVENIENCE_FEE_RATE);
}
export function cancellationFee(budget) {
  return Math.round(budget * CANCELLATION_FEE_RATE);
}
export function taskerPayout(budget, tip = 0) {
  return Math.round(budget * (1 - COMMISSION_RATE)) + Number(tip || 0);
}
export function platformFee(budget) {
  return postingFee(budget);
}
export function postingFee(budget) {
  return Math.max(1, Math.round(Number(budget || 0) * COMMISSION_RATE));
}
export function requiredDeposit(budget) {
  return postingFee(budget);
}
export function clientFee(budget) {
  return Math.round(budget * BOOKING_FEE_RATE);
}
export function clientTotal(budget, tip = 0, damageCharge = 0) {
  return budget + clientFee(budget) + convenienceFee(budget) + Number(tip || 0) + Number(damageCharge || 0);
}

export const PAYMENT_METHODS = [
  { id: "gcash", label: "GCash", description: "GCash e-wallet transfer" },
  { id: "maya", label: "Maya", description: "Maya e-wallet transfer" },
  { id: "qrph", label: "QR Ph", description: "Scan QR Ph from any bank/e-wallet" },
  { id: "cash_cod", label: "Cash on Completion", description: "Pay cash on completion" },
];

export const ESCROW_STATUS_CONFIG = {
  pending_payment: { label: "Awaiting payment", className: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  locked: { label: "Funds locked", className: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
  released: { label: "Released", className: "bg-status-done/10 text-status-done", dot: "bg-status-done" },
  cancelled: { label: "Cancelled", className: "bg-destructive/10 text-destructive", dot: "bg-destructive" },
};

export function generateReference() {
  return "KHAKI-" + Math.random().toString(36).substring(2, 8).toUpperCase() + Date.now().toString().slice(-4);
}

export const REPORT_REASONS = [
  { id: "spam", label: "Spam / duplicate" },
  { id: "scam", label: "Scam / suspicious" },
  { id: "prohibited", label: "Prohibited gawain" },
  { id: "other", label: "Other" },
];

export const DISPUTE_STATUS_LABEL = {
  pending_review: "Pending review",
  under_review: "Under review",
  resolved_charge: "Resolved",
  resolved_no_charge: "Taken down",
  dismissed: "Dismissed",
};

export function reportReasonLabel(id) {
  return REPORT_REASONS.find((row) => row.id === id)?.label || id || "Report";
}

export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}
