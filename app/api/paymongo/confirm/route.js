import { NextResponse } from "next/server";
import {
  findPaidForEscrow,
  lockEscrow,
  paymongo,
  serviceSupabase,
  userFromRequest,
} from "@/lib/paymongoServer";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const user = await userFromRequest(request);
    if (!user) return NextResponse.json({ error: "Login required." }, { status: 401 });
    const admin = serviceSupabase();
    if (!admin) {
      return NextResponse.json(
        { error: "Add SUPABASE_SERVICE_ROLE_KEY in web/.env.local and restart the server." },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const escrowId = body.escrow_id;
    if (!escrowId) return NextResponse.json({ error: "Missing escrow." }, { status: 400 });

    const { data: hold, error } = await admin.from("escrow_holds").select("*").eq("id", escrowId).maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!hold) return NextResponse.json({ error: "Escrow not found." }, { status: 404 });
    if (hold.client_id !== user.id) return NextResponse.json({ error: "Only the client can confirm this payment." }, { status: 403 });
    if (hold.status === "locked" || hold.status === "released") {
      return NextResponse.json({ status: hold.status, hold });
    }

    const sessionId = hold.paymongo_session_id || (String(hold.payment_reference || "").startsWith("cs_") ? hold.payment_reference : "");
    let session = null;
    if (sessionId) {
      try {
        session = await paymongo(`/v1/checkout_sessions/${sessionId}`);
      } catch {
        session = null;
      }
    }
    const paid = await findPaidForEscrow(hold.id, session?.data);
    if (!paid) return NextResponse.json({ status: "pending_payment", hold });

    const result = await lockEscrow(admin, hold.id, paid.id, paid.attributes?.amount);
    return NextResponse.json({ status: result.hold?.status || "locked", hold: result.hold, ignored: result.ignored || false });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Could not confirm payment." }, { status: error.status || 500 });
  }
}
