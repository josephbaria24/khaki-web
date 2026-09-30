import { headers } from "next/headers";

export default async function manifest() {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") || headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") || "http";
  const manifestUrl = host ? `${proto}://${host}/manifest.webmanifest` : "";

  return {
    name: "Khaki — Jobs & Services in Palawan",
    short_name: "Khaki",
    description: "Post a task or find work across Palawan.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#FBF8F1",
    theme_color: "#163044",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
    ...(manifestUrl
      ? {
          related_applications: [{ platform: "webapp", url: manifestUrl }],
          prefer_related_applications: false,
        }
      : {}),
  };
}
