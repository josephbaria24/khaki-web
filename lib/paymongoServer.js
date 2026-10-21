import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const PAYMONGO = "https://api.paymongo.com";

export function paymongoKey() {
  return process.env.PAYMONGO_SECRET_KEY || "";
}

export function serviceSupabase() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function userSupabase() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function userFromRequest(request) {
  const token = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const supabase = userSupabase();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

export async function paymongo(path, { method = "GET", body } = {}) {
  const secret = paymongoKey();
  if (!secret) {
    const error = new Error("PayMongo is not configured. Add PAYMONGO_SECRET_KEY in web/.env.local and restart the server.");
    error.status = 500;
    throw error;
  }
  const response = await fetch(`${PAYMONGO}${path}`, {
    method,
    headers: {
      Authorization: `Basic ${Buffer.from(`${secret}:`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = payload?.errors?.[0]?.detail || payload?.errors?.[0]?.code || response.statusText;
    const error = new Error(`PayMongo: ${detail}`);
    error.status = 502;
    throw error;
  }
  return payload;
}

export function readPaymongoEvent(body) {
  const data = body?.data || {};
  const attributes = data.attributes || {};
  const type = attributes.type || data.type || "";
  const resource = attributes.data || data.data || null;
  return {
    type,
    livemode: Boolean(attributes.livemode),
    resource,
  };
}

export function paidPayment(record) {
  const attributes = record?.attributes || record || {};
  const lists = [
    attributes.payments,
    attributes.payment_intent?.attributes?.payments,
    attributes.payment_intent?.payments,
  ];
  for (const list of lists) {
    const found = (list || []).find((row) => (row.attributes?.status || row.status) === "paid");
    if (found) return found;
  }
  if (attributes.status === "paid" && record?.id) return record;
  return null;
}

export async function findPaidForEscrow(escrowId, session) {
  const onSession = paidPayment(session);
  if (onSession) return onSession;
  const listed = await paymongo("/v1/payments?limit=20");
  return (listed?.data || []).find((row) => (
    row.attributes?.status === "paid" && row.attributes?.metadata?.escrow_id === escrowId
  )) || null;
}

export function verifyPaymongoSignature(rawBody, header, livemode) {
  const secret = process.env.PAYMONGO_WEBHOOK_SECRET || "";
  if (!secret) return false;
  const parts = Object.fromEntries(
    String(header || "")
      .split(",")
      .map((piece) => piece.split("=").map((bit) => bit.trim()))
      .filter((pair) => pair.length === 2)
  );
  const timestamp = parts.t;
  const expected = livemode ? parts.li : parts.te;
  if (!timestamp || !expected) return false;
  const digest = crypto.createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  const a = Buffer.from(digest);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function lockEscrow(admin, escrowId, paymentId, amountCentavos) {
  const { data: hold, error } = await admin
    .from("escrow_holds")
    .select("*")
    .eq("id", escrowId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!hold) return { ignored: true, reason: "missing escrow" };
  if (hold.status === "locked" || hold.status === "released") return { ignored: true, reason: "already settled", hold };
  if (hold.status !== "pending_payment") return { ignored: true, reason: hold.status, hold };

  const expected = Math.round(Number(hold.client_total || hold.amount_held || 0) * 100);
  if (amountCentavos && Number(amountCentavos) !== expected) {
    return { ignored: true, reason: "amount mismatch", hold };
  }
  const now = new Date().toISOString();
  const patch = {
    status: "locked",
    locked_at: now,
    payment_reference: paymentId || hold.payment_reference,
    paymongo_payment_id: paymentId || null,
  };
  let updated = await admin.from("escrow_holds").update(patch).eq("id", hold.id).eq("status", "pending_payment").select().maybeSingle();
  if (updated.error && /paymongo_payment_id|schema cache|column/i.test(updated.error.message || "")) {
    const { paymongo_payment_id, ...rest } = patch;
    updated = await admin.from("escrow_holds").update(rest).eq("id", hold.id).eq("status", "pending_payment").select().maybeSingle();
  }
  if (updated.error) throw new Error(updated.error.message);
  return { hold: updated.data || hold };
}
