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
  repair: {
    prompt: "Ano ang kailangan mo?",
    promptHint: "What service do you need?",
    layout: "stacked",
    examplesInteractive: false,
    examples: ["Pag-ayos ng Gripo", "Pintong Bahay", "Palit Ilaw", "General Repair"],
    fields: [
      {
        key: "service_type",
        label: "Home service type",
        placeholder: "Choose one",
        widget: "select",
        required: true,
        options: [
          {
            value: "ac",
            label: "AC Maintenance",
            icon: "Snowflake",
            color: "#3A73C4",
            desc: "Cleaning, aircon repair, and refrigerant refill.",
            lines: [{ text: "Cleaning, aircon repair, and refrigerant refill." }],
          },
          {
            value: "plumbing",
            label: "Plumbing & Water",
            icon: "GasPipe",
            color: "#2F6F9A",
            desc: "Pipe leaks, water pumps, and bathroom fixtures.",
            lines: [{ text: "Pipe leaks, water pumps, and bathroom fixtures." }],
          },
          {
            value: "handyman",
            label: "Handyman & Electrical",
            icon: "Repair",
            color: "#5C6B7A",
            desc: "General repairs, wiring fixes, and installation.",
            lines: [{ text: "General repairs, wiring fixes, and installation." }],
          },
          {
            value: "electrical",
            label: "Electrical",
            icon: "ElectricPlugs",
            color: "#E8A317",
            desc: "Outlets, lights, switches, and breaker fixes.",
            lines: [{ text: "Outlets, lights, switches, and breaker fixes." }],
          },
          {
            value: "carpentry",
            label: "Carpentry",
            icon: "Hammer",
            color: "#8A6A3B",
            desc: "Cabinets, shelves, doors, and wood repairs.",
            lines: [{ text: "Cabinets, shelves, doors, and wood repairs." }],
          },
          {
            value: "appliance",
            label: "Appliance Repair",
            icon: "WashingMachine",
            color: "#C46A2E",
            desc: "Fans, washers, refrigerators, and small appliances.",
            lines: [{ text: "Fans, washers, refrigerators, and small appliances." }],
          },
          {
            value: "roof",
            label: "Roof & Ceiling",
            icon: "Home",
            color: "#3D5C6E",
            desc: "Leaks, gutters, and ceiling repairs.",
            lines: [{ text: "Leaks, gutters, and ceiling repairs." }],
          },
          {
            value: "doors",
            label: "Doors, Windows & Locks",
            icon: "Door",
            color: "#2F6F9A",
            desc: "Install or repair doors, windows, and locks.",
            lines: [{ text: "Install or repair doors, windows, and locks." }],
          },
          {
            value: "tiling",
            label: "Tiling & Masonry",
            icon: "Grid",
            color: "#1F7A6B",
            desc: "Floor tiles, wall tiles, and concrete patching.",
            lines: [{ text: "Floor tiles, wall tiles, and concrete patching." }],
          },
          {
            value: "other",
            label: "Others",
            icon: "MoreHorizontal",
            color: "#3D5C6E",
            desc: "I-type ang hindi nakalista.",
            lines: [{ text: "I-type ang hindi nakalista." }],
          },
        ],
      },
      {
        key: "price_type",
        label: "Uri ng presyo",
        widget: "segment",
        required: true,
        options: [
          { value: "per_hour", label: "Per Hour", desc: "Bayad kada oras. Ang halaga ay ang rate bawat oras." },
          { value: "contract", label: "Contract Price", desc: "Isang presyo para sa buong gawain, hindi kada oras." },
        ],
      },
      {
        key: "addons",
        label: "Karagdagang serbisyo (Additional Services)",
        widget: "addons",
        multiple: true,
        options: [
          {
            value: "cleaning",
            label: "Paglilinis ng Bahay",
            icon: "Clean",
            color: "#3A73C4",
            desc: "Dusting, mopping, general tidying.",
            lines: [{ text: "Dusting, mopping, general tidying." }],
          },
          {
            value: "paint",
            label: "Pintura",
            icon: "Sparkles",
            color: "#E07A3D",
            desc: "Accent wall painting, touch-ups.",
            lines: [{ text: "Accent wall painting, touch-ups." }],
          },
        ],
      },
    ],
  },
  cleaning: stackedTemplate({
    examples: ["Deep Clean", "Linis Bahay", "Laundry", "Move-out"],
    typeLabel: "Cleaning type",
    options: [
      option("deep", "Move-In / Move-Out Deep Clean", "Clean", "#3A73C4", "Deep cleaning for houses, apartments, Airbnb rentals, and villas."),
      option("routine", "Routine Housekeeping", "Home", "#1F7A6B", "Sweeping, dusting, laundry, ironing, and general tidy-ups."),
      option("post", "Post-Construction Cleaning", "Hammer", "#8A6A3B", "Post-renovation cleaning, dust, and debris."),
      option("upholstery", "Sofa & Mattress Cleaning", "Sparkles", "#5B4B8A", "Deep vacuuming for sofas, mattresses, and cushions."),
      option("other", "Others", "MoreHorizontal", "#3D5C6E", "I-type ang hindi nakalista."),
    ],
    addons: [
      option("windows", "Linis Bintana", "Sparkles", "#3A73C4", "Windows, glass, and mirrors."),
      option("kitchen", "Linis Kusina", "Tools", "#C46A2E", "Counters, sink, stove, and fridge exterior."),
    ],
  }),
  digital: stackedTemplate({
    examples: ["Thesis Help", "Graphic Design", "Video Edit", "Virtual Assistant"],
    typeLabel: "Digital task type",
    options: [
      option("academic", "Academic & Student Support", "Laptop", "#5B4B8A", "Thesis formatting, proofreading, research, and encoding."),
      option("design", "Graphic Design", "Sparkles", "#C43A6A", "Posts, logos, and simple layouts."),
      option("video", "Video Editing", "Flash", "#E8A317", "Short social clips and basic cuts."),
      option("admin", "Virtual Assistant", "Briefcase", "#2F6F9A", "Data entry, scheduling, and admin work."),
      option("translation", "Translation", "MessageSquare", "#1F7A6B", "Tagalog, English, and Cuyonon."),
      option("other", "Others", "MoreHorizontal", "#3D5C6E", "I-type ang hindi nakalista."),
    ],
    addons: [
      option("rush", "Rush", "Flash", "#E8A317", "Kailangan agad, within the day."),
      option("revisions", "Extra Revisions", "Refresh", "#3A73C4", "More than one round of edits."),
    ],
  }),
  salon: stackedTemplate({
    examples: ["Gupit sa Bahay", "Pahilot", "Manicure", "Makeup"],
    typeLabel: "Salon service type",
    options: [
      option("haircut", "Haircut (Gupit)", "Scissor", "#C43A6A", "At-home haircut for kids or adults."),
      option("color", "Hair Color & Blow-out", "Sparkles", "#E07A3D", "Color, blow-dry, and simple styling."),
      option("beard", "Beard Trim", "Scissor", "#8A6A3B", "Beard shaping and tidy-up."),
      option("massage", "Massage (Pahilot)", "Leaf", "#1F7A6B", "Traditional hilot, Swedish, or foot massage."),
      option("nails", "Nails", "Sparkles", "#3A73C4", "Manicure and pedicure at home."),
      option("makeup", "Event Makeup", "Sparkles", "#C43A6A", "Makeup for a party, debut, or photos."),
      option("other", "Others", "MoreHorizontal", "#3D5C6E", "I-type ang hindi nakalista."),
    ],
    addons: [
      option("kit", "Tasker Brings Kit", "Package", "#2F6F9A", "Tools and products come with the tasker."),
      option("group", "Group / Family", "Users", "#5B4B8A", "More than one person in the same visit."),
    ],
  }),
  pets: stackedTemplate({
    examples: ["Pet Sitting", "Dog Walk", "Pet Bath", "Vet Run"],
    typeLabel: "Pet care type",
    options: [
      option("sitting", "Pet Sitting", "Home", "#8A6A3B", "In-home feeding, company, and day care."),
      option("boarding", "Boarding", "Home", "#2F6F9A", "Overnight stay at the tasker's place."),
      option("walk", "Dog Walking", "Compass", "#1F7A6B", "A walk around the barangay."),
      option("groom", "Grooming & Bath", "Clean", "#3A73C4", "Mobile bath, brush, and tidy-up."),
      option("errand", "Vet & Supply Run", "Package", "#C46A2E", "Vet visit, pet food, or supply pickup."),
      option("other", "Others", "MoreHorizontal", "#3D5C6E", "I-type ang hindi nakalista."),
    ],
    addons: [
      option("overnight", "Overnight", "Moon", "#5B4B8A", "Stay through the night."),
      option("meds", "Give Medicine", "ShieldCheck", "#1F9D6A", "Follow the owner's dose instructions."),
      option("extra", "Extra Pet", "Users", "#C46A2E", "More than one pet."),
    ],
  }),
};

