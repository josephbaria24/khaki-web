import { NextResponse } from "next/server";
import {
  lockEscrow,
  paidPayment,
  readPaymongoEvent,
  serviceSupabase,
  verifyPaymongoSignature,
} from "@/lib/paymongoServer";

export const runtime = "nodejs";

export async function POST(request) {
  const raw = await request.text();
  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const event = readPaymongoEvent(body);
  const signature = request.headers.get("paymongo-signature") || "";
  if (!verifyPaymongoSignature(raw, signature, event.livemode)) {
    return NextResponse.json({ error: "Invalid PayMongo signature." }, { status: 401 });
  }
  if (event.type !== "checkout_session.payment.paid") {
    return NextResponse.json({ received: true, ignored: true });
  }

  const admin = serviceSupabase();
  if (!admin) return NextResponse.json({ error: "Supabase service role is not configured." }, { status: 500 });

  const session = event.resource;
  const attributes = session?.attributes || {};
  const escrowId = attributes.metadata?.escrow_id || attributes.reference_number;
  const paid = paidPayment(session);
  if (!escrowId || !paid) return NextResponse.json({ received: true, ignored: true });

  try {
    const result = await lockEscrow(admin, escrowId, paid.id, paid.attributes?.amount);
    return NextResponse.json({ received: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Could not lock escrow." }, { status: 500 });
  }
}
