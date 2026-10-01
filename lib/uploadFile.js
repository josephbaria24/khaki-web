import { supabase } from "@/lib/supabase";

export async function uploadToCloudinary(file, folder = "khaki/uploads") {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Login required.");

  const body = new FormData();
  body.append("file", file);
  body.append("folder", folder);
  const response = await fetch("/api/upload", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Upload failed.");
  return payload;
}