function option(value, label, icon, color, desc) {
  return { value, label, icon, color, desc, lines: [{ text: desc }] };
}

function stackedTemplate({ examples, typeLabel, options, addons }) {
  return {
    prompt: "Ano ang kailangan mo?",
    promptHint: "What service do you need?",
    layout: "stacked",
    examplesInteractive: false,
    examples,
    fields: [
      {
        key: "service_type",
        label: typeLabel,
        placeholder: "Choose one",
        widget: "select",
        required: true,
        options,
      },
      {
        key: "price_type",
        label: "Uri ng presyo",
        widget: "segment",
        required: true,
        options: [
          { value: "per_hour", label: "Per Hour", desc: "Bayad kada oras. Ang halaga ay ang rate bawat oras." },
          { value: "contract", label: "Contract Price", desc: "Isang presyo para sa buong gawain, hindi kada oras." },
        ],
      },
      {
        key: "addons",
        label: "Karagdagang serbisyo (Additional Services)",
        widget: "addons",
        multiple: true,
        options: addons,
      },
    ],
  };
}

export function templateForKey(categoryKey) {
  return SERVICE_TEMPLATES[categoryKey] || null;
}

export function initialExtras(categoryKey) {
  const template = templateForKey(categoryKey);
  if ((template?.fields || []).some((field) => field.key === "price_type")) return { price_type: "per_hour" };
  return {};
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
  const key = task?.extras?.service_key;
  if (key && SERVICE_TEMPLATES[key]) return SERVICE_TEMPLATES[key];
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
    if (field.multiple) {
      const list = Array.isArray(value) ? value.filter(Boolean) : [];
      if (list.length) out[field.key] = list;
    } else if (value) {
      out[field.key] = value;
    }
  }
  return out;
}

export function missingRequiredField(template, extras) {
  return (template?.fields || []).find((field) => {
    if (!field.required) return false;
    const value = extras?.[field.key];
    if (field.multiple) return !Array.isArray(value) || !value.length;
    return !value;
  }) || null;
}

// [{ key, label, value }] for rendering a saved gawain.
export function describeExtras(task) {
  const template = templateForTask(task);
  if (!template) return [];
  const extras = task?.extras || {};
  return (template.fields || [])
    .map((field) => {
      const raw = extras[field.key];
      if (!raw || (Array.isArray(raw) && !raw.length)) return null;
      if (Array.isArray(raw)) {
        const labels = raw.map((value) => (field.options || []).find((o) => o.value === value)?.label || value);
        return { key: field.key, label: field.label, value: labels.join(", "), desc: "" };
      }
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
