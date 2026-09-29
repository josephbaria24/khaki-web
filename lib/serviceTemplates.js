import { serviceForTaskCategory } from "@/lib/khaki";

// Per-category posting templates. A category without an entry here falls back to
// the generic form: title, kind, schedule, location, details.
//
// prompt/examples  — tappable starters that fill the title field.
// scheduleOptions  — overrides the generic SCHEDULE_LABELS list for this category.
// fields           — structured answers saved to tasks.extras and shown on the
//                    gawain page under "Task details".
export const SERVICE_TEMPLATES = {
  transport: {
    prompt: "Ano ang kailangan mo?",
    promptHint: "What service do you need?",
    examples: ["Rent", "Pick up", "Pa-deliver", "Pakuha"],
    scheduleOptions: [
      { value: "express_2hr", label: "Ngayon Na (Now)", icon: "Flash", color: "#E8A317", desc: "Kailangan within 2 hours" },
      { value: "on_date", label: "Petsa at Oras", icon: "Calendar", color: "#3A73C4", desc: "Pumili ng araw" },
      { value: "flexible", label: "Flexible", icon: "Refresh", color: "#3D5C6E", desc: "Kahit kailan puwede" },
    ],
    fields: [
      {
        key: "vehicle_type",
        label: "Vehicle type",
        placeholder: "Pumili ng sasakyan",
        required: true,
        options: [
          {
            value: "car",
            label: "Car",
            icon: "Car",
            color: "#2F6F9A",
            desc: "Hanggang 4 na pasahero · bagahe o grocery run",
            lines: [
              { icon: "Users", color: "#3A73C4", text: "Max 4 Passengers" },
              { icon: "Luggage", color: "#8A6A3B", text: "1 Passenger + Small Bag" },
            ],
          },
          {
            value: "motorcycle",
            label: "Motorcycle",
            icon: "Motorbike",
            color: "#1F7A6B",
            desc: "1 pasahero + maliit na bag",
            lines: [{ icon: "Motorbike", color: "#1F7A6B", text: "1 Passenger + Small Bag" }],
          },
          {
            value: "other",
            label: "Other Transport",
            icon: "Van",
            color: "#C46A2E",
            desc: "Van, tricycle, o truck — grupo o malaking kargamento",
            lines: [{ icon: "Van", color: "#C46A2E", text: "For unique, oversized, or group cargo (including van)" }],
          },
        ],
      },
    ],
  },
};

export function templateForKey(categoryKey) {
  return SERVICE_TEMPLATES[categoryKey] || null;
}

const PIN_SLOTS = {
  transport: [
    { key: "pickup", label: "Pick-up point", short: "Pick-up", color: "#1F9D6A" },
    { key: "dropoff", label: "Drop-off point", short: "Drop-off", color: "#D1453B" },
  ],
};

const DEFAULT_PIN_SLOTS = [{ key: "site", label: "Exact location", short: "Location", color: "#2F6F9A" }];

export function pinSlotsFor(categoryKey) {
  return PIN_SLOTS[categoryKey] || DEFAULT_PIN_SLOTS;
}

function validPin(pin) {
  return pin && Number.isFinite(Number(pin.lat)) && Number.isFinite(Number(pin.lng));
}

export function cleanPins(categoryKey, pins) {
  const out = {};
  for (const slot of pinSlotsFor(categoryKey)) {
    const pin = pins?.[slot.key];
    if (validPin(pin)) out[slot.key] = { lat: Number(Number(pin.lat).toFixed(6)), lng: Number(Number(pin.lng).toFixed(6)) };
  }
  return out;
}

export function mapsUrl(pin) {
  return `https://www.google.com/maps/search/?api=1&query=${pin.lat},${pin.lng}`;
}

// [{ key, label, color, lat, lng, url }] for a saved gawain.
export function describePins(task) {
  const pins = task?.extras?.pins;
  if (!pins) return [];
  const service = serviceForTaskCategory(task?.category);
  const slots = [...pinSlotsFor(service?.key), ...DEFAULT_PIN_SLOTS];
  const seen = new Set();
  return slots
    .filter((slot) => {
      if (seen.has(slot.key) || !validPin(pins[slot.key])) return false;
      seen.add(slot.key);
      return true;
    })
    .map((slot) => ({ ...slot, ...pins[slot.key], url: mapsUrl(pins[slot.key]) }));
}

export function templateForTask(task) {
  const service = serviceForTaskCategory(task?.category);
  return service ? templateForKey(service.key) : null;
}

export function emptyExtras(template) {
  const out = {};
  for (const field of template?.fields || []) out[field.key] = "";
  return out;
}

// Drop blanks and anything the template does not define, so a category switch
// never carries stray answers into the saved gawain.
export function cleanExtras(template, extras) {
  const out = {};
  for (const field of template?.fields || []) {
    const value = extras?.[field.key];
    if (value) out[field.key] = value;
  }
  return out;
}

export function missingRequiredField(template, extras) {
  return (template?.fields || []).find((field) => field.required && !extras?.[field.key]) || null;
}

// [{ key, label, value }] for rendering a saved gawain.
export function describeExtras(task) {
  const template = templateForTask(task);
  if (!template) return [];
  const extras = task?.extras || {};
  return (template.fields || [])
    .map((field) => {
      const raw = extras[field.key];
      if (!raw) return null;
      const option = (field.options || []).find((o) => o.value === raw);
      return { key: field.key, label: field.label, value: option?.label || raw, desc: option?.desc || "" };
    })
    .filter(Boolean);
}

export const VEHICLE_OPTIONS = SERVICE_TEMPLATES.transport.fields[0].options;

export function vehicleLabel(key) {
  if (!key) return "";
  return VEHICLE_OPTIONS.find((o) => o.value === key)?.label || key;
}

export const BUDGET_DISCLAIMER =
  "Paunawa: ₱50 ang pinakamababang halaga. Maglagay ng makatotohanang budget — mas mabilis tanggapin ng tasker ang gawain.";
