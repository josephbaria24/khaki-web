import { displayTaskCategory } from "@/lib/khaki";
import { haversineKm, municipalityCoords } from "@/lib/palawanLocations";
import { describePins, vehicleLabel } from "@/lib/serviceTemplates";

export const TRACK_STEPS = [
  { key: "accepted", label: "Accepted" },
  { key: "preparing", label: "Preparing" },
  { key: "on_the_way", label: "On The Way" },
  { key: "arrived", label: "Arrived" },
  { key: "delivered", label: "Delivered" },
];

const ACTIVE = new Set(["offer_accepted", "escrow_locked", "in_progress", "completed_pending_review", "released"]);

export function canTrack(task, userId) {
  if (!task || !userId || !task.accepted_tasker_id) return false;
  if (userId !== task.client_id && userId !== task.accepted_tasker_id) return false;
  return ACTIVE.has(task.status);
}

export function trackStepTimes(task, messages) {
  const stored = task?.extras?.progress?.times || {};
  const progress = task?.extras?.progress?.step;
  const status = task?.status;
  const rows = Array.isArray(messages) ? messages : [];
  const firstAt = (match) => rows.find(match)?.created_at || "";
  const lastAt = (match) => [...rows].reverse().find(match)?.created_at || "";
  const arrived = progress === "arrived" ? (stored.arrived || lastAt((row) => row.text === "Nandito na ako sa drop-off.")) : "";
  const delivered = status === "released" || status === "completed_pending_review"
    ? (stored.delivered || firstAt((row) => row.status_update === "released"))
    : "";
  return [
    stored.accepted || firstAt((row) => row.status_update === "offer_accepted"),
    stored.preparing || firstAt((row) => row.status_update === "in_progress"),
    stored.on_the_way || firstAt((row) => row.text === "Papunta na ako."),
    arrived,
    delivered,
  ];
}

export function trackStepIndex(taskOrStatus) {
  const task = typeof taskOrStatus === "string" ? { status: taskOrStatus } : taskOrStatus || {};
  const status = task.status;
  const progress = task.extras?.progress?.step;
  if (status === "released" || status === "completed_pending_review") return 4;
  if (progress === "arrived" && (status === "in_progress" || status === "escrow_locked")) return 3;
  if (status === "in_progress" || status === "escrow_locked" || progress === "on_the_way") return 2;
  if (status === "offer_accepted") return 1;
  return 0;
}

export function sharedRider(task) {
  const loc = task?.extras?.progress?.location;
  const lat = Number(loc?.lat);
  const lng = Number(loc?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng, at: loc.at || null };
}

export function isLiveStatus(status) {
  return status === "in_progress" || status === "escrow_locked";
}

export function trackingTitle(task) {
  const pins = describePins(task);
  const delivery = /transport|errand|pabili|deliver/i.test(`${task?.category || ""} ${task?.title || ""}`)
    || pins.some((pin) => pin.key === "pickup" || pin.key === "dropoff");
  return delivery ? "Delivery Tracking" : "Job Tracking";
}

export function routeFromTask(task) {
  const pins = task?.is_remote ? [] : describePins(task);
  const pickup = pins.find((pin) => pin.key === "pickup") || null;
  const dropoff = pins.find((pin) => pin.key === "dropoff") || null;
  const site = pins.find((pin) => pin.key === "site") || null;
  const start = pickup || site || null;
  const end = dropoff && dropoff !== start ? dropoff : null;
  const town = municipalityCoords(task?.location_area) || municipalityCoords("Puerto Princesa City");
  return { start, end, town };
}

export function riderPoint(start, end, stepIndex) {
  if (!start && !end) return null;
  if (!start) return { lat: Number(end.lat), lng: Number(end.lng) };
  if (!end) return { lat: Number(start.lat), lng: Number(start.lng) };
  const t = stepIndex <= 1 ? 0.12 : stepIndex === 2 ? 0.55 : stepIndex === 3 ? 0.88 : 1;
  return {
    lat: Number(start.lat) + (Number(end.lat) - Number(start.lat)) * t,
    lng: Number(start.lng) + (Number(end.lng) - Number(start.lng)) * t,
  };
}

export function routeKm(start, end) {
  if (!start || !end) return null;
  return haversineKm([Number(start.lat), Number(start.lng)], [Number(end.lat), Number(end.lng)]);
}

export function formatRouteDistance(km) {
  if (km == null || !Number.isFinite(km)) return "";
  if (km < 1) return `${Math.max(50, Math.round((km * 1000) / 50) * 50)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

export function riderName(fullName) {
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  return parts[0] || "Tasker";
}

export function riderMeta(task, tasker) {
  const vehicle = vehicleLabel(tasker?.vehicle_type) || vehicleLabel(task?.extras?.vehicle_type) || displayTaskCategory(task);
  const plate = tasker?.plate_number || tasker?.vehicle_model || "";
  return plate ? `${vehicle} · ${plate}` : vehicle;
}

export function routeEnds(pins) {
  if (!pins?.length) return null;
  const from = pins.find((pin) => pin.key === "pickup") || pins[0];
  const to = pins.find((pin) => pin.key === "dropoff") || (pins.length > 1 ? pins[pins.length - 1] : null);
  if (!from || !to || from === to) return null;
  return { from, to };
}

export async function drivingRoute(from, to) {
  if (!from || !to) return null;
  const url = `https://router.project-osrm.org/route/v1/driving/${Number(from.lng)},${Number(from.lat)};${Number(to.lng)},${Number(to.lat)}?overview=full&geometries=geojson`;
  const response = await fetch(url);
  if (!response.ok) return null;
  const data = await response.json();
  const route = data?.routes?.[0];
  const coordinates = route?.geometry?.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length < 2) return null;
  return {
    points: coordinates.map((pair) => ({ lat: Number(pair[1]), lng: Number(pair[0]) })),
    meters: Number(route.distance),
    seconds: Number(route.duration),
  };
}

export function routeSummary(route) {
  if (!route || !Number.isFinite(route.meters) || !Number.isFinite(route.seconds)) return "";
  const km = route.meters / 1000;
  const distance = km < 1 ? `${Math.max(50, Math.round(route.meters / 50) * 50)} m` : km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`;
  const mins = Math.max(1, Math.round(route.seconds / 60));
  return `${mins} min · ${distance}`;
}

export function ratingSummary(reviews) {
  const rows = (reviews || []).filter((row) => Number(row.rating) > 0);
  if (!rows.length) return null;
  const avg = rows.reduce((sum, row) => sum + Number(row.rating), 0) / rows.length;
  return { avg, count: rows.length, text: avg.toFixed(1) };
}
