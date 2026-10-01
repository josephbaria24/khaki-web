"use client";

import { TASKER_LOCKED_NOTICE } from "@/lib/khaki";
import { canAcceptJobs, isAdmin, isIdVerified, isPosterMode, readStoredMode, writeStoredMode } from "@/lib/roles";
import { supabase } from "@/lib/supabase";

function throwIf(error, fallback) {
  if (error) throw new Error(error.message || fallback);
}

function fingerprint(value) {
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}

const feedCache = {
  notifications: { key: "", rows: null, unread: null },
  threads: { key: "", rows: null },
  chats: new Map(),
  tasks: { key: "", rows: null },
  taskById: new Map(),
};
const unreadWatchers = new Set();

function clearFeedCache() {
  feedCache.notifications = { key: "", rows: null, unread: null };
  feedCache.threads = { key: "", rows: null };
  feedCache.chats.clear();
  feedCache.tasks = { key: "", rows: null };
  feedCache.taskById.clear();
}

function rememberList(bucket, rows) {
  const key = fingerprint(rows);
  if (bucket.key === key && bucket.rows) return bucket.rows;
  bucket.key = key;
  bucket.rows = rows;
  return rows;
}

function rememberChat(taskId, rows) {
  const key = fingerprint(rows);
  const prev = feedCache.chats.get(taskId);
  if (prev && prev.key === key) return prev.rows;
  feedCache.chats.set(taskId, { key, rows });
  return rows;
}

function rememberTask(row) {
  if (row?.id) feedCache.taskById.set(row.id, row);
  return row;
}

function rememberTasks(rows) {
  const next = rememberList(feedCache.tasks, rows);
  (next || []).forEach(rememberTask);
  return next;
}

function uniqueChannel(name) {
  return `${name}-${Math.random().toString(36).slice(2, 9)}`;
}

function changedEmitter(onChange) {
  let lastKey = "";
  return (rows) => {
    const key = fingerprint(rows);
    if (key === lastKey) return;
    lastKey = key;
    onChange(rows);
  };
}

function emitUnread(count) {
  const next = Number(count) || 0;
  if (feedCache.notifications.unread === next) return;
  feedCache.notifications.unread = next;
  unreadWatchers.forEach((fn) => {
    try {
      fn(next);
    } catch {
      /* ignore */
    }
  });
}

async function sessionUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error && /session missing/i.test(error.message)) return null;
  if (error) throw new Error(error.message);
  return data.user || null;
}

function applyMode(profile) {
  if (!profile) return profile;
  const dbMode = profile.active_mode === "poster" || profile.active_mode === "tasker" ? profile.active_mode : null;
  const stored = readStoredMode();
  const active_mode = dbMode || stored || (profile.role === "tasker" ? "tasker" : "poster");
  return { ...profile, active_mode };
}

function applicationBits(row) {
  const fromCreds = (row?.credentials || []).find((c) => c?.application)?.application || {};
  return row?.tasker_application || fromCreds || {};
}

function publicProfile(row) {
  if (!row) return null;
  const app = applicationBits(row);
  const skills = Array.isArray(row.skills) && row.skills.length ? row.skills : (app.skills || []);
  return {
    id: row.id,
    role: row.role,
    full_name: row.full_name || app.full_name || "",
    headline: row.headline,
    bio: row.bio,
    phone: row.phone,
    location_area: row.location_area,
    barangay: row.barangay,
    skills,
    avatar_url: row.avatar_url,
    verification_status: row.verification_status,
    verified_at: row.verified_at,
    price_type: row.price_type || "Per Hour",
    price_amount: row.price_amount || app.daily_rate || null,
    price_description: row.price_description,
    vehicle_type: row.vehicle_type || null,
    vehicle_model: row.vehicle_model || null,
    plate_number: row.plate_number || null,
    last_seen_at: row.last_seen_at || null,
    experience_years: app.experience_years || "",
    gcash_verified: Boolean(app.gcash_number),
    created_at: row.created_at,
  };
}

function missingColumn(error) {
  return /column|schema cache|could not find|does not exist/i.test(error?.message || "");
}

async function persistIdDocument(_userId, doc) {
  if (!doc?.url?.startsWith("http")) {
    throw new Error("The ID photo did not upload. Attach the photo again.");
  }
  return {
    name: doc.name,
    type: doc.type || "",
    size: doc.size || 0,
    url: doc.url,
    public_id: doc.public_id || "",
    uploaded_at: doc.uploaded_at || new Date().toISOString(),
  };
}

async function withSignedId(row) {
  const doc = row?.id_document;
  if (!doc?.file_path || doc.data || doc.url) return row;
  const { data, error } = await supabase.storage.from("verification").createSignedUrl(doc.file_path, 60 * 60);
  if (error || !data?.signedUrl) return row;
  return { ...row, id_document: { ...doc, url: data.signedUrl } };
}

