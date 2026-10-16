const SEEN_KEY = "khaki-team-lead-welcome-seen";

export function isTeamLeadAssignedNotice(note) {
  return /Ikaw na ang team lead|You're now the team lead/i.test(String(note?.text || ""));
}

export function teamNameFromLeadNotice(note) {
  const text = String(note?.text || "");
  const match = text.match(/team lead (?:ng|of)\s+(.+?)(?:\.|$)/i);
  return (match?.[1] || "").trim() || "your team";
}

export function teamLeadWelcomeKey(note) {
  if (!note) return "";
  return `${note.id || ""}:${note.created_at || ""}:${teamNameFromLeadNotice(note)}`;
}

export function isTeamLeadWelcomeSeen(note) {
  if (!note || typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(SEEN_KEY);
    if (!raw) return false;
    const seen = JSON.parse(raw);
    return Array.isArray(seen) && seen.includes(teamLeadWelcomeKey(note));
  } catch {
    return false;
  }
}

export function markTeamLeadWelcomeSeen(note) {
  if (!note || typeof window === "undefined") return;
  const key = teamLeadWelcomeKey(note);
  if (!key) return;
  try {
    const raw = window.localStorage.getItem(SEEN_KEY);
    const seen = raw ? JSON.parse(raw) : [];
    const next = Array.isArray(seen) ? seen.filter(Boolean) : [];
    if (!next.includes(key)) next.push(key);
    window.localStorage.setItem(SEEN_KEY, JSON.stringify(next.slice(-20)));
  } catch {
    /* ignore private browsing */
  }
}

export const TEAM_LEAD_PROFILE_HREF = "/profile?highlight=rider-team";
