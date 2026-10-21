import { supabase } from "@/lib/supabase";

async function authed(path, body) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Login required.");
  const response = await fetch(path, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body || {}),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "PayMongo request failed.");
  return payload;
}

export function startGcashCheckout(taskId) {
  return authed("/api/paymongo/checkout", { task_id: taskId });
}

export function confirmGcashCheckout(escrowId) {
  return authed("/api/paymongo/confirm", { escrow_id: escrowId });
}

export function releaseEscrow(escrowId) {
  return authed("/api/paymongo/release", { escrow_id: escrowId });
}

export function simulateEscrowPayment(taskId, paymentMethod = "gcash") {
  return authed("/api/paymongo/simulate", { task_id: taskId, payment_method: paymentMethod });
}
