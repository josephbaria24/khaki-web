import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024;

function cloudinaryConfig() {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME || "";
  const apiKey = process.env.CLOUDINARY_API_KEY || "";
  const apiSecret = process.env.CLOUDINARY_API_SECRET || "";
  if (!cloud || !apiKey || !apiSecret) return null;
  return { cloud, apiKey, apiSecret };
}

function safeFolder(value) {
  const folder = String(value || "khaki/uploads");
  return /^khaki\/[a-z0-9/_-]{1,80}$/i.test(folder) ? folder : "khaki/uploads";
}

export async function POST(request) {
  const config = cloudinaryConfig();
  if (!config) {
    return NextResponse.json(
      { error: "Cloudinary is not configured. Add CLOUDINARY_API_SECRET in web/.env.local and restart the server." },
      { status: 500 }
    );
  }

  const token = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Login required." }, { status: 401 });

  const supabase = createClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, ""),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) return NextResponse.json({ error: "Login required." }, { status: 401 });

  const form = await request.formData();
  const file = form.get("file");
  if (!file || typeof file === "string") return NextResponse.json({ error: "Choose a file." }, { status: 400 });

  const type = file.type || "application/octet-stream";
  if (!type.startsWith("image/") && type !== "application/pdf") {
    return NextResponse.json({ error: "Upload an image or PDF." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "File must be 8 MB or smaller." }, { status: 400 });

  const folder = safeFolder(form.get("folder"));
  const timestamp = Math.round(Date.now() / 1000);
  const signature = createHash("sha1")
    .update(`folder=${folder}&timestamp=${timestamp}${config.apiSecret}`)
    .digest("hex");

  const body = new FormData();
  body.append("file", file, file.name || "upload");
  body.append("api_key", config.apiKey);
  body.append("timestamp", String(timestamp));
  body.append("signature", signature);
  body.append("folder", folder);

  const uploaded = await fetch(`https://api.cloudinary.com/v1_1/${config.cloud}/auto/upload`, {
    method: "POST",
    body,
  });
  const payload = await uploaded.json().catch(() => ({}));
  if (!uploaded.ok) {
    return NextResponse.json({ error: payload?.error?.message || "Cloudinary upload failed." }, { status: 502 });
  }

  return NextResponse.json({
    name: file.name || payload.original_filename || "upload",
    type,
    size: file.size || payload.bytes || 0,
    url: payload.secure_url,
    public_id: payload.public_id,
    uploaded_at: new Date().toISOString(),
  });
}