async function updateProfileFields(id, patch) {
  let payload = { ...patch };
  for (let i = 0; i < 14; i += 1) {
    const { data, error } = await supabase.from("profiles").update(payload).eq("id", id).select().single();
    if (!error) return data;
    const quoted = String(error.message || "").match(/column ["']?([a-z0-9_]+)["']?/i);
    const drop = quoted?.[1] && quoted[1] in payload
      ? quoted[1]
      : Object.keys(payload).find((k) => k !== "verification_status" && missingColumn(error));
    if (!drop || !(drop in payload)) throw new Error(error.message || "Could not update profile");
    const { [drop]: _, ...rest } = payload;
    payload = rest;
  }
  throw new Error("Could not update profile");
}

async function loadProfile(userId, email) {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  throwIf(error, "Could not load profile");
  if (!data) return null;
  return applyMode({ ...data, email: email || "" });
}

async function waitForProfile(userId, email, tries = 10) {
  for (let i = 0; i < tries; i += 1) {
    const profile = await loadProfile(userId, email);
    if (profile) return profile;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return null;
}

async function requireMe() {
  const user = await sessionUser();
  if (!user) throw new Error("Login required");
  const profile = await waitForProfile(user.id, user.email);
  if (!profile) throw new Error("Profile not found");
  if (profile.status === "suspended") throw new Error("This account is suspended. Contact support.");
  return profile;
}

async function pushLog({ actor_id, actor_name, action, detail, target_id }) {
  await supabase.from("activity_logs").insert({
    actor_id: actor_id || null,
    actor_name: actor_name || "System",
    action,
    detail: detail || "",
    target_id: target_id ? String(target_id) : null,
  });
}

function assertCanPostTask(me) {
  if (!me || me.status === "suspended") throw new Error("This account is suspended. Contact support.");
  if (isAdmin(me)) return;
  if (!isPosterMode(me)) throw new Error("I-switch muna sa Poster mode para mag-post ng gawain.");
  if (!isIdVerified(me)) {
    if (me.verification_status === "pending") {
      throw new Error("Hinihintay pa ang approval ng admin bago mag-post.");
    }
    throw new Error("I-submit muna ang verification para makapag-post at makatanggap ng gawain.");
  }
}

async function requireIdOnNewAccount(profile) {
  if (!profile || isAdmin(profile)) return profile;
  if (profile.verified_at || profile.id_document) return profile;
  if (profile.verification_status !== "verified") return profile;
  const { data, error } = await supabase
    .from("profiles")
    .update({ verification_status: "unverified" })
    .eq("id", profile.id)
    .select()
    .single();
  if (error || !data) return profile;
  return applyMode({ ...data, email: profile.email });
}

// confirm_assignment / decline_assignment own the whole transition — task row,
// offers, chat message, notification — so the client just relays the result.
async function assignmentRpc(fn, taskId, fallbackMessage) {
  await requireMe();
  const { data, error } = await supabase.rpc(fn, { p_task_id: taskId });
  if (error) {
    const msg = error.message || "";
    if (/could not find the function|schema cache/i.test(msg)) {
      throw new Error("Run supabase/assignment.sql in the SQL Editor.");
    }
    throw new Error(msg || fallbackMessage);
  }
  const task = Array.isArray(data) ? data[0] : data;
  return task ? rememberTask(task) : null;
}

async function postTaskDirect(me, input) {
  assertCanPostTask(me);
  const budget = Number(input.budget_php);
  const fee = Math.max(1, Math.round(budget * 0.02));
  const inserted = await supabase.from("tasks").insert({
    client_id: me.id,
    client_name: me.full_name,
    title: String(input.title || "").trim(),
    category: input.category,
    location_area: input.location_area,
    barangay: input.barangay || null,
    location_detail: input.location_detail || null,
    is_remote: Boolean(input.is_remote),
    schedule_type: input.schedule_type || "flexible",
    schedule_date: input.schedule_date || null,
    budget_php: budget,
    deposit_amount: fee,
    deposit_paid: true,
    details: input.details || "",
    image_urls: input.image_urls || [],
    extras: input.extras || {},
    status: "open",
    offer_count: 0,
  }).select().single();
  throwIf(inserted.error, "Could not post task");
  await supabase.from("posting_fees").insert({
    task_id: inserted.data.id,
    poster_id: me.id,
    poster_name: me.full_name,
    budget_php: budget,
    fee_php: fee,
  });
  await pushLog({
    actor_id: me.id,
    actor_name: me.full_name,
    action: "task_posted",
    detail: `Posted "${inserted.data.title}" · posting fee ₱${fee}`,
    target_id: inserted.data.id,
  });
  return inserted.data;
}

async function ensureProfile(authUser, extras = {}) {
  let profile = await waitForProfile(authUser.id, authUser.email);
  if (!profile && extras.full_name) {
    const accountRole = extras.role === "tasker" ? "tasker" : "poster";
    const isCompany = accountRole === "poster" && extras.poster_type === "company";
    const row = {
      id: authUser.id,
      full_name: extras.full_name,
      role: accountRole,
      poster_type: accountRole === "poster" ? (isCompany ? "company" : "individual") : null,
      company_name: isCompany ? (extras.company_name || extras.full_name) : "",
      verification_status: "unverified",
      status: "active",
      active_mode: accountRole === "tasker" ? "tasker" : "poster",
    };
    let insert = await supabase.from("profiles").insert(row);
    if (insert.error && missingColumn(insert.error)) {
      const { active_mode, ...rest } = row;
      insert = await supabase.from("profiles").insert(rest);
    }
    if (insert.error && !/duplicate/i.test(insert.error.message)) throwIf(insert.error, "Could not create profile");
    await supabase.from("wallets").insert({ user_id: authUser.id });
    profile = await waitForProfile(authUser.id, authUser.email);
  }
  if (!profile) throw new Error("Profile was not created. Try logging in.");
  if (profile.status === "suspended") {
    await supabase.auth.signOut();
    throw new Error("This account is suspended. Contact support.");
  }
  return profile;
}

export const api = {
  auth: {
    async me() {
      const user = await sessionUser();
      if (!user) return null;
      return loadProfile(user.id, user.email);
    },
    async login(email, password) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: String(email || "").trim(),
        password,
      });
      if (error && /not confirmed|email not confirmed/i.test(error.message || "")) {
        throw new Error("Email confirmation is still on. Run supabase/autoconfirm.sql in the SQL Editor, then try again.");
      }
      throwIf(error, "Invalid email or password");
      return ensureProfile(data.user);
    },
    async register({ email, password, full_name, role, poster_type, company_name }) {
      const accountRole = role === "tasker" ? "tasker" : "poster";
      const isCompany = accountRole === "poster" && poster_type === "company";
      const trimmed = String(email || "").trim();
      const extras = { full_name, role: accountRole, poster_type, company_name };
      const { data, error } = await supabase.auth.signUp({
        email: trimmed,
        password,
        options: {
          data: {
            full_name,
            role: accountRole,
            poster_type: accountRole === "poster" ? (isCompany ? "company" : "individual") : null,
            company_name: isCompany ? (company_name || full_name) : null,
          },
        },
      });
      if (error && /already registered|already been registered/i.test(error.message || "")) {
        throw new Error("This email is already registered. Log in instead.");
      }
      throwIf(error, "Registration failed");
      if (!data.user) throw new Error("Registration failed");
      if (Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        throw new Error("This email is already registered. Log in instead.");
      }
      let authUser = data.user;
      if (!data.session) {
        const signedIn = await supabase.auth.signInWithPassword({ email: trimmed, password });
        if (signedIn.error && /not confirmed|email not confirmed/i.test(signedIn.error.message || "")) {
          throw new Error("Email confirmation is still on. Run supabase/autoconfirm.sql in the SQL Editor, then try again.");
        }
        throwIf(signedIn.error, "Registration failed");
        authUser = signedIn.data.user;
      }
      return requireIdOnNewAccount(await ensureProfile(authUser, extras));
    },
    async verifySignupOtp(email, token) {
      const code = String(token || "").replace(/\s/g, "");
      if (!/^\d{6}$/.test(code)) throw new Error("Enter the 6-digit code from your email.");
      const { data, error } = await supabase.auth.verifyOtp({
        email: String(email || "").trim(),
        token: code,
        type: "signup",
      });
      throwIf(error, "Invalid or expired code");
      if (!data.user) throw new Error("Could not verify code");
      return requireIdOnNewAccount(await ensureProfile(data.user));
    },
    async resendSignupOtp(email) {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: String(email || "").trim(),
      });
      throwIf(error, "Could not resend code");
    },
    async logout() {
      clearFeedCache();
      await supabase.auth.signOut();
    },
    async resetPassword(email) {
      const { error } = await supabase.auth.resetPasswordForEmail(String(email || "").trim(), {
        redirectTo: typeof window !== "undefined" ? `${window.location.origin}/login` : undefined,
      });
      throwIf(error, "Could not send reset email");
    },
  },

  tasks: {
    peek() {
      return feedCache.tasks.rows;
    },
    peekOne(taskId) {
      return taskId ? feedCache.taskById.get(taskId) || null : null;
    },
    async list() {
      const { data, error } = await supabase.from("tasks").select("*").order("created_at", { ascending: false });
      throwIf(error, "Could not load tasks");
      return rememberTasks(data || []);
    },
    async get(taskId) {
      const { data, error } = await supabase.from("tasks").select("*").eq("id", taskId).maybeSingle();
      throwIf(error, "Could not load task");
      if (!data) return null;
      const prev = feedCache.taskById.get(taskId);
      if (prev && fingerprint(prev) === fingerprint(data)) return prev;
      return rememberTask(data);
    },
    async create(input) {
      const me = await requireMe();
      assertCanPostTask(me);
      const { data, error } = await supabase.rpc("post_task", {
        p_title: input.title,
        p_category: input.category,
        p_location_area: input.location_area,
        p_barangay: input.barangay || null,
        p_location_detail: input.location_detail || null,
        p_is_remote: Boolean(input.is_remote),
        p_schedule_type: input.schedule_type || "flexible",
        p_schedule_date: input.schedule_date || null,
        p_budget_php: Number(input.budget_php),
        p_details: input.details || "",
        p_image_urls: input.image_urls || [],
        p_extras: input.extras || {},
      });
      if (error) {
        const msg = error.message || "";
        if (/could not find the function|schema cache/i.test(msg)) {
          throw new Error("Could not post. Run supabase/rpcs.sql then supabase/task_extras.sql in the SQL Editor.");
        }
        if (/Only posters can post|Insufficient wallet|Top up/i.test(msg)) {
          return postTaskDirect(me, input);
        }
        throw new Error(msg || "Could not post task");
      }
      return data;
    },
    async update(taskId, patch) {
      const me = await requireMe();
      const { data: task, error: loadError } = await supabase.from("tasks").select("*").eq("id", taskId).single();
      throwIf(loadError, "Hindi mahanap ang gawain");
      if (task.client_id !== me.id && !isAdmin(me)) throw new Error("Ikaw lang ang poster na puwedeng mag-edit nito.");
      if (task.status !== "open" || task.accepted_tasker_id) throw new Error("Hindi na puwedeng i-edit ang details. May tinanggap nang bid.");
      const allowed = {
        title: patch.title,
        details: patch.details,
        category: patch.category,
        location_area: patch.location_area,
        barangay: patch.barangay || null,
        location_detail: patch.location_detail || null,
        is_remote: Boolean(patch.is_remote),
        schedule_type: patch.schedule_type || task.schedule_type,
        schedule_date: patch.schedule_date || null,
        budget_php: Number(patch.budget_php),
      };
      if (!allowed.title || String(allowed.title).trim().length < 4) throw new Error("Lagyan ng mas malinaw na title.");
      if (Number(allowed.budget_php) < 50) throw new Error("Minimum budget is ₱50");
      const { data, error } = await supabase.from("tasks").update(allowed).eq("id", taskId).select().single();
      throwIf(error, "Hindi ma-save ang gawain");
      return rememberTask(data);
    },
    async complete(taskId) {
      const me = await requireMe();
      const { data: task, error: loadError } = await supabase.from("tasks").select("*").eq("id", taskId).single();
      throwIf(loadError, "Task not found");
      if (task.client_id !== me.id && !isAdmin(me)) throw new Error("Only the poster can mark this complete");
      if (task.status !== "in_progress") {
        throw new Error("Hindi pa ongoing ang gawain na ito.");
      }
      const { data, error } = await supabase.from("tasks").update({ status: "released" }).eq("id", taskId).select().single();
      throwIf(error, "Could not complete task");
      await supabase.from("messages").insert({
        task_id: taskId,
        sender_id: null,
        sender_name: "System",
        sender_role: "client",
        text: "Task marked complete. Payment stays between poster and tasker — Khaki does not hold the task fee.",
        status_update: "released",
      });
      if (task.accepted_tasker_id) {
        await supabase.from("notifications").insert({
          user_id: task.accepted_tasker_id,
          task_id: taskId,
          text: `"${task.title}" was marked complete.`,
        });
      }
      feedCache.tasks = { key: "", rows: null };
      return rememberTask(data);
    },
    async cancel(taskId) {
      const me = await requireMe();
      const { data: task, error: loadError } = await supabase.from("tasks").select("*").eq("id", taskId).single();
      throwIf(loadError, "Hindi mahanap ang gawain");
      if (task.client_id !== me.id && !isAdmin(me)) throw new Error("Ikaw lang ang poster na puwedeng mag-cancel nito.");
      if (task.status === "cancelled") throw new Error("Cancelled na ang gawain na ito.");
      if (!["open", "offer_accepted"].includes(task.status)) {
        throw new Error("Ongoing na ang gawain. Hired jobs stay on chat until marked complete.");
      }
      const { data, error } = await supabase.from("tasks").update({ status: "cancelled", accepted_tasker_id: null }).eq("id", taskId).select().single();
      throwIf(error, "Hindi ma-cancel ang gawain");
      // Includes the awaiting tasker, whose bid is 'accepted' rather than 'pending'.
      const { data: bids } = await supabase.from("offers").select("id, tasker_id").eq("task_id", taskId).in("status", ["pending", "accepted"]);
      await Promise.all((bids || []).map((row) => (
        supabase.from("offers").update({ status: "declined" }).eq("id", row.id)
      )));
      const bidderIds = [...new Set((bids || []).map((row) => row.tasker_id).filter(Boolean))];
      if (bidderIds.length) {
        await supabase.from("notifications").insert(
          bidderIds.map((user_id) => ({
            user_id,
            task_id: taskId,
            text: `"${task.title}" was cancelled. Bidding is closed.`,
          }))
        );
      }
      await supabase.from("messages").insert({
        task_id: taskId,
        sender_id: null,
        sender_name: "System",
        sender_role: "client",
        text: "This gawain was cancelled by the poster. The 2% posting fee is not refunded.",
        status_update: "cancelled",
      });
      await pushLog({
        actor_id: me.id,
        actor_name: me.full_name,
        action: "task_cancelled",
        detail: `Cancelled "${task.title}"`,
        target_id: taskId,
      });
      feedCache.tasks = { key: "", rows: null };
      return rememberTask(data);
    },
    subscribeMine(onChange) {
      if (typeof onChange !== "function") return () => {};
      let live = true;
      const emit = changedEmitter(onChange);
      if (feedCache.tasks.rows) emit(feedCache.tasks.rows);
      const pull = async () => {
        if (!live) return;
        try {
          const rows = await api.tasks.list();
          if (live) emit(rows);
        } catch {
          if (live && !feedCache.tasks.rows) emit([]);
        }
      };
      pull();
      let channel;
      (async () => {
        try {
          const me = await requireMe();
          if (!live) return;
          channel = supabase
            .channel(uniqueChannel(`my-tasks-${me.id}`))
            .on("postgres_changes", { event: "*", schema: "public", table: "tasks", filter: `client_id=eq.${me.id}` }, () => { pull(); })
            .on("postgres_changes", { event: "*", schema: "public", table: "tasks", filter: `accepted_tasker_id=eq.${me.id}` }, () => { pull(); })
            .subscribe();
        } catch {
          /* keep last snapshot */
        }
      })();
      return () => {
        live = false;
        if (channel) supabase.removeChannel(channel);
      };
    },
  },

  offers: {
    async listByTask(taskId) {
      const { data, error } = await supabase.from("offers").select("*").eq("task_id", taskId).order("created_at", { ascending: true });
      throwIf(error, "Could not load offers");
      return data || [];
    },
    async listMine() {
      const me = await requireMe();
      const { data, error } = await supabase.from("offers").select("*").eq("tasker_id", me.id).order("created_at", { ascending: false });
      throwIf(error, "Hindi ma-load ang mga bid mo");
      return data || [];
    },
    async countsByTask(taskIds) {
      const ids = [...new Set((taskIds || []).filter(Boolean))];
      if (!ids.length) return {};
      const { data, error } = await supabase.from("offers").select("task_id").in("task_id", ids);
      if (error) return {};
      const counts = {};
      for (const row of data || []) {
        counts[row.task_id] = (counts[row.task_id] || 0) + 1;
      }
      return counts;
    },
    async create({ task_id, amount_php, pitch }) {
      const me = await requireMe();
      const { data: task, error: taskError } = await supabase.from("tasks").select("*").eq("id", task_id).single();
      throwIf(taskError, "Task not found");
      if (task.client_id === me.id) throw new Error("Hindi ka puwedeng mag-bid sa sarili mong gawain.");
      if (task.status !== "open") throw new Error("Sarado na ang bidding dito.");
      if (!canAcceptJobs(me)) {
        if (me.active_mode !== "tasker") throw new Error("I-switch sa Tasker mode para sumali sa bidding.");
        throw new Error("I-submit muna ang verification para makapag-bid.");
      }
      const fee = Number(amount_php);
      if (fee < 50) throw new Error("Minimum bid is ₱50");
      const { data: existing } = await supabase.from("offers").select("*").eq("task_id", task_id).eq("tasker_id", me.id).maybeSingle();
      if (existing) {
        if (existing.status !== "pending") throw new Error("Hindi na puwedeng i-adjust ang bid na 'to.");
        return api.offers.update(existing.id, { amount_php: fee, pitch });
      }
      const { data, error } = await supabase.from("offers").insert({
        task_id,
        tasker_id: me.id,
        tasker_name: me.full_name,
        amount_php: fee,
        pitch,
        status: "pending",
      }).select().single();
      throwIf(error, "Hindi ma-send ang bid");
      await supabase.from("tasks").update({ offer_count: (task.offer_count || 0) + 1 }).eq("id", task_id);
      await supabase.from("notifications").insert({
        user_id: task.client_id,
        task_id,
        text: `Bagong bid ni ${me.full_name} sa "${task.title}" — ₱${fee}.`,
      });
      await pushLog({
        actor_id: me.id,
        actor_name: me.full_name,
        action: "offer_sent",
        detail: `Offered ₱${fee} on "${task.title}"`,
        target_id: data.id,
      });
      return data;
    },
    async update(offerId, { amount_php, pitch }) {
      const me = await requireMe();
      const { data: offer, error: offerError } = await supabase.from("offers").select("*").eq("id", offerId).single();
      throwIf(offerError, "Hindi mahanap ang bid");
      if (offer.tasker_id !== me.id) throw new Error("Ikaw lang ang puwedeng mag-adjust ng bid mo.");
      if (offer.status !== "pending") throw new Error("Pending pa dapat ang bid bago i-adjust.");
      const { data: task, error: taskError } = await supabase.from("tasks").select("*").eq("id", offer.task_id).single();
      throwIf(taskError, "Task not found");
      if (task.status !== "open") throw new Error("Sarado na ang bidding dito.");
      const fee = Number(amount_php);
      if (fee < 50) throw new Error("Minimum bid is ₱50");
      const { data, error } = await supabase.from("offers").update({
        amount_php: fee,
        pitch: pitch == null ? offer.pitch : pitch,
        tasker_name: me.full_name,
      }).eq("id", offerId).select().single();
      throwIf(error, "Hindi ma-update ang bid");
      await supabase.from("notifications").insert({
        user_id: task.client_id,
        task_id: task.id,
        text: `In-adjust ni ${me.full_name} ang bid sa "${task.title}" — ₱${fee}.`,
      });
      return data;
    },
    async accept(offerId) {
      const me = await requireMe();
      const { data: offer, error: offerError } = await supabase.from("offers").select("*").eq("id", offerId).single();
      throwIf(offerError, "Offer not found");
      const { data: task, error: taskError } = await supabase.from("tasks").select("*").eq("id", offer.task_id).single();
      throwIf(taskError, "Task not found");
      if (task.client_id !== me.id) throw new Error("Only the client can accept");
      if (task.accepted_tasker_id || task.status !== "open") throw new Error(TASKER_LOCKED_NOTICE);
      if (offer.status !== "pending") throw new Error("Hindi na pending ang bid na 'to.");

      // Claim the task before touching any bid, so two accepts racing on the
      // same gawain cannot both win and double-book the poster. The gawain waits
      // in offer_accepted until the tasker confirms; losing bids stay pending so
      // a decline can reopen it without chasing everyone back.
      const { data: claimed, error: taskUpdateError } = await supabase.from("tasks").update({
        status: "offer_accepted",
        accepted_tasker_id: offer.tasker_id,
      }).eq("id", task.id).eq("status", "open").is("accepted_tasker_id", null).select().maybeSingle();
      throwIf(taskUpdateError, "Could not accept offer");
      if (!claimed) throw new Error(TASKER_LOCKED_NOTICE);

      const { error: offerError2 } = await supabase.from("offers").update({ status: "accepted" }).eq("id", offerId);
      throwIf(offerError2, "Could not accept offer");

      await supabase.from("messages").insert({
        task_id: task.id,
        sender_id: null,
        sender_name: "System",
        sender_role: "client",
        text: `Napili si ${offer.tasker_name} para sa gawain na 'to (₱${offer.amount_php}). Hinihintay ang confirmation niya.`,
        status_update: "offer_accepted",
      });
      await supabase.from("notifications").insert({
        user_id: offer.tasker_id,
        task_id: task.id,
        text: `Napili ka para sa "${task.title}". I-confirm mo para masimulan.`,
      });
      return offer;
    },
    async confirmAssignment(taskId) {
      return assignmentRpc("confirm_assignment", taskId, "Hindi ma-confirm ang gawain");
    },
    async declineAssignment(taskId) {
      return assignmentRpc("decline_assignment", taskId, "Hindi ma-decline ang gawain");
    },
  },

  messages: {
    peek(taskId) {
      if (!taskId) return null;
      return feedCache.chats.get(taskId)?.rows ?? null;
    },
    peekThreads() {
      return feedCache.threads.rows;
    },
    async threads() {
      const me = await requireMe();
      const { data: tasks, error } = await supabase.from("tasks").select("*")
        .or(`client_id.eq.${me.id},accepted_tasker_id.eq.${me.id}`)
        .order("created_at", { ascending: false });
      throwIf(error, "Could not load conversations");
      const rows = await Promise.all((tasks || []).map(async (task) => {
        const { data: msgs } = await supabase.from("messages").select("*").eq("task_id", task.id).order("created_at", { ascending: false }).limit(1);
        return { task, last: msgs?.[0] || null, count: msgs?.length || 0 };
      }));
      return rememberList(feedCache.threads, rows);
    },
    async listByTask(taskId) {
      const { data, error } = await supabase.from("messages").select("*").eq("task_id", taskId).order("created_at", { ascending: true });
      throwIf(error, "Could not load messages");
      return rememberChat(taskId, data || []);
    },
    async send(taskId, text) {
      const me = await requireMe();
      const body = String(text || "").trim();
      if (!body) throw new Error("Type a message first.");
      const { data: task, error: taskError } = await supabase
        .from("tasks")
        .select("id, title, client_id, accepted_tasker_id")
        .eq("id", taskId)
        .single();
      throwIf(taskError, "Hindi mahanap ang gawain");
      const { data, error } = await supabase.from("messages").insert({
        task_id: taskId,
        sender_id: me.id,
        sender_name: me.full_name,
        sender_role: task?.client_id === me.id ? "client" : "tasker",
        text: body,
      }).select().single();
      throwIf(error, "Could not send message");
      const prevChat = feedCache.chats.get(taskId);
      if (data && prevChat?.rows && !prevChat.rows.some((row) => row.id === data.id)) {
        rememberChat(taskId, [...prevChat.rows, data]);
      }
      feedCache.threads = { key: "", rows: null };
      const otherId = me.id === task.client_id ? task.accepted_tasker_id : task.client_id;
      if (otherId && otherId !== me.id) {
        const preview = body.length > 80 ? `${body.slice(0, 77)}…` : body;
        await supabase.from("notifications").insert({
          user_id: otherId,
          task_id: taskId,
          text: `${me.full_name} messaged you on "${task.title}": ${preview}`,
        });
      }
      return data;
    },
    subscribe(taskId, onChange) {
      if (!taskId || typeof onChange !== "function") return () => {};
      let live = true;
      const emit = changedEmitter(onChange);
      const cached = feedCache.chats.get(taskId);
      if (cached?.rows) emit(cached.rows);
      const pull = async () => {
        if (!live) return;
        try {
          const rows = await api.messages.listByTask(taskId);
          if (live) emit(rows);
        } catch {
          if (live && !feedCache.chats.get(taskId)) emit([]);
        }
      };
      pull();
      const channel = supabase
        .channel(uniqueChannel(`task-chat-${taskId}`))
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages", filter: `task_id=eq.${taskId}` },
          () => { pull(); }
        )
        .subscribe();
      return () => {
        live = false;
        supabase.removeChannel(channel);
      };
    },
    subscribeThreads(onChange) {
      if (typeof onChange !== "function") return () => {};
      let live = true;
      const emit = changedEmitter(onChange);
      if (feedCache.threads.rows) emit(feedCache.threads.rows);
      const pull = async () => {
        if (!live) return;
        try {
          const rows = await api.messages.threads();
          if (live) emit(rows);
        } catch {
          /* keep last snapshot */
        }
      };
      pull();
      let channel;
      (async () => {
        try {
          const me = await requireMe();
          if (!live) return;
          channel = supabase
            .channel(uniqueChannel(`message-threads-${me.id}`))
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => { pull(); })
            .on("postgres_changes", { event: "*", schema: "public", table: "tasks", filter: `client_id=eq.${me.id}` }, () => { pull(); })
            .on("postgres_changes", { event: "*", schema: "public", table: "tasks", filter: `accepted_tasker_id=eq.${me.id}` }, () => { pull(); })
            .subscribe();
        } catch {
          /* keep last snapshot */
        }
      })();
      return () => {
        live = false;
        if (channel) supabase.removeChannel(channel);
      };
    },
  },

  fees: {
    async mine() {
      const me = await requireMe();
      const { data, error } = await supabase
        .from("posting_fees")
        .select("*")
        .eq("poster_id", me.id)
        .order("created_at", { ascending: false });
      throwIf(error, "Could not load posting fees");
      return data || [];
    },
  },

  reports: {
    async create(taskId, { dispute_type, description } = {}) {
      const me = await requireMe();
      const { data: task, error: loadError } = await supabase.from("tasks").select("*").eq("id", taskId).single();
      throwIf(loadError, "Hindi mahanap ang gawain");
      if (task.client_id === me.id) throw new Error("Hindi mo puwedeng i-report ang sarili mong gawain.");
      if (task.status === "cancelled") throw new Error("Cancelled na ang gawain na ito.");
      const allowed = ["spam", "scam", "prohibited", "other"];
      const type = allowed.includes(dispute_type) ? dispute_type : "other";
      const note = String(description || "").trim();
      if (type === "other" && note.length < 8) throw new Error("Ilagay kung bakit mo i-re-report.");
      const { data: existing } = await supabase.from("disputes").select("id, status").eq("task_id", taskId).eq("flagged_by_id", me.id);
      if ((existing || []).some((row) => ["pending_review", "under_review"].includes(row.status))) {
        throw new Error("Nai-report mo na ang gawain na ito. Hinihintay ang admin.");
      }
      const row = {
        task_id: taskId,
        flagged_by_id: me.id,
        flagged_by_name: me.full_name,
        flagged_by_role: "tasker",
        dispute_type: type,
        item_description: type,
        description: note,
        status: "pending_review",
      };
      let inserted = await supabase.from("disputes").insert(row).select().single();
      if (inserted.error && /invalid input value for enum|dispute_type/i.test(inserted.error.message || "")) {
        inserted = await supabase.from("disputes").insert({ ...row, dispute_type: "other", item_description: type }).select().single();
      }
      throwIf(inserted.error, "Hindi ma-submit ang report");
      await pushLog({
        actor_id: me.id,
        actor_name: me.full_name,
        action: "gawain_reported",
        detail: `Reported "${task.title}" as ${type}`,
        target_id: taskId,
      });
      const { data: admins } = await supabase.from("profiles").select("id").eq("role", "admin");
      if (admins?.length) {
        await supabase.from("notifications").insert(
          admins.map((admin) => ({
            user_id: admin.id,
            task_id: taskId,
            text: `${me.full_name} reported "${task.title}" (${type}).`,
          }))
        );
      }
      return inserted.data;
    },
    async mineForTask(taskId) {
      try {
        const me = await requireMe();
        const { data, error } = await supabase
          .from("disputes")
          .select("id, status, dispute_type, item_description, created_at")
          .eq("task_id", taskId)
          .eq("flagged_by_id", me.id)
          .order("created_at", { ascending: false });
        if (error) return [];
        return data || [];
      } catch {
        return [];
      }
    },
  },

  notifications: {
    peek() {
      return feedCache.notifications.rows;
    },
    async list() {
      const me = await requireMe();
      const { data, error } = await supabase.from("notifications").select("*").eq("user_id", me.id).order("created_at", { ascending: false });
      throwIf(error, "Could not load notifications");
      return rememberList(feedCache.notifications, data || []);
    },
    async unreadCount() {
      try {
        const me = await requireMe();
        const { count, error } = await supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", me.id)
          .eq("read", false);
        if (error) return feedCache.notifications.unread || 0;
        const next = count || 0;
        feedCache.notifications.unread = next;
        return next;
      } catch {
        return feedCache.notifications.unread || 0;
      }
    },
    async markAllRead() {
      const me = await requireMe();
      const { error } = await supabase.from("notifications").update({ read: true }).eq("user_id", me.id).eq("read", false);
      throwIf(error, "Could not update notifications");
      if (feedCache.notifications.rows) {
        const rows = feedCache.notifications.rows.map((n) => (n.read ? n : { ...n, read: true }));
        feedCache.notifications.key = fingerprint(rows);
        feedCache.notifications.rows = rows;
      }
      emitUnread(0);
    },
    subscribe(onChange) {
      if (typeof onChange !== "function") return () => {};
      let live = true;
      const emit = changedEmitter(onChange);
      if (feedCache.notifications.rows) emit(feedCache.notifications.rows);
      const pull = async () => {
        if (!live) return;
        try {
          const rows = await api.notifications.list();
          if (live) emit(rows);
        } catch {
          if (live && !feedCache.notifications.rows) emit([]);
        }
      };
      pull();
      let channel;
      (async () => {
        try {
          const me = await requireMe();
          if (!live) return;
          channel = supabase
            .channel(uniqueChannel(`notifications-${me.id}`))
            .on(
              "postgres_changes",
              { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${me.id}` },
              () => { pull(); }
            )
            .subscribe();
        } catch {
          /* keep last snapshot */
        }
      })();
      return () => {
        live = false;
        if (channel) supabase.removeChannel(channel);
      };
    },
    subscribeUnread(onChange) {
      if (typeof onChange !== "function") return () => {};
      unreadWatchers.add(onChange);
      if (feedCache.notifications.unread != null) onChange(feedCache.notifications.unread);
      let live = true;
      const pull = async () => {
        if (!live) return;
        try {
          const count = await api.notifications.unreadCount();
          if (live) onChange(count);
        } catch {
          /* keep last snapshot */
        }
      };
      pull();
      let channel;
      (async () => {
        try {
          const me = await requireMe();
          if (!live) return;
          channel = supabase
            .channel(uniqueChannel(`unread-${me.id}`))
            .on(
              "postgres_changes",
              { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${me.id}` },
              () => { pull(); }
            )
            .subscribe();
        } catch {
          /* keep last snapshot */
        }
      })();
      return () => {
        live = false;
        unreadWatchers.delete(onChange);
        if (channel) supabase.removeChannel(channel);
      };
    },
  },

  jobs: {
    async list() {
      const { data, error } = await supabase.from("jobs").select("*").eq("status", "active").order("created_at", { ascending: false });
      throwIf(error, "Could not load jobs");
      return data || [];
    },
  },

  taskers: {
    // Presence heartbeat. Failures are ignored: an "Active" badge is never
    // worth interrupting whatever the user was actually doing.
    async touch() {
      try {
        await supabase.rpc("touch_last_seen");
      } catch {
        // ignore
      }
    },
    async list({ search = "", limit = 60 } = {}) {
      await requireMe();
      const { data, error } = await supabase.rpc("list_taskers", { p_search: search || null, p_limit: limit });
      if (error) {
        const msg = error.message || "";
        if (/could not find the function|schema cache/i.test(msg)) {
          throw new Error("Run supabase/taskers_directory.sql in the SQL Editor.");
        }
        throw new Error(msg || "Hindi ma-load ang mga tasker");
      }
      return data || [];
    },
    async assign(taskId, taskerId) {
      await requireMe();
      const { data, error } = await supabase.rpc("assign_tasker", { p_task_id: taskId, p_tasker_id: taskerId });
      if (error) {
        const msg = error.message || "";
        if (/could not find the function|schema cache/i.test(msg)) {
          throw new Error("Run supabase/taskers_directory.sql in the SQL Editor.");
        }
        throw new Error(msg || "Hindi ma-assign ang tasker");
      }
      const task = Array.isArray(data) ? data[0] : data;
      return task ? rememberTask(task) : null;
    },
  },

  profile: {
    // One query for a set of ids, so lists never fan out into a request per row.
    async getMany(userIds) {
      const ids = [...new Set((userIds || []).filter(Boolean))];
      if (!ids.length) return {};
      const { data, error } = await supabase.from("profiles").select("*").in("id", ids);
      throwIf(error, "Hindi ma-load ang mga profile");
      const out = {};
      for (const row of data || []) out[row.id] = publicProfile(row);
      return out;
    },
    async get(userId) {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
      throwIf(error, "Hindi mahanap ang profile");
      return publicProfile(data);
    },
    async setMode(mode) {
      const me = await requireMe();
      const next = mode === "tasker" ? "tasker" : "poster";
      writeStoredMode(next);
      const { data, error } = await supabase.from("profiles").update({ active_mode: next }).eq("id", me.id).select().single();
      if (error && missingColumn(error)) {
        return { ...me, active_mode: next };
      }
      throwIf(error, "Hindi ma-switch ang mode");
      return applyMode({ ...data, email: me.email });
    },
    async update(patch) {
      const me = await requireMe();
      const allowed = {};
      const keys = ["full_name", "headline", "bio", "phone", "location_area", "skills", "price_type", "price_amount", "price_description", "vehicle_type", "vehicle_model", "plate_number"];
      for (const key of keys) {
        if (patch[key] !== undefined) allowed[key] = patch[key];
      }
      if (allowed.price_amount !== undefined && allowed.price_amount !== null && allowed.price_amount !== "") {
        allowed.price_amount = Number(allowed.price_amount);
      }
      const data = await updateProfileFields(me.id, allowed);
      return applyMode({ ...data, email: me.email });
    },
  },

  reviews: {
    async getByTask(taskId) {
      const { data, error } = await supabase.from("reviews").select("*").eq("task_id", taskId).maybeSingle();
      throwIf(error, "Could not load review");
      return data || null;
    },
    async listByTasker(taskerId) {
      const { data, error } = await supabase.from("reviews").select("*").eq("tasker_id", taskerId).order("created_at", { ascending: false });
      throwIf(error, "Could not load reviews");
      return data || [];
    },
    async listByReviewer(reviewerId) {
      const { data, error } = await supabase.from("reviews").select("*").eq("reviewer_id", reviewerId).order("created_at", { ascending: false });
      throwIf(error, "Could not load reviews");
      return data || [];
    },
    async create({ task_id, rating, comment }) {
      const me = await requireMe();
      const stars = Number(rating);
      if (stars < 1 || stars > 5) throw new Error("1 to 5 stars lang.");
      const { data: task, error: taskError } = await supabase.from("tasks").select("*").eq("id", task_id).single();
      throwIf(taskError, "Task not found");
      if (task.status !== "released") throw new Error("Tapos na dapat ang job bago mag-rate.");
      if (task.client_id !== me.id) throw new Error("Poster lang ang puwedeng mag-rate ng tasker dito.");
      if (!task.accepted_tasker_id) throw new Error("Walang tasker na naka-assign.");
      const { data: tasker } = await supabase.from("profiles").select("full_name").eq("id", task.accepted_tasker_id).maybeSingle();
      const { data, error } = await supabase.from("reviews").insert({
        task_id,
        reviewer_id: me.id,
        tasker_id: task.accepted_tasker_id,
        tasker_name: tasker?.full_name || "Tasker",
        client_name: me.full_name,
        rating: stars,
        comment: comment || "",
      }).select().single();
      if (error && /duplicate|unique/i.test(error.message || "")) {
        throw new Error("Na-rate mo na ang job na 'to.");
      }
      throwIf(error, "Hindi ma-save ang rating");
      await supabase.from("notifications").insert({
        user_id: task.accepted_tasker_id,
        task_id,
        text: `May ${stars}-star rating ka from ${me.full_name} for "${task.title}".`,
      });
      return data;
    },
  },

  verification: {
    async submit({ id_document, credentials, profile: profilePatch, application, gcash_number }) {
      const me = await requireMe();
      if (me.role === "admin") throw new Error("Admin accounts do not submit ID verification");
      if (!id_document?.name) throw new Error("Government ID is required");
      const storedId = await persistIdDocument(me.id, id_document);
      const creds = Array.isArray(credentials) ? credentials : [];
      const applicationRecord = application
        ? {
            ...application,
            email: me.email || "",
            full_name: profilePatch?.full_name || me.full_name || "",
            phone: profilePatch?.phone || me.phone || "",
            daily_rate: profilePatch?.price_amount ?? application.daily_rate,
            submitted_at: new Date().toISOString(),
          }
        : null;
      const credsWithApp = [
        ...creds.filter((c) => c?.name !== "tasker_application.json"),
        ...(applicationRecord ? [{ name: "tasker_application.json", type: "application/json", application: applicationRecord }] : []),
      ];
      const docs = [
        { user_id: me.id, kind: "id", file_name: storedId.name, mime_type: storedId.type, file_size: storedId.size || 0, file_path: storedId.file_path || null },
        ...creds.map((c) => ({ user_id: me.id, kind: "credential", file_name: c.name, mime_type: c.type, file_size: c.size || 0 })),
      ];
      const { error: docsError } = await supabase.from("verification_documents").insert(docs);
      if (docsError && !missingColumn(docsError) && !/permission|policy|rls/i.test(docsError.message || "")) {
        throwIf(docsError, "Could not save documents");
      }

      const data = await updateProfileFields(me.id, {
        ...(profilePatch || {}),
        bio: me.bio || profilePatch?.bio || "",
        id_document: storedId,
        credentials: credsWithApp,
        tasker_application: applicationRecord,
        verification_status: "pending",
        verification_note: "",
      });

      if (gcash_number) {
        await supabase.from("wallets").update({ gcash_number }).eq("user_id", me.id);
      }

      await pushLog({
        actor_id: me.id,
        actor_name: data?.full_name || me.full_name,
        action: "verification_submitted",
        detail: `Submitted account verification with ${storedId.name}`,
        target_id: me.id,
      });
      await supabase.from("notifications").insert({
        user_id: me.id,
        text: "Your verification application was submitted. Status: pending review.",
      });
      const { data: admins } = await supabase.from("profiles").select("id").eq("role", "admin");
      if (admins?.length) {
        await supabase.from("notifications").insert(
          admins.map((admin) => ({
            user_id: admin.id,
            text: `${data?.full_name || me.full_name} submitted an application for review.`,
          }))
        );
      }
      return applyMode({ ...data, email: me.email });
    },
  },

  admin: {
    async overview() {
      const me = await requireMe();
      if (!isAdmin(me)) throw new Error("Admin only");
      let [users, tasks, pending, fees, disputes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("tasks").select("id, status, category, created_at, budget_php"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("verification_status", "pending"),
        supabase.from("posting_fees").select("fee_php, created_at"),
        supabase.from("disputes").select("id, status"),
      ]);
      if (tasks.error) {
        tasks = await supabase.from("tasks").select("id, status, created_at");
      }
      throwIf(users.error, "Admin overview failed");
      const taskRows = tasks.data || [];
      const disputeRows = disputes.error ? [] : (disputes.data || []);
      return {
        users: users.count || 0,
        tasks: taskRows.length,
        openTasks: taskRows.filter((t) => t.status === "open").length,
        pendingVerifications: pending.count || 0,
        postingFees: (fees.data || []).reduce((s, f) => s + Number(f.fee_php || 0), 0),
        pendingReports: disputeRows.filter((d) => ["pending_review", "under_review"].includes(d.status)).length,
        taskRows,
      };
    },
    async users() {
      const me = await requireMe();
      if (!isAdmin(me)) throw new Error("Admin only");
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      throwIf(error, "Could not load users");
      const ids = (data || []).map((row) => row.id);
      let documents = [];
      if (ids.length) {
        const docRes = await supabase.from("verification_documents").select("*").in("user_id", ids);
        if (!docRes.error) documents = docRes.data || [];
      }
      return Promise.all((data || []).map(async (row) => {
        const app = row.tasker_application || (row.credentials || []).find((c) => c?.application)?.application || {};
        const withPreview = await withSignedId(row);
        return {
          ...withPreview,
          email: row.email || app.email || "",
          verification_documents: documents.filter((doc) => doc.user_id === row.id),
        };
      }));
    },
    async setStatus(userId, status) {
      const me = await requireMe();
      if (!isAdmin(me)) throw new Error("Admin only");
      if (!["active", "suspended"].includes(status)) throw new Error("Invalid status");
      const { data: user, error: loadError } = await supabase.from("profiles").select("*").eq("id", userId).single();
      throwIf(loadError, "User not found");
      if (user.role === "admin") throw new Error("Cannot change admin status");
      const { data, error } = await supabase.from("profiles").update({ status }).eq("id", userId).select().single();
      throwIf(error, "Could not update user");
      await pushLog({
        actor_id: me.id,
        actor_name: me.full_name,
        action: status === "suspended" ? "user_suspended" : "user_activated",
        detail: `${user.full_name} is now ${status}`,
        target_id: userId,
      });
      return data;
    },
    async decideVerification(userId, decision, note) {
      const me = await requireMe();
      if (!isAdmin(me)) throw new Error("Admin only");
      if (!["verified", "rejected"].includes(decision)) throw new Error("Invalid decision");
      const { data: user, error: loadError } = await supabase.from("profiles").select("*").eq("id", userId).single();
      throwIf(loadError, "User not found");
      if (user.role === "admin") throw new Error("Admin accounts are not verified this way");
      const status = decision === "verified" ? "verified" : "unverified";
      const { data, error } = await supabase.from("profiles").update({
        verification_status: status,
        verification_note: note || "",
        verified_at: decision === "verified" ? new Date().toISOString() : null,
      }).eq("id", userId).select().single();
      throwIf(error, "Could not update verification");
      await pushLog({
        actor_id: me.id,
        actor_name: me.full_name,
        action: decision === "verified" ? "verification_approved" : "verification_rejected",
        detail: `${user.full_name} ${decision}${note ? ` — ${note}` : ""}`,
        target_id: userId,
      });
      await supabase.from("notifications").insert({
        user_id: userId,
        text: decision === "verified"
          ? "Your verification application was approved. You can now post gawain and accept jobs."
          : `Your verification application was rejected.${note ? ` ${note}` : " Please resubmit your application."}`,
      });
      return data;
    },
    async logs() {
      const me = await requireMe();
      if (!isAdmin(me)) throw new Error("Admin only");
      const { data, error } = await supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(200);
      throwIf(error, "Could not load activity");
      return data || [];
    },
    async transactions() {
      const me = await requireMe();
      if (!isAdmin(me)) throw new Error("Admin only");
      const { data: fees, error: e1 } = await supabase.from("posting_fees").select("*");
      throwIf(e1, "Could not load posting fees. Run supabase/rpcs.sql in the SQL Editor.");
      return (fees || [])
        .map((f) => ({
          id: f.id,
          kind: "posting_fee",
          status: "recorded",
          amount: f.fee_php,
          from: f.poster_name,
          to: "Khaki",
          task_id: f.task_id,
          created_at: f.created_at,
        }))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    },
    async disputes() {
      const me = await requireMe();
      if (!isAdmin(me)) throw new Error("Admin only");
      const { data, error } = await supabase.from("disputes").select("*").order("created_at", { ascending: false });
      throwIf(error, "Could not load reports");
      const rows = data || [];
      const ids = [...new Set(rows.map((row) => row.task_id).filter(Boolean))];
      let tasks = [];
      if (ids.length) {
        const loaded = await supabase.from("tasks").select("id, title, status, client_id, client_name").in("id", ids);
        tasks = loaded.data || [];
      }
      const byId = Object.fromEntries(tasks.map((task) => [task.id, task]));
      const openFirst = (status) => (["pending_review", "under_review"].includes(status) ? 0 : 1);
      return rows
        .map((row) => ({ ...row, task: byId[row.task_id] || null }))
        .sort((a, b) => openFirst(a.status) - openFirst(b.status) || new Date(b.created_at) - new Date(a.created_at));
    },
    async resolveDispute(disputeId, decision, note) {
      const me = await requireMe();
      if (!isAdmin(me)) throw new Error("Admin only");
      if (!["dismiss", "takedown"].includes(decision)) throw new Error("Invalid decision");
      const { data: dispute, error: loadError } = await supabase.from("disputes").select("*").eq("id", disputeId).single();
      throwIf(loadError, "Report not found");
      if (!["pending_review", "under_review"].includes(dispute.status)) {
        throw new Error("Na-resolve na ang report na ito.");
      }
      const { data: task, error: taskError } = await supabase.from("tasks").select("*").eq("id", dispute.task_id).single();
      throwIf(taskError, "Hindi mahanap ang gawain");
      const adminNote = String(note || "").trim();
      const nextStatus = decision === "takedown" ? "resolved_no_charge" : "dismissed";
      const { data, error } = await supabase.from("disputes").update({
        status: nextStatus,
        admin_notes: adminNote,
        resolved_at: new Date().toISOString(),
      }).eq("id", disputeId).select().single();
      throwIf(error, "Could not update report");

      if (decision === "takedown") {
        await supabase.from("disputes").update({
          status: "resolved_no_charge",
          admin_notes: adminNote || "Closed with related takedown",
          resolved_at: new Date().toISOString(),
        }).eq("task_id", task.id).in("status", ["pending_review", "under_review"]).neq("id", disputeId);

        if (task.status === "open") {
          await supabase.from("tasks").update({ status: "cancelled" }).eq("id", task.id);
          const { data: bids } = await supabase.from("offers").select("id, tasker_id").eq("task_id", task.id).eq("status", "pending");
          await Promise.all((bids || []).map((row) => supabase.from("offers").update({ status: "declined" }).eq("id", row.id)));
          const bidderIds = [...new Set((bids || []).map((row) => row.tasker_id).filter(Boolean))];
          if (bidderIds.length) {
            await supabase.from("notifications").insert(
              bidderIds.map((user_id) => ({
                user_id,
                task_id: task.id,
                text: `"${task.title}" was taken down after a report. Bidding is closed.`,
              }))
            );
          }
        } else if (!["cancelled", "released"].includes(task.status)) {
          await supabase.from("tasks").update({ status: "disputed" }).eq("id", task.id);
        }

        await supabase.from("messages").insert({
          task_id: task.id,
          sender_id: null,
          sender_name: "System",
          sender_role: "client",
          text: "Admin took this gawain down after a report.",
          status_update: task.status === "open" ? "cancelled" : "disputed",
        });
        await supabase.from("notifications").insert({
          user_id: task.client_id,
          task_id: task.id,
          text: `"${task.title}" was taken down after a report.${adminNote ? ` ${adminNote}` : ""}`,
        });
        if (task.accepted_tasker_id) {
          await supabase.from("notifications").insert({
            user_id: task.accepted_tasker_id,
            task_id: task.id,
            text: `"${task.title}" was taken down after a report.`,
          });
        }
        await pushLog({
          actor_id: me.id,
          actor_name: me.full_name,
          action: "report_takedown",
          detail: `Took down "${task.title}" (${dispute.dispute_type || dispute.item_description})${adminNote ? ` — ${adminNote}` : ""}`,
          target_id: task.id,
        });
      } else {
        await supabase.from("notifications").insert({
          user_id: dispute.flagged_by_id,
          task_id: task.id,
          text: `Your report on "${task.title}" was reviewed and dismissed.${adminNote ? ` ${adminNote}` : ""}`,
        });
        await pushLog({
          actor_id: me.id,
          actor_name: me.full_name,
          action: "report_dismissed",
          detail: `Dismissed report on "${task.title}"${adminNote ? ` — ${adminNote}` : ""}`,
          target_id: task.id,
        });
      }
      return data;
    },
  },
};
