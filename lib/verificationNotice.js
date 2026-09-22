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
  return status ? [status, ...rest] : rest;
}

export function noticeHref(note) {
  if (note?.href) return note.href;
  if (note?.task_id && /messaged you/i.test(note.text || "")) return `/task/${note.task_id}/chat`;
  if (note?.task_id) return `/task/${note.task_id}`;
  if (note?.kind === "verification" || isVerificationText(note?.text)) return "/verify";
  return "/dashboard";
}
