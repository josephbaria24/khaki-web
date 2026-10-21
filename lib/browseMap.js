import { graphicForTask } from "@/lib/catalog";
import { formatPHP } from "@/lib/khaki";
import { municipalityCoords } from "@/lib/palawanLocations";
import { describePins } from "@/lib/serviceTemplates";

export function isValidLatLng(lat, lng) {
  const la = Number(lat);
  const ln = Number(lng);
  return Number.isFinite(la) && Number.isFinite(ln) && Math.abs(la) <= 90 && Math.abs(ln) <= 180;
}

/** Resolve a map point for a browse task: exact pin first, else town centre. */
export function taskMapPoint(task) {
  if (!task || task.is_remote) return null;
  const graphic = graphicForTask(task);
  const budget = Number(task.budget_php) || 0;
  const base = {
    id: task.id,
    label: task.title,
    budget,
    priceLabel: formatPHP(budget),
    icon: graphic.icon || "Sparkles",
    iconBg: graphic.bg,
    iconInk: graphic.ink,
  };
  const pins = describePins(task);
  const first = pins[0];
  if (first && isValidLatLng(first.lat, first.lng)) {
    return {
      ...base,
      lat: Number(first.lat),
      lng: Number(first.lng),
      exact: true,
    };
  }
  const town = municipalityCoords(task.location_area);
  if (!town || !isValidLatLng(town[0], town[1])) return null;
  return {
    ...base,
    lat: Number(town[0]),
    lng: Number(town[1]),
    exact: false,
  };
}

export function locationLabel(task) {
  if (!task) return "";
  if (task.is_remote) return "Remote";
  const parts = [task.barangay, task.location_area].filter(Boolean);
  return parts.join(", ") || task.location_area || "Palawan";
}

/** Compact list line: "Title • Place" when place is not already in the title. */
export function browseListHeadline(task) {
  const title = String(task?.title || "Task").trim();
  const place = locationLabel(task);
  if (!place || place === "Remote") return title;
  if (title.toLowerCase().includes(place.toLowerCase())) return title;
  return `${title} · ${place}`;
}
