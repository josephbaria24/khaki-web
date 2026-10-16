import { isReverifying } from "@/lib/taskerApplication";
import { isTeamLeadAssignedNotice, TEAM_LEAD_PROFILE_HREF } from "@/lib/teamLeadNotice";

export function isVerificationText(text) {
  return /verif|application was|application is pending|resubmit your application|submitted an application/i.test(text || "");
}

export function verificationNotice(user) {
  if (!user || user.role === "admin") return null;
  const status = user.verification_status;
  const note = user.verification_note || "";
  if (status === "pending") {
    return {
      id: "verification-status",
      kind: "verification",
      href: "/verify",
      title: "Verification pending",
      text: "Your profile application is with admin for review.",
      created_at: user.updated_at || new Date().toISOString(),
    };
  }
  if (isReverifying(user)) {
    return {
      id: "verification-status",
      kind: "verification",
      href: "/profile",
      title: "Re-verifying",
      text: "Your update is with admin. You can keep using your account.",
      created_at: user.updated_at || new Date().toISOString(),
    };
  }
  if (status === "verified") {
    return {
      id: "verification-status",
      kind: "verification",
      href: "/browse",
      title: "Verification approved",
      text: "Your application was approved. You can now post gawain and accept jobs.",
      created_at: user.verified_at || user.updated_at || new Date().toISOString(),
    };
  }
  if (status === "unverified" && note) {
    return {
      id: "verification-status",
      kind: "verification",
      href: "/verify",
      title: "Verification rejected",
      text: note.startsWith("Please") || note.length > 20 ? note : `Your application was not approved. ${note}`.trim(),
      created_at: user.updated_at || new Date().toISOString(),
    };
  }
  return null;
}

export function mergeNotificationFeed(user, notes) {
  const status = verificationNotice(user);
  const rest = (notes || []).filter((row) => row.id !== "verification-status");
  const feed = status ? [status, ...rest] : [...rest];
  return feed.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
}

export function noticeParts(note) {
  const text = String(note?.text || "");
  const verification = note?.kind === "verification" || note?.id === "verification-status";
  if (verification) {
    const name = note.title || "Verification";
    return { name, body: text, initial: name.slice(0, 1).toUpperCase() };
  }
  const split = text.indexOf(": ");
  if (split > 0 && split < 48) {
    const name = text.slice(0, split);
    return { name, body: text.slice(split + 2), initial: name.slice(0, 1).toUpperCase() };
  }
  return { name: "", body: text, initial: (text.slice(0, 1) || "K").toUpperCase() };
}

const VERIFICATION_SEEN_KEY = "khaki-verification-seen";

export function verificationSeenKey(notice) {
  if (!notice) return "";
  return `${notice.title}:${notice.created_at}`;
}

export function isVerificationSeen(notice) {
  if (!notice || typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(VERIFICATION_SEEN_KEY) === verificationSeenKey(notice);
  } catch {
    return false;
  }
}

export function markVerificationSeen(notice) {
  const key = verificationSeenKey(notice);
  if (!key || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(VERIFICATION_SEEN_KEY, key);
  } catch {
    /* ignore private browsing */
  }
}

export function noticeHref(note) {
  if (note?.href) return note.href;
  if (isTeamLeadAssignedNotice(note)) return TEAM_LEAD_PROFILE_HREF;
  if (/Buksan ang Team|Open Team|gustong sumali|team na /i.test(note?.text || "")) return "/team";
  if (note?.task_id && /messaged you/i.test(note.text || "")) return `/task/${note.task_id}/chat`;
  if (note?.task_id) return `/task/${note.task_id}`;
  if (note?.kind === "verification" || isVerificationText(note?.text)) return "/verify";
  return "/dashboard";
}
