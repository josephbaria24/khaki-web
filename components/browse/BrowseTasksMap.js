"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import { Maximize, Minimize } from "@/components/icons";
import { taskMapPoint } from "@/lib/browseMap";

function esc(value) {
  return String(value || "").replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));
}

function markerIcon(L, selected) {
  const fill = selected ? "#2F8AD4" : "#163044";
  const size = selected ? 34 : 28;
  return L.divIcon({
    className: "",
    iconSize: [size, Math.round(size * 1.28)],
    iconAnchor: [size / 2, Math.round(size * 1.28)],
    html: `<div style="width:${size}px;height:${Math.round(size * 1.28)}px;filter:drop-shadow(0 3px 5px rgba(22,48,68,.4))">
      <svg viewBox="0 0 28 36" width="${size}" height="${Math.round(size * 1.28)}">
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
  setTimeout(() => map.invalidateSize({ animate: false, pan: false }), 120);
  setTimeout(() => map.invalidateSize({ animate: false, pan: false }), 400);
}

export default function BrowseTasksMap({ tasks, selectedId, onSelect }) {
  const [dark, setDark] = useState(false);
  const [ready, setReady] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const shellRef = useRef(null);
  const boxRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const leafletRef = useRef(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const points = (tasks || []).map(taskMapPoint).filter(Boolean);
  const pointsKey = points.map((p) => `${p.id}:${p.lat}:${p.lng}`).join("|");

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
      if (!host) return;
      // Wait until the pane is actually visible and sized (hidden md:flex, flex fill, etc.)
      if (host.clientWidth < 40 || host.clientHeight < 40) return;
      booting = true;
      import("leaflet").then((mod) => {
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
        const map = L.map(el, {
          zoomControl: false,
          attributionControl: false,
        }).setView([9.7392, 118.7353], 9);
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
      }).catch(() => {
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
    // Retry once layout settles (PublicShell / flex / md breakpoint)
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
    points.forEach((point) => {
      const marker = L.marker([point.lat, point.lng], {
        icon: markerIcon(L, point.id === selectedId),
        title: esc(point.label),
      });
      marker.on("click", () => onSelectRef.current?.(point.id));
      marker.addTo(layer);
      latlngs.push([point.lat, point.lng]);
    });

    refreshSize(map);

    if (selectedId) {
      const selected = points.find((p) => p.id === selectedId);
      if (selected) map.setView([selected.lat, selected.lng], Math.max(map.getZoom(), 11), { animate: true });
    } else if (latlngs.length > 1) {
      map.fitBounds(latlngs, { padding: [48, 48], maxZoom: 12 });
    } else if (latlngs.length === 1) {
      map.setView(latlngs[0], 11);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pointsKey, selectedId, ready]);

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

  useEffect(() => {
    if (!ready) return;
    refreshSize(mapRef.current);
  }, [expanded, ready]);

  return (
    <div
      ref={shellRef}
      className={`browse-tasks-map relative h-full min-h-[16rem] w-full overflow-hidden dark:bg-[#1A1E27] ${expanded ? "fixed inset-0 z-[80] min-h-0" : ""}`}
      style={{ background: "#FBF8F1" }}
    >
      <div
        ref={boxRef}
        className="absolute inset-0 z-0 h-full w-full"
        style={{ minHeight: "16rem", background: "#FBF8F1" }}
      />
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((open) => !open)}
        className="absolute right-3 top-3 z-[400] inline-flex h-9 items-center gap-1.5 rounded-full bg-[#163044]/90 px-3 text-[11px] font-black text-[#F7F4EC]"
      >
        {expanded ? <Minimize className="h-3.5 w-3.5" color="#F7F4EC" /> : <Maximize className="h-3.5 w-3.5" color="#F7F4EC" />}
        {expanded ? "Exit" : "Expand"}
      </button>
      {!ready ? (
        <div className="pointer-events-none absolute inset-0 z-[300] flex items-center justify-center">
          <p className="rounded-full bg-white/95 px-4 py-2 text-xs font-bold text-[#2A3F4D]/70 shadow-sm dark:bg-[#1A1E27]/95 dark:text-[#F5F3EE]/70">
            Loading OpenStreetMap…
          </p>
        </div>
      ) : null}
      {ready && !points.length ? (
        <div className="pointer-events-none absolute inset-0 z-[350] flex items-center justify-center bg-[#FBF8F1]/35 dark:bg-[#11141A]/35">
          <p className="rounded-full bg-white/95 px-4 py-2 text-xs font-bold text-[#2A3F4D]/70 shadow-sm dark:bg-[#1A1E27]/95 dark:text-[#F5F3EE]/70">
            No mappable tasks in this filter
          </p>
        </div>
      ) : null}
      <span className={`pointer-events-none absolute bottom-2 right-3 z-[400] text-[9px] font-semibold ${dark ? "text-[#F7F4EC]/70" : "text-[#163044]/55"}`}>
        © OpenStreetMap
      </span>
    </div>
  );
}
