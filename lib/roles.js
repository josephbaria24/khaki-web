export const ROLES = {
  poster: "poster",
  tasker: "tasker",
  admin: "admin",
};

export const ROLE_LABELS = {
  poster: "Poster",
  tasker: "Tasker",
  admin: "Admin",
};

export const MODE_STORAGE_KEY = "khaki.mode";

export function readStoredMode() {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(MODE_STORAGE_KEY);
    return value === "poster" || value === "tasker" ? value : null;
  } catch {
    return null;
  }
}

export function writeStoredMode(mode) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MODE_STORAGE_KEY, mode);
  } catch {
    // ignore quota / private mode
  }
}

export function activeMode(user) {
  if (!user) return "poster";
  if (user.active_mode === "poster" || user.active_mode === "tasker") return user.active_mode;
  const stored = readStoredMode();
  if (stored) return stored;
  return user.role === "tasker" ? "tasker" : "poster";
}

export function isAdmin(user) {
  return user?.role === "admin";
}

export function isPoster(user) {
  return user?.role === "poster";
}

export function isTasker(user) {
  return user?.role === "tasker";
}

export function isPosterMode(user) {
  return activeMode(user) === "poster";
}

export function isTaskerMode(user) {
  return activeMode(user) === "tasker";
}

export function isIdVerified(user) {
  if (!user) return false;
  if (user.role === "admin") return true;
  return user.verification_status === "verified";
}

export function canOpenPost(user) {
  if (!user || user.status === "suspended") return false;
  if (user.role === "admin") return true;
  return activeMode(user) === "poster";
}

export function canPostTask(user) {
  if (!canOpenPost(user)) return false;
  if (user.role === "admin") return true;
  return isIdVerified(user);
}

export function canAcceptJobs(user) {
  if (!user || user.status === "suspended") return false;
  if (user.role === "admin") return true;
  return activeMode(user) === "tasker" && isIdVerified(user);
}

export function needsVerification(user) {
  return Boolean(user) && user.role !== "admin" && user.status !== "suspended" && !isIdVerified(user);
}

export function needsTaskerVerification(user) {
  return needsVerification(user);
}

export function canSubmitVerification(user) {
  if (!user || user.status === "suspended") return false;
  return user.role !== "admin";
}

export function homePathFor(user) {
  if (!user) return "/login";
  if (user.role === "admin") return "/admin";
  return "/dashboard";
}

export function fileMeta(file) {
  if (!file) return null;
  return {
    name: file.name,
    size: file.size || 0,
    type: file.type || "application/octet-stream",
    uploaded_at: new Date().toISOString(),
  };
}
