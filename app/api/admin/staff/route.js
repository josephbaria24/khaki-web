import { NextResponse } from "next/server";
import { serviceSupabase, userFromRequest } from "@/lib/paymongoServer";

export const runtime = "nodejs";

const PORTALS = new Set(["marketing", "accounting", "it", "investor"]);

function fail(message, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

async function stampProfile(admin, id, fields) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const { data, error } = await admin
      .from("profiles")
      .update(fields)
      .eq("id", id)
      .select("id, staff_portal, email, full_name")
      .maybeSingle();
    if (error) {
      if (/staff_portal|column|schema cache/i.test(error.message || "")) {
        throw new Error("Run supabase/staff_accounts.sql in the SQL editor, then create the account again.");
      }
      throw new Error(error.message);
    }
    if (data?.staff_portal) return data;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("The login was created, but the profile was not ready. Try again.");
}

export async function POST(request) {
  try {
    const caller = await userFromRequest(request);
    if (!caller) return fail("Login required.", 401);

    const admin = serviceSupabase();
    if (!admin) {
      return fail("Add SUPABASE_SERVICE_ROLE_KEY in web/.env.local and restart the server.", 500);
    }

    const { data: me, error: meError } = await admin
      .from("profiles")
      .select("id, role, staff_portal, full_name")
      .eq("id", caller.id)
      .maybeSingle();
    if (meError) return fail(meError.message, 500);
    if (!me || me.role !== "admin" || me.staff_portal) {
      return fail("Only the super admin can create staff accounts.", 403);
    }

    const body = await request.json().catch(() => ({}));
    const fullName = String(body.full_name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const portal = String(body.portal || "").trim();

    if (!fullName) return fail("Enter a name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("Enter a valid email.");
    if (password.length < 8) return fail("Use a password of at least 8 characters.");
    if (!PORTALS.has(portal)) return fail("Choose Marketing, Accounting, IT, or Investor.");

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role: "poster" },
    });
    if (createError || !created?.user) {
      const message = createError?.message || "Could not create the account.";
      if (/already|registered|exists/i.test(message)) return fail("That email is already registered.");
      return fail(message, 400);
    }

    const userId = created.user.id;
    try {
      const profile = await stampProfile(admin, userId, {
        full_name: fullName,
        email,
        staff_portal: portal,
        verification_status: "verified",
        verified_at: new Date().toISOString(),
      });
      await admin.from("activity_logs").insert({
        actor_id: me.id,
        actor_name: me.full_name || "Admin",
        action: "staff_account_created",
        detail: `Created ${portal} account for ${fullName} (${email})`,
        target_id: userId,
      });
      return NextResponse.json({
        account: {
          id: userId,
          full_name: profile.full_name,
          email,
          staff_portal: portal,
        },
      });
    } catch (error) {
      await admin.auth.admin.deleteUser(userId);
      return fail(error.message || "Could not save the staff role.");
    }
  } catch (error) {
    return fail(error.message || "Could not create the account.", 500);
  }
}
