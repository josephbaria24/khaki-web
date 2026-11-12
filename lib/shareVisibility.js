export const SHARE_TASK_GROUPS = [
  { id: "open", label: "Open", detail: "Tasks still looking for a tasker" },
  { id: "completed", label: "Completed", detail: "Finished and released tasks" },
  { id: "cancelled", label: "Cancelled", detail: "Tasks you cancelled" },
  { id: "other", label: "Other", detail: "Assigned, in progress, or under review" },
];

export const SHARE_FIELDS = [
  { id: "photo", label: "Profile photo" },
  { id: "about", label: "About" },
  { id: "location", label: "Location" },
  { id: "verified", label: "Verified badge" },
  { id: "history", label: "Posted and open counts" },
];

const TASK_DEFAULTS = { open: true, completed: true, cancelled: true, other: true };

export const DEFAULT_SHARE_VISIBILITY = {
  photo: true,
  about: true,
  location: true,
  verified: true,
  history: true,
  tasks: { ...TASK_DEFAULTS },
};

export function shareVisibility(profile) {
  const raw = profile?.share_visibility && typeof profile.share_visibility === "object" ? profile.share_visibility : {};
  const tasks = raw.tasks && typeof raw.tasks === "object" ? raw.tasks : {};
  return {
    photo: raw.photo !== false,
    about: raw.about !== false,
    location: raw.location !== false,
    verified: raw.verified !== false,
    history: raw.history !== false,
    tasks: {
      open: tasks.open !== false,
      completed: tasks.completed !== false,
      cancelled: tasks.cancelled !== false,
      other: tasks.other !== false,
    },
  };
}

export function taskShareGroup(status) {
  if (status === "open") return "open";
  if (status === "released" || status === "completed") return "completed";
  if (status === "cancelled") return "cancelled";
  return "other";
}

export function publicCanOpenTask(profile, status) {
  const group = taskShareGroup(status);
  return shareVisibility(profile).tasks[group] !== false;
}

export function visiblePostedTasks(tasks, profile, { isOwn = false } = {}) {
  const posted = (tasks || []).filter((task) => task.client_id === profile?.id);
  if (isOwn) return posted;
  const allowed = shareVisibility(profile).tasks;
  return posted.filter((task) => allowed[taskShareGroup(task.status)] !== false);
}
