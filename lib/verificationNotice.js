import { isReverifying } from "@/lib/taskerApplication";
import { isTeamLeadAssignedNotice, TEAM_LEAD_PROFILE_HREF } from "@/lib/teamLeadNotice";

export function isVerificationText(text) {
  return /verif|application was|application is pending|resubmit your application|submitted an application/i.test(text || "");
}

function noticeAvatar(user) {
  return user?.avatar_url || user?.profile_photo || null;
}

export function verificationNotice(user) {
  if (!user || user.role === "admin") return null;
  const status = user.verification_status;
  const note = user.verification_note || "";
  const avatar_url = noticeAvatar(user);
  const submittedAt = user.tasker_application?.submitted_at || null;
  // Only surface live verification states that still need attention.
  // "Approved" is a one-shot DB notification from admin decide — do not
  // re-inject it from profile status on every login (updated_at churn).
  if (status === "pending") {
    return {
      id: "verification-status",
      kind: "verification",
      href: "/verify",
      title: "Verification pending",
      text: "Your profile application is with admin for review.",
      created_at: submittedAt || user.updated_at || new Date().toISOString(),
      seen_key: `pending:${user.id}:${submittedAt || ""}`,
      avatar_url,
    };
  }
  if (isReverifying(user)) {
    return {
      id: "verification-status",
      kind: "verification",
      href: "/profile",
      title: "Re-verifying",
      text: "Your update is with admin. You can keep using your account.",
      created_at: submittedAt || user.updated_at || new Date().toISOString(),
      seen_key: `reverify:${user.id}:${submittedAt || ""}`,
      avatar_url,
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
      seen_key: `rejected:${user.id}:${note}`,
      avatar_url,
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

export function noticeActorName(note) {
  if (!note || note.kind === "verification" || note.id === "verification-status") return "";
  const text = String(note.text || "");
  const patterns = [
    /^(.+?) messaged you\b/i,
    /^Bagong bid ni (.+?) sa\b/i,
    /^In-adjust ni (.+?) ang bid\b/i,
    /^May \d+-star rating ka from (.+?) for\b/i,
    /^(.+?) reported\b/i,
    /^Napili si (.+?) para sa\b/i,
  ];
  for (const re of patterns) {
    const match = text.match(re);
    if (match?.[1]) return match[1].trim();
  }
  const split = text.indexOf(": ");
  if (split > 0 && split < 48) {
    const name = text.slice(0, split).trim();
    if (name && !name.startsWith('"') && !/^Memo from/i.test(name)) return name;
  }
  return "";
}

export function noticeParts(note) {
  const text = String(note?.text || "");
  const avatar_url = note?.avatar_url || null;
  const verification = note?.kind === "verification" || note?.id === "verification-status";
  if (verification) {
    const name = note.title || "Verification";
    return { name, body: text, initial: name.slice(0, 1).toUpperCase(), avatar_url, actorName: "" };
  }
  const msg = text.match(/^(.+?) messaged you(.*)$/i);
  if (msg) {
    const name = msg[1].trim();
    const body = (`messaged you${msg[2] || ""}`).trim();
    return { name, body, initial: name.slice(0, 1).toUpperCase(), avatar_url, actorName: name };
  }
  const actor = noticeActorName(note);
  const split = text.indexOf(": ");
  if (split > 0 && split < 48) {
    const name = text.slice(0, split).trim();
    if (name && !name.startsWith('"') && !/^Memo from/i.test(name)) {
      return { name, body: text.slice(split + 2), initial: name.slice(0, 1).toUpperCase(), avatar_url, actorName: name };
    }
  }
  if (actor) {
    return {
      name: "",
      body: text,
      initial: actor.slice(0, 1).toUpperCase(),
      avatar_url,
      actorName: actor,
    };
  }
  return { name: "", body: text, initial: (text.slice(0, 1) || "K").toUpperCase(), avatar_url, actorName: "" };
}

const VERIFICATION_SEEN_KEY = "khaki-verification-seen";

export function verificationSeenKey(notice) {
  if (!notice) return "";
  if (notice.seen_key) return notice.seen_key;
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
  if (/payout of|was released/i.test(note?.text || "")) {
    return note?.task_id ? `/wallet?task=${note.task_id}` : "/wallet";
  }
  if (note?.task_id && /messaged you/i.test(note.text || "")) return `/task/${note.task_id}/chat`;
  if (note?.task_id) return `/task/${note.task_id}`;
  if (note?.kind === "verification" || isVerificationText(note?.text)) return "/verify";
  return "/dashboard";
}
