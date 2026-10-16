import { timeAgo } from "@/lib/khaki";
import { vehicleLabel } from "@/lib/serviceTemplates";

export const MEMBER_STATUS_LABEL = {
  waiting: "Waiting",
  active: "Active",
  paused: "Paused",
};

export const PRESENCE_LABEL = {
  waiting: "Waiting",
  online: "Online",
  busy: "Busy",
  inactive: "Inactive",
  paused: "Paused",
  offline: "Offline",
};

export function presenceColors(presence) {
  if (presence === "online") return { bg: "#D7F0EA", fg: "#0D666A" };
  if (presence === "busy") return { bg: "#D6E8FF", fg: "#163044" };
  if (presence === "inactive") return { bg: "#FFF0C4", fg: "#8A6410" };
  if (presence === "paused") return { bg: "#F3EFE3", fg: "#163044" };
  if (presence === "waiting") return { bg: "#EEF2F6", fg: "#3D4A5C" };
  return { bg: "#EEF2F6", fg: "#3D4A5C" };
}

export function ratingLabel(avg, count) {
  const n = Number(avg || 0);
  const reviews = Number(count || 0);
  if (!reviews) return "No rating yet";
  return `${n.toFixed(1)} ★ · ${reviews}`;
}

export function jobsTodayLabel(n) {
  const count = Number(n || 0);
  return count === 1 ? "1 job today" : `${count} jobs today`;
}

export function pauseEndsLabel(pausedUntil) {
  if (!pausedUntil) return "Paused";
  const ms = new Date(pausedUntil).getTime() - Date.now();
  if (ms <= 0) return "Pause ending…";
  const mins = Math.max(1, Math.ceil(ms / 60000));
  return `Paused · ${mins}m left`;
}

export function verifyLabel(status) {
  if (status === "verified") return "Verified";
  if (status === "pending") return "Pending ID";
  return "Unverified";
}

export function verifyColors(status) {
  if (status === "verified") return { bg: "#D7F0EA", fg: "#0D666A" };
  if (status === "pending") return { bg: "#FFF0C4", fg: "#8A6410" };
  return { bg: "#EEF2F6", fg: "#3D4A5C" };
}

export function vehicleLine(row) {
  return [vehicleLabel(row?.vehicle_type), row?.plate_number].filter(Boolean).join(" · ") || "No vehicle yet";
}

// Always "last seen", never a live claim.
export function lastSeenLabel(row) {
  return row?.last_seen_at ? `Last seen ${timeAgo(row.last_seen_at)}` : "Not seen yet";
}

export function initials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "•";
}

export function formatCode(code) {
  const clean = String(code || "");
  return clean.length === 6 ? `${clean.slice(0, 3)}-${clean.slice(3)}` : clean;
}

// Verified, active, non-admin accounts that aren't already leading another active team.
export function eligibleLeads(users, teams, editingTeamId) {
  const taken = new Set(
    (teams || [])
      .filter((team) => team.status === "active" && team.lead_id && team.id !== editingTeamId)
      .map((team) => team.lead_id)
  );
  return (users || []).filter((u) => (
    u.role !== "admin"
    && u.verification_status === "verified"
    && (u.status || "active") === "active"
    && !taken.has(u.id)
    && !u.team
  ));
}
