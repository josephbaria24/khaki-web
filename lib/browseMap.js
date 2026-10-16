import { municipalityCoords } from "@/lib/palawanLocations";
import { describePins } from "@/lib/serviceTemplates";

/** Resolve a map point for a browse task: exact pin first, else town centre. */
export function taskMapPoint(task) {
  if (!task || task.is_remote) return null;
  const pins = describePins(task);
  const first = pins[0];
  if (first && Number.isFinite(Number(first.lat)) && Number.isFinite(Number(first.lng))) {
    return {
      id: task.id,
      lat: Number(first.lat),
      lng: Number(first.lng),
      label: task.title,
      exact: true,
    };
  }
  const town = municipalityCoords(task.location_area);
  if (!town) return null;
  return {
    id: task.id,
    lat: town[0],
    lng: town[1],
    label: task.title,
    exact: false,
  };
}

export function locationLabel(task) {
  if (!task) return "";
  if (task.is_remote) return "Remote";
  const parts = [task.barangay, task.location_area].filter(Boolean);
  return parts.join(", ") || task.location_area || "Palawan";
}
