"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import { drivingRoute } from "@/lib/deliveryTrack";

function esc(value) {
  return String(value || "").replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));
}

function pinIcon(L, color, label) {
  return L.divIcon({
    className: "",
    iconSize: [28, 36],
    iconAnchor: [14, 34],
    html: `<div style="position:relative;width:28px;height:36px">
      <svg viewBox="0 0 28 36" width="28" height="36" style="filter:drop-shadow(0 3px 4px rgba(0,0,0,.35))">
        <path d="M14 1C7.4 1 2 6.2 2 12.6 2 21.4 14 35 14 35s12-13.6 12-22.4C26 6.2 20.6 1 14 1Z" fill="${color}" stroke="#fff" stroke-width="1.6"/>
        <circle cx="14" cy="12.4" r="4.2" fill="#fff"/>
      </svg>
      <span style="position:absolute;left:50%;top:-18px;transform:translateX(-50%);white-space:nowrap;border-radius:999px;background:#102636;color:#F7F4EC;font:800 10px/1 system-ui,sans-serif;padding:4px 6px">${esc(label)}</span>
    </div>`,
  });
}

function riderIcon(L) {
  return L.divIcon({
    className: "",
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    html: `<div style="display:grid;place-items:center;width:36px;height:36px;border-radius:999px;background:#E6C22E;box-shadow:0 4px 10px rgba(0,0,0,.35)">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#163044" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/>
        <path d="M6 17h4l2-6h4l2 4h2M9 8h3"/>
      </svg>
    </div>`,
  });
}

function frameMap(map, points, animate) {
  const spots = points.filter((point) => point && Number.isFinite(point[0]) && Number.isFinite(point[1]));
  if (!map || !spots.length) return;
  if (spots.length === 1) {
    map.setView(spots[0], 15, { animate });
    return;
  }
  map.fitBounds(spots, {
    paddingTopLeft: [40, 64],
    paddingBottomRight: [40, 36],
    maxZoom: 16,
    animate,
  });
}

export default function DeliveryRouteMap({ start, end, rider, center, startLabel, endLabel, areaLabel, distanceLabel }) {
  const boxRef = useRef(null);
  const mapRef = useRef(null);
  const frameRef = useRef(() => {});
  const startLat = start?.lat;
  const startLng = start?.lng;
  const endLat = end?.lat;
  const endLng = end?.lng;
  const riderLat = rider?.lat;
  const riderLng = rider?.lng;
  const centerLat = center?.[0] ?? startLat ?? endLat ?? 9.7392;
  const centerLng = center?.[1] ?? startLng ?? endLng ?? 118.7353;

  useEffect(() => {
    let cancelled = false;
    const boot = () => {
      const host = boxRef.current;
      if (!host || host.clientWidth < 20 || mapRef.current) return;
      import("leaflet").then((mod) => {
        if (cancelled || !boxRef.current || mapRef.current) return;
        const L = mod.default || mod;
        if (host._leaflet_id) {
          host._leaflet_id = undefined;
          host.replaceChildren();
        }
        const map = L.map(host, { zoomControl: false, attributionControl: false }).setView([centerLat, centerLng], 13);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
        const pane = map.getPane("tilePane");
        if (pane) pane.style.filter = "invert(1) hue-rotate(180deg) brightness(0.9) contrast(0.9)";
        const pins = [];
        if (startLat != null && startLng != null) {
          L.marker([startLat, startLng], { icon: pinIcon(L, "#1F9D6A", startLabel || "Pick-up point"), interactive: false }).addTo(map);
          pins.push([startLat, startLng]);
        }
        if (endLat != null && endLng != null) {
          L.marker([endLat, endLng], { icon: pinIcon(L, "#D1453B", endLabel || "Drop-off point"), interactive: false }).addTo(map);
          pins.push([endLat, endLng]);
        }
        const riderPoint = riderLat != null && riderLng != null ? [riderLat, riderLng] : null;
        if (riderPoint) {
          L.marker(riderPoint, { icon: riderIcon(L), interactive: false, zIndexOffset: 500 }).addTo(map);
        }
        let road = [];
        const frame = (animate) => frameMap(map, [...pins, riderPoint, ...road], animate);
        frameRef.current = () => frame(true);
        if (pins.length > 1) {
          const fallback = L.polyline(pins, { color: "#3A73C4", weight: 5, opacity: 0.85, dashArray: "8 12", lineCap: "round", lineJoin: "round" }).addTo(map);
          drivingRoute({ lat: startLat, lng: startLng }, { lat: endLat, lng: endLng }).then((route) => {
            if (cancelled || !mapRef.current || !route) return;
            fallback.remove();
            road = route.points.map((point) => [point.lat, point.lng]);
            L.polyline(road, { color: "#3A73C4", weight: 5, opacity: 0.95, dashArray: "8 12", lineCap: "round", lineJoin: "round", smoothFactor: 1.4 }).addTo(mapRef.current);
            frame(true);
          }).catch(() => {});
        }
        mapRef.current = map;
        requestAnimationFrame(() => {
          map.invalidateSize({ animate: false, pan: false });
          requestAnimationFrame(() => frame(false));
        });
      });
    };
    const observer = new ResizeObserver(boot);
    if (boxRef.current) observer.observe(boxRef.current);
    boot();
    return () => {
      cancelled = true;
      observer.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [startLat, startLng, endLat, endLng, riderLat, riderLng, centerLat, centerLng, startLabel, endLabel]);

  return (
    <div className="relative h-[min(16.5rem,42svh)] overflow-hidden rounded-[1.15rem] bg-[#1B2433] sm:h-[min(18rem,46svh)]">
      <div ref={boxRef} className="absolute inset-0" />
      {areaLabel ? (
        <span className="absolute left-3 top-3 z-[400] inline-flex max-w-[60%] items-center gap-1 truncate rounded-full bg-[#102636]/90 px-2.5 py-1 text-[11px] font-extrabold text-[#F7F4EC]">
          <span aria-hidden>⌂</span> {areaLabel}
        </span>
      ) : null}
      <div className="absolute right-3 top-3 z-[400] flex flex-col gap-2">
        <div className="flex flex-col overflow-hidden rounded-lg border border-white/15 bg-[#102636]/90">
          <button type="button" aria-label="Zoom in" onClick={() => mapRef.current?.zoomIn()} className="h-8 w-8 text-sm font-black text-[#F7F4EC]">+</button>
          <button type="button" aria-label="Zoom out" onClick={() => mapRef.current?.zoomOut()} className="h-8 w-8 border-t border-white/15 text-sm font-black text-[#F7F4EC]">−</button>
        </div>
        <button type="button" aria-label="Recenter on the points" onClick={() => frameRef.current()} className="grid h-8 w-8 place-items-center rounded-lg border border-white/15 bg-[#102636]/90 text-[#F7F4EC]">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
            <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.8" />
            <path d="M12 3.5v3.2M12 17.3v3.2M3.5 12h3.2M17.3 12h3.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      {distanceLabel ? (
        <span className="absolute bottom-2.5 right-3 z-[400] text-[11px] font-bold text-[#F7F4EC]/80">{distanceLabel}</span>
      ) : null}
    </div>
  );
}
