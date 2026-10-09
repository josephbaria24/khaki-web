"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import { Maximize, Minimize } from "@/components/icons";
import { drivingRoute, routeEnds, routeSummary } from "@/lib/deliveryTrack";

function esc(value) {
  return String(value || "").replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));
}

function pinIcon(L, color, label) {
  return L.divIcon({
    className: "",
    iconSize: [22, 28],
    iconAnchor: [11, 26],
    html: `<div style="position:relative;width:22px;height:28px">
      <svg viewBox="0 0 28 36" width="22" height="28" style="filter:drop-shadow(0 2px 3px rgba(22,48,68,.35))">
        <path d="M14 1C7.4 1 2 6.2 2 12.6 2 21.4 14 35 14 35s12-13.6 12-22.4C26 6.2 20.6 1 14 1Z" fill="${color}" stroke="#fff" stroke-width="1.8"/>
        <circle cx="14" cy="12.4" r="4.2" fill="#fff"/>
      </svg>
      <span style="position:absolute;left:50%;top:-16px;transform:translateX(-50%);white-space:nowrap;border-radius:999px;background:#163044;color:#F7F4EC;font:800 9px/1 system-ui,sans-serif;padding:3px 5px">${esc(label)}</span>
    </div>`,
  });
}

export default function PinPreviewMap({ pins }) {
  const [expanded, setExpanded] = useState(false);
  const [dark, setDark] = useState(false);
  const [ready, setReady] = useState(false);
  const [summary, setSummary] = useState("");
  const expandedRef = useRef(false);
  expandedRef.current = expanded;
  const boxRef = useRef(null);
  const mapRef = useRef(null);
  const pinsRef = useRef(pins);
  pinsRef.current = pins;
  const pinKey = (pins || []).map((pin) => `${pin.key}:${pin.lat}:${pin.lng}`).join("|");

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
    setSummary("");
    const points = (pinsRef.current || []).map((pin) => [Number(pin.lat), Number(pin.lng)]);
    const ends = routeEnds(pinsRef.current);
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
        const first = points[0] || [9.7392, 118.7353];
        const map = L.map(host, {
          zoomControl: false,
          attributionControl: false,
          dragging: false,
          scrollWheelZoom: false,
          doubleClickZoom: false,
          boxZoom: false,
          keyboard: false,
        }).setView(first, 14);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
        if (dark) {
          const pane = map.getPane("tilePane");
          if (pane) pane.style.filter = "invert(1) hue-rotate(180deg) brightness(0.95) contrast(0.9)";
        }
        (pinsRef.current || []).forEach((pin) => {
          L.marker([pin.lat, pin.lng], { icon: pinIcon(L, pin.color || "#2F6F9A", pin.short || pin.label), interactive: false }).addTo(map);
        });
        if (points.length > 1) map.fitBounds(points, { padding: [28, 24] });
        if (ends) {
          drivingRoute(ends.from, ends.to).then((route) => {
            if (cancelled || !mapRef.current || !route) return;
            const latlngs = route.points.map((point) => [point.lat, point.lng]);
            L.polyline(latlngs, {
              color: "#3A73C4",
              weight: 5,
              opacity: 0.9,
              dashArray: "8 12",
              lineCap: "round",
              lineJoin: "round",
              smoothFactor: 1.4,
            }).addTo(mapRef.current);
            mapRef.current.fitBounds(latlngs, { padding: [28, 24] });
            setSummary(routeSummary(route));
          }).catch(() => {});
        }
        if (expandedRef.current) {
          map.dragging.enable();
          map.scrollWheelZoom.enable();
        }
        mapRef.current = map;
        setReady(true);
        requestAnimationFrame(() => map.invalidateSize({ animate: false, pan: false }));
      });
    };
    const onResize = () => {
      if (mapRef.current) mapRef.current.invalidateSize({ animate: false, pan: false });
      else boot();
    };
    const observer = new ResizeObserver(onResize);
    if (boxRef.current) observer.observe(boxRef.current);
    boot();
    return () => {
      cancelled = true;
      observer.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
      setReady(false);
    };
  }, [pinKey, dark]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    if (expanded) {
      map.dragging.enable();
      map.scrollWheelZoom.enable();
    } else {
      map.dragging.disable();
      map.scrollWheelZoom.disable();
    }
    const frame = requestAnimationFrame(() => map.invalidateSize({ animate: false, pan: false }));
    return () => cancelAnimationFrame(frame);
  }, [expanded, ready]);

  if (!pins?.length) return null;

  return (
    <div className={`relative overflow-hidden rounded-xl border border-[#E6DDD0] bg-[#E7EEF4] dark:border-white/10 ${expanded ? "h-[min(22rem,52svh)]" : "h-28 sm:h-32"}`}>
      <div ref={boxRef} className="absolute inset-0" />
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((open) => !open)}
        className="absolute right-2 top-2 z-[400] inline-flex h-8 items-center gap-1 rounded-full bg-[#163044]/90 px-2.5 text-[11px] font-black text-[#F7F4EC]"
      >
        {expanded ? <Minimize className="h-3.5 w-3.5" color="#F7F4EC" /> : <Maximize className="h-3.5 w-3.5" color="#F7F4EC" />}
        {expanded ? "Liitan" : "Palakihin"}
      </button>
      {summary ? (
        <span className="pointer-events-none absolute bottom-1 left-2 z-[400] rounded-full bg-[#163044]/90 px-2 py-1 text-[10px] font-black text-[#F7F4EC]">{summary}</span>
      ) : null}
      <span className={`pointer-events-none absolute bottom-1 right-2 z-[400] text-[9px] font-semibold ${dark ? "text-[#F7F4EC]/70" : "text-[#163044]/55"}`}>© OpenStreetMap</span>
    </div>
  );
}
