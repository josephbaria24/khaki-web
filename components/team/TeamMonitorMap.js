"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import { timeAgo } from "@/lib/khaki";

const PPC = [9.7392, 118.7353];

function esc(value) {
  return String(value || "").replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));
}

function pinIcon(L, presence) {
  const fill = presence === "busy" ? "#C4841D" : presence === "online" ? "#1A7A58" : "#163044";
  return L.divIcon({
    className: "",
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    html: `<div style="width:28px;height:36px;filter:drop-shadow(0 3px 5px rgba(22,48,68,.4))">
      <svg viewBox="0 0 28 36" width="28" height="36">
        <path d="M14 1C7.4 1 2 6.2 2 12.6 2 21.4 14 35 14 35s12-13.6 12-22.4C26 6.2 20.6 1 14 1Z" fill="${fill}" stroke="#fff" stroke-width="1.8"/>
        <circle cx="14" cy="12.4" r="4.2" fill="#fff"/>
      </svg>
    </div>`,
  });
}

function refreshSize(map) {
  if (!map) return;
  map.invalidateSize({ animate: false, pan: false });
  requestAnimationFrame(() => map.invalidateSize({ animate: false, pan: false }));
  setTimeout(() => map.invalidateSize({ animate: false, pan: false }), 160);
}

export default function TeamMonitorMap({ riders }) {
  const [ready, setReady] = useState(false);
  const [dark, setDark] = useState(false);
  const shellRef = useRef(null);
  const boxRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const leafletRef = useRef(null);

  const points = (riders || []).filter(
    (row) => Number.isFinite(Number(row.last_lat)) && Number.isFinite(Number(row.last_lng))
  );
  const pointsKey = points
    .map((p) => `${p.tasker_id}:${p.last_lat}:${p.last_lng}:${p.last_location_at || ""}`)
    .join("|");

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setDark(root.classList.contains("dark"));
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    let booting = false;

    const boot = () => {
      if (cancelled || booting || mapRef.current) return;
      const host = boxRef.current;
      if (!host || host.clientWidth < 40 || host.clientHeight < 40) return;
      booting = true;
      import("leaflet")
        .then((mod) => {
          if (cancelled || !boxRef.current || mapRef.current) {
            booting = false;
            return;
          }
          const L = mod.default || mod;
          leafletRef.current = L;
          const el = boxRef.current;
          if (el._leaflet_id) {
            el._leaflet_id = undefined;
            el.replaceChildren();
          }
          const map = L.map(el, { zoomControl: false, attributionControl: false }).setView(PPC, 12);
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: "&copy; OpenStreetMap",
          }).addTo(map);
          L.control.zoom({ position: "bottomright" }).addTo(map);
          layerRef.current = L.layerGroup().addTo(map);
          mapRef.current = map;
          setReady(true);
          refreshSize(map);
          booting = false;
        })
        .catch(() => {
          booting = false;
        });
    };

    const onResize = () => {
      if (mapRef.current) refreshSize(mapRef.current);
      else boot();
    };
    const observer = new ResizeObserver(onResize);
    if (shellRef.current) observer.observe(shellRef.current);
    if (boxRef.current) observer.observe(boxRef.current);
    boot();
    const t1 = setTimeout(boot, 80);
    const t2 = setTimeout(boot, 300);
    return () => {
      cancelled = true;
      clearTimeout(t1);
      clearTimeout(t2);
      observer.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
      leafletRef.current = null;
      setReady(false);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    const L = leafletRef.current;
    if (!map || !layer || !L || !ready) return;
    layer.clearLayers();
    const latlngs = [];
    points.forEach((row) => {
      const lat = Number(row.last_lat);
      const lng = Number(row.last_lng);
      const marker = L.marker([lat, lng], { icon: pinIcon(L, row.presence) });
      const seen = row.last_location_at ? `Last seen ${timeAgo(row.last_location_at)}` : "Last seen —";
      marker.bindPopup(
        `<strong>${esc(row.full_name || "Rider")}</strong><br/><span style="font-size:12px">${esc(seen)}</span>`
      );
      marker.addTo(layer);
      latlngs.push([lat, lng]);
    });
    refreshSize(map);
    if (latlngs.length > 1) map.fitBounds(latlngs, { padding: [36, 36], maxZoom: 14 });
    else if (latlngs.length === 1) map.setView(latlngs[0], 14);
    else map.setView(PPC, 12);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pointsKey, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const pane = map.getPane("tilePane");
    if (pane) {
      pane.style.filter = dark
        ? "invert(1) hue-rotate(180deg) brightness(0.95) contrast(0.9)"
        : "";
    }
  }, [dark, ready]);

  return (
    <div
      ref={shellRef}
      className="relative h-[16rem] w-full overflow-hidden rounded-[1.25rem] border border-[#E6DDD0]/80 bg-[#FBF8F1] sm:h-[20rem] dark:border-white/10 dark:bg-[#1A1E27]"
    >
      <div ref={boxRef} className="absolute inset-0 z-0 h-full w-full" />
      {!ready ? (
        <div className="pointer-events-none absolute inset-0 z-[20] flex items-center justify-center">
          <p className="rounded-full bg-white/95 px-4 py-2 text-xs font-bold text-[#2A3F4D]/70 shadow-sm dark:bg-[#1A1E27]/95 dark:text-[#F5F3EE]/70">
            Loading map…
          </p>
        </div>
      ) : null}
      {ready && !points.length ? (
        <div className="pointer-events-none absolute inset-0 z-[20] flex items-center justify-center bg-[#FBF8F1]/35 dark:bg-[#11141A]/35">
          <p className="max-w-[16rem] rounded-2xl bg-white/95 px-4 py-3 text-center text-xs font-bold leading-snug text-[#2A3F4D]/70 shadow-sm dark:bg-[#1A1E27]/95 dark:text-[#F5F3EE]/70">
            No rider pins yet. When a rider goes Online with location on, they appear here with a last-seen time.
          </p>
        </div>
      ) : null}
      <p className="pointer-events-none absolute bottom-2 left-3 z-[30] rounded-full bg-[#163044]/85 px-2.5 py-1 text-[10px] font-bold text-[#F7F4EC]">
        {points.length} on map · last seen only
      </p>
    </div>
  );
}
