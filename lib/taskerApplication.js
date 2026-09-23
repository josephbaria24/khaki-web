import { SERVICE_CATEGORIES } from "@/lib/khaki";

export const APPLICATION_SKILLS = SERVICE_CATEGORIES.map((c) => c.title);

export const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const EXPERIENCE_YEARS = ["0", "1-2", "3-5", "5+"];

export const APPLICATION_ID_TYPES = [
  "PhilSys National ID",
  "Driver's License",
  "Passport",
  "UMID",
];

export const DECLARATION_TEXT =
  "I hereby declare that the information provided above is true and correct to the best of my knowledge. I consent to KHAKIWORKS.COM processing my data for recruitment purposes.";

export function emptyTaskerApplication(user) {
  const fromCreds = (user?.credentials || []).find((c) => c?.application)?.application;
  const app = user?.tasker_application || fromCreds || {};
  return {
    full_name: user?.full_name || "",
    phone: user?.phone || "",
    age: app.age || "",
    barangay: user?.barangay || "",
    location_area: user?.location_area || "Puerto Princesa City",
    id_type: user?.id_type || "",
    location_detail: user?.location_detail || "",
    skills: Array.isArray(user?.skills) ? user.skills.filter((s) => APPLICATION_SKILLS.includes(s)) : [],
    other_skill: app.other_skill || user?.skills?.find((s) => !APPLICATION_SKILLS.includes(s)) || "",
    experience_years: app.experience_years || "",
    daily_rate: user?.price_amount ? String(user.price_amount) : "",
    available_days: Array.isArray(app.available_days) ? app.available_days : [],
    gcash_number: app.gcash_number || "",
    emergency_contact_name: app.emergency_contact_name || "",
    emergency_contact_number: app.emergency_contact_number || "",
    signature: app.signature || "",
    signed_at: app.signed_at || new Date().toISOString().slice(0, 10),
    declared: Boolean(app.declared),
  };
}

export function validateTaskerApplication(form, idDocument) {
  if (!form.full_name.trim()) return "Full name is required.";
  if (!form.phone.trim()) return "Contact number is required.";
  const age = Number(form.age);
  if (!age || age < 18) return "You must be at least 18.";
  if (!form.barangay) return "Barangay is required.";
  if (!form.id_type) return "Valid ID type is required.";
  if (!form.location_detail.trim()) return "Address is required.";
  if (!form.skills.length && !form.other_skill.trim()) return "Select at least one skill.";
  if (!form.experience_years) return "Experience years is required.";
  if (!Number(form.daily_rate)) return "Daily rate expectation is required.";
  if (!form.available_days.length) return "Select at least one available day.";
  if (!form.gcash_number.trim()) return "GCash number is required.";
  if (!form.emergency_contact_name.trim() || !form.emergency_contact_number.trim()) {
    return "Emergency contact name and number are required.";
  }
  if (!form.declared) return "Please confirm the declaration.";
  if (!hasDrawnSignature(form.signature)) return "Please sign in the signature pad.";
  if (!idDocument?.name) return "Please attach a photo or scan of your valid ID.";
  return "";
}

export function readSubmittedApplication(user) {
  const fromCreds = (user?.credentials || []).find((c) => c?.application)?.application || {};
  const app = user?.tasker_application || fromCreds || {};
  return {
    full_name: user?.full_name || app.full_name || "",
    email: user?.email || app.email || "",
    phone: user?.phone || app.phone || "",
    age: app.age || "",
    location_area: user?.location_area || "",
    barangay: user?.barangay || "",
    location_detail: user?.location_detail || "",
    id_type: user?.id_type || "",
    id_document: user?.id_document || null,
    skills: Array.isArray(user?.skills) ? user.skills : [],
    experience_years: app.experience_years || "",
    daily_rate: user?.price_amount || app.daily_rate || "",
    available_days: Array.isArray(app.available_days) ? app.available_days : [],
    gcash_number: app.gcash_number || "",
    emergency_contact_name: app.emergency_contact_name || "",
    emergency_contact_number: app.emergency_contact_number || "",
    signature: app.signature || "",
    signed_at: app.signed_at || "",
    declared: Boolean(app.declared),
    submitted_at: app.submitted_at || "",
  };
}

export function toggleList(list, value) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

const DRAW_PREFIX = "draw:v1:";

function strokeLength(stroke) {
  let distance = 0;
  for (let i = 1; i < stroke.length; i += 1) {
    distance += Math.hypot(stroke[i][0] - stroke[i - 1][0], stroke[i][1] - stroke[i - 1][1]);
  }
  return distance;
}

export function encodeSignatureStrokes(strokes) {
  const compact = (strokes || [])
    .map((stroke) => stroke.map((point) => [Number(point[0].toFixed(4)), Number(point[1].toFixed(4))]))
    .filter((stroke) => stroke.length > 1);
  return `${DRAW_PREFIX}${JSON.stringify(compact)}`;
}

export function decodeSignatureStrokes(value) {
  if (!value?.startsWith?.(DRAW_PREFIX)) return null;
  try {
    const parsed = JSON.parse(value.slice(DRAW_PREFIX.length));
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function hasDrawnSignature(value) {
  if (!value || typeof value !== "string") return false;
  if (value.startsWith("data:image")) return value.length > 80;
  const strokes = decodeSignatureStrokes(value);
  if (strokes) return strokes.some((stroke) => stroke.length > 2 && strokeLength(stroke) > 0.08);
  return value.trim().length > 1;
}

export function signaturePath(strokes, width = 100, height = 40) {
  return (strokes || [])
    .map((stroke) => {
      if (!stroke?.length) return "";
      return stroke
        .map((point, index) => `${index ? "L" : "M"}${(point[0] * width).toFixed(2)} ${(point[1] * height).toFixed(2)}`)
        .join(" ");
    })
    .filter(Boolean)
    .join(" ");
}

export function applicationPayload(form) {
  const skills = [...form.skills];
  if (form.other_skill.trim()) skills.push(form.other_skill.trim());
  return {
    profile: {
      full_name: form.full_name.trim(),
      phone: form.phone.trim(),
      barangay: form.barangay,
      location_area: form.location_area,
      location_detail: form.location_detail.trim(),
      id_type: form.id_type,
      skills,
      price_type: "Per Day",
      price_amount: Number(form.daily_rate),
      price_description: "Daily rate",
      headline: `${form.experience_years === "0" ? "New" : form.experience_years + " yrs"} · ${skills.slice(0, 3).join(", ")}`,
      bio: form.experience_years === "0" || !form.experience_years
        ? `Available for ${skills.slice(0, 3).join(", ").toLowerCase()} around Palawan.`
        : `Experienced in ${skills.slice(0, 3).join(", ").toLowerCase()}, ${form.experience_years} years experience.`,
    },
    application: {
      age: Number(form.age),
      skills,
      daily_rate: Number(form.daily_rate),
      other_skill: form.other_skill.trim(),
      experience_years: form.experience_years,
      available_days: form.available_days,
      gcash_number: form.gcash_number.trim(),
      emergency_contact_name: form.emergency_contact_name.trim(),
      emergency_contact_number: form.emergency_contact_number.trim(),
      signature: form.signature.trim(),
      signed_at: form.signed_at,
      declared: true,
    },
    gcash_number: form.gcash_number.trim(),
  };
}
