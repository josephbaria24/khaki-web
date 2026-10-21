import { NextResponse } from "next/server";
import { escrowSplit } from "@/lib/khaki";
import {
  findPaidForEscrow,
  lockEscrow,
  paidPayment,
  paymongo,
  serviceSupabase,
  userFromRequest,
} from "@/lib/paymongoServer";

export const runtime = "nodejs";

function sessionIdOf(hold) {
  if (hold?.paymongo_session_id) return hold.paymongo_session_id;
  const ref = String(hold?.payment_reference || "");
  return ref.startsWith("cs_") ? ref : "";
}

async function rememberSession(admin, holdId, sessionId) {
  const patch = { paymongo_session_id: sessionId, payment_reference: sessionId };
  let updated = await admin.from("escrow_holds").update(patch).eq("id", holdId);
  if (updated.error && /paymongo_session_id|schema cache|column/i.test(updated.error.message || "")) {
    updated = await admin.from("escrow_holds").update({ payment_reference: sessionId }).eq("id", holdId);
  }
  if (updated.error) throw new Error(updated.error.message);
}

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
    const taskId = body.task_id;
    if (!taskId) return NextResponse.json({ error: "Missing task." }, { status: 400 });

    const { data: task, error: taskError } = await admin.from("tasks").select("*").eq("id", taskId).maybeSingle();
    if (taskError) return NextResponse.json({ error: taskError.message }, { status: 500 });
    if (!task) return NextResponse.json({ error: "Hindi mahanap ang gawain." }, { status: 404 });
    if (task.client_id !== user.id) return NextResponse.json({ error: "Only the client can pay this gawain." }, { status: 403 });
    if (!task.accepted_tasker_id) return NextResponse.json({ error: "Pick a tasker before paying." }, { status: 400 });

    const { data: offer, error: offerError } = await admin
      .from("offers")
      .select("*")
      .eq("task_id", task.id)
      .eq("tasker_id", task.accepted_tasker_id)
      .eq("status", "accepted")
      .maybeSingle();
    if (offerError) return NextResponse.json({ error: offerError.message }, { status: 500 });
    if (!offer) return NextResponse.json({ error: "No accepted bid to pay." }, { status: 400 });

    const split = escrowSplit(offer.amount_php);
    if (split.total < 1) return NextResponse.json({ error: "Amount is too small to charge." }, { status: 400 });

    let { data: hold, error: holdError } = await admin
      .from("escrow_holds")
      .select("*")
      .eq("offer_id", offer.id)
      .maybeSingle();
    if (holdError) return NextResponse.json({ error: holdError.message }, { status: 500 });

    if (!hold) {
      const created = await admin.from("escrow_holds").insert({
        task_id: task.id,
        offer_id: offer.id,
        client_id: task.client_id,
        tasker_id: offer.tasker_id,
        client_name: task.client_name,
        tasker_name: offer.tasker_name,
        amount_held: split.total,
        client_total: split.total,
        platform_fee: split.platform,
        tasker_payout: split.payout,
        payment_method: "gcash",
        status: "pending_payment",
      }).select().single();
      if (created.error) return NextResponse.json({ error: created.error.message }, { status: 500 });
      hold = created.data;
    }

    if (hold.status === "locked" || hold.status === "released") {
      return NextResponse.json({ already_paid: true, escrow_id: hold.id, status: hold.status });
    }
    if (hold.status === "cancelled") {
      return NextResponse.json({ error: "This payment was cancelled. Accept the bid again." }, { status: 400 });
    }

    const existingId = sessionIdOf(hold);
    if (existingId) {
      try {
        const existing = await paymongo(`/v1/checkout_sessions/${existingId}`);
        const paid = paidPayment(existing?.data);
        if (paid) {
          await lockEscrow(admin, hold.id, paid.id, paid.attributes?.amount);
          return NextResponse.json({ already_paid: true, escrow_id: hold.id, status: "locked" });
        }
      } catch {
        // The saved session can no longer be opened. Create a new one.
      }
    }

    const already = await findPaidForEscrow(hold.id);
    if (already) {
      await lockEscrow(admin, hold.id, already.id, already.attributes?.amount);
      return NextResponse.json({ already_paid: true, escrow_id: hold.id, status: "locked" });
    }

    const origin = request.headers.get("origin") || new URL(request.url).origin;
    const created = await paymongo("/v2/checkout_sessions", {
      method: "POST",
      body: {
        data: {
          attributes: {
            line_items: [
              {
                name: `Khaki job · ${String(task.title || "Gawain").slice(0, 60)}`,
                amount: split.total * 100,
                currency: "PHP",
                quantity: 1,
              },
            ],
            payment_method_types: ["gcash", "paymaya", "grab_pay", "qrph", "card"],
            success_url: `${origin}/task/${task.id}?pay=success`,
            cancel_url: `${origin}/task/${task.id}?pay=cancelled`,
            merchant: "Khaki",
            statement_descriptor: "KHAKI",
            reference_number: "Khaki",
            description: `Escrow for ${task.title}. Tasker payout ${split.payout} PHP, platform fee ${split.platform} PHP.`,
            metadata: {
              escrow_id: hold.id,
              task_id: task.id,
              client_id: user.id,
            },
            send_email_receipt: true,
            show_description: true,
            show_line_items: true,
          },
        },
      },
    });

    const sessionId = created?.data?.id;
    const checkoutUrl = created?.data?.attributes?.checkout_url;
    if (!sessionId || !checkoutUrl) {
      return NextResponse.json({ error: "PayMongo did not return a checkout page." }, { status: 502 });
    }
    await rememberSession(admin, hold.id, sessionId);
    return NextResponse.json({ checkout_url: checkoutUrl, session_id: sessionId, escrow_id: hold.id });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Could not start GCash checkout." }, { status: error.status || 500 });
  }
}
