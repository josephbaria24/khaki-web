import { NextResponse } from "next/server";
import { serviceSupabase, userFromRequest } from "@/lib/paymongoServer";

export const runtime = "nodejs";

function delivered(task) {
  if (!task) return false;
  if (task.extras?.progress?.times?.delivered) return true;
  return task.status === "released" || task.status === "completed_pending_review";
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

    const { data: profile, error: profileError } = await admin.from("profiles").select("id, role, full_name").eq("id", user.id).maybeSingle();
    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });
    if (profile?.role !== "admin") return NextResponse.json({ error: "Admin only." }, { status: 403 });

    const body = await request.json().catch(() => ({}));
    const escrowId = body.escrow_id;
    if (!escrowId) return NextResponse.json({ error: "Missing escrow." }, { status: 400 });

    const { data: hold, error } = await admin.from("escrow_holds").select("*").eq("id", escrowId).maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!hold) return NextResponse.json({ error: "Escrow not found." }, { status: 404 });
    if (hold.status === "released") return NextResponse.json({ hold });
    if (hold.status !== "locked") {
      return NextResponse.json({ error: "Payment is not on hold yet." }, { status: 400 });
    }

    const { data: task, error: taskError } = await admin.from("tasks").select("id, title, status, extras, accepted_tasker_id").eq("id", hold.task_id).maybeSingle();
    if (taskError) return NextResponse.json({ error: taskError.message }, { status: 500 });
    if (!delivered(task)) {
      return NextResponse.json({ error: "The tasker has not marked this delivered yet." }, { status: 400 });
    }

    const now = new Date().toISOString();
    const { data: updated, error: updateError } = await admin
      .from("escrow_holds")
      .update({ status: "released", released_at: now })
      .eq("id", hold.id)
      .eq("status", "locked")
      .select()
      .maybeSingle();
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

    await admin.from("activity_logs").insert({
      actor_id: profile.id,
      actor_name: profile.full_name,
      action: "escrow_released",
      detail: `Released ₱${hold.tasker_payout} to ${hold.tasker_name || "the tasker"} · platform fee ₱${hold.platform_fee}`,
      target_id: hold.task_id,
    });
    if (hold.tasker_id) {
      await admin.from("notifications").insert({
        user_id: hold.tasker_id,
        task_id: hold.task_id,
        text: `Your payout of ₱${Number(hold.tasker_payout || 0).toLocaleString("en-PH")} for "${task?.title || "a gawain"}" was released.`,
      });
    }

    return NextResponse.json({ hold: updated || hold });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Could not release escrow." }, { status: 500 });
  }
}
