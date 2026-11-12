import { createClient } from "@supabase/supabase-js";
import { headers } from "next/headers";

async function loadProfile(id) {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url || !key || !id) return null;
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data } = await supabase
    .from("profiles")
    .select("full_name, bio, avatar_url, location_area, active_mode, role")
    .eq("id", id)
    .maybeSingle();
  return data;
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const profile = await loadProfile(id);
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") || headerList.get("host") || "www.khakiplatform.com";
  const proto = headerList.get("x-forwarded-proto") || "https";
  const pageUrl = `${proto}://${host}/u/${id}`;
  const name = profile?.full_name || "Khaki member";
  const poster = profile?.active_mode === "poster" || (profile?.active_mode !== "tasker" && profile?.role !== "tasker");
  const role = poster ? "Poster" : "Tasker";
  const description = (profile?.bio || "").trim()
    || (poster
      ? `Active in ${profile?.location_area || "Palawan"}. I post tasks and hire trusted taskers.`
      : `Khaki ${role} in ${profile?.location_area || "Palawan"}.`);
  const image = profile?.avatar_url || `${proto}://${host}/icons/icon-512.png`;

  return {
    title: `${name} · ${role} on Khaki`,
    description,
    openGraph: {
      title: `${name} — ${role} on Khaki`,
      description,
      url: pageUrl,
      type: "profile",
      images: [{ url: image, alt: name }],
    },
  };
}

export default function PublicProfileLayout({ children }) {
  return children;
}
