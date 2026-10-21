import { NextResponse } from "next/server";
import { generateReference } from "@/lib/khaki";
import { lockEscrow, serviceSupabase, userFromRequest } from "@/lib/paymongoServer";

export const runtime = "nodejs";

async function simulationEnabled(admin) {
  const { data, error } = await admin.rpc("get_app_setting", { p_key: "payment_simulation_enabled" });
  if (error) {
    // Table/RPC not migrated yet — treat as off.
    if (/get_app_setting|app_settings|function/i.test(error.message || "")) return false;
    throw new Error(error.message);
  }
  return data === true || data === "true";
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

    if (!(await simulationEnabled(admin))) {
      return NextResponse.json(
        { error: "Payment simulation is turned off by admin." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const taskId = body.task_id;
    const method = String(body.payment_method || "gcash").toLowerCase();
    if (!taskId) return NextResponse.json({ error: "Missing task." }, { status: 400 });

    const { data: task, error: taskError } = await admin.from("tasks").select("*").eq("id", taskId).maybeSingle();
    if (taskError) return NextResponse.json({ error: taskError.message }, { status: 500 });
    if (!task) return NextResponse.json({ error: "Hindi mahanap ang gawain." }, { status: 404 });
    if (task.client_id !== user.id) {
      return NextResponse.json({ error: "Only the client can simulate payment." }, { status: 403 });
    }

    let { data: hold, error: holdError } = await admin
      .from("escrow_holds")
      .select("*")
      .eq("task_id", taskId)
      .neq("status", "cancelled")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (holdError) return NextResponse.json({ error: holdError.message }, { status: 500 });
    if (!hold) return NextResponse.json({ error: "Open escrow first." }, { status: 400 });
    if (hold.status === "locked" || hold.status === "released") {
      return NextResponse.json({ already_paid: true, hold });
    }
    if (hold.status !== "pending_payment") {
      return NextResponse.json({ error: `Cannot simulate from status ${hold.status}.` }, { status: 400 });
    }

    const reference = `SIM-${generateReference()}`;
    await admin
      .from("escrow_holds")
      .update({ payment_method: method, payment_reference: reference })
      .eq("id", hold.id)
      .eq("status", "pending_payment");

    const result = await lockEscrow(admin, hold.id, reference, null);
    if (!result.hold) {
      return NextResponse.json({ error: result.reason || "Could not lock escrow." }, { status: 400 });
    }

    await admin.from("messages").insert({
      task_id: taskId,
      sender_id: null,
      sender_name: "System",
      sender_role: "client",
      text: `Funds locked via payment simulation (${method.toUpperCase()}) — Ref: ${reference}.`,
      status_update: "escrow_locked",
    }).catch(() => null);

    return NextResponse.json({ ok: true, hold: result.hold, simulated: true });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Simulation failed." }, { status: 500 });
  }
}
