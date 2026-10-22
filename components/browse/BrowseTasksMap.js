"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import { Maximize, Minimize } from "@/components/icons";
import { isValidLatLng, taskMapPoint } from "@/lib/browseMap";
import { browsePinIconAnchor, browsePinIconSize, browsePinMarkerHtml } from "@/lib/browsePinMarker";

const NARROW_MQ = "(max-width: 767px)";
const FLY_MS = 560;
const SELECT_HANDOFF_MS = 320;

function esc(value) {
  return String(value || "").replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));
}

function markerIcon(L, point, selected) {
  const size = browsePinIconSize(selected);
  return L.divIcon({
    className: "browse-map-pin-icon",
    iconSize: size,
    iconAnchor: browsePinIconAnchor(selected),
    html: browsePinMarkerHtml({
      icon: point.icon,
      priceLabel: point.priceLabel,
      selected,
    }),
  });
}

function refreshSize(map) {
  if (!map) return;
  map.invalidateSize({ animate: false, pan: false });
  requestAnimationFrame(() => map.invalidateSize({ animate: false, pan: false }));
  setTimeout(() => map.invalidateSize({ animate: false, pan: false }), 120);
  setTimeout(() => map.invalidateSize({ animate: false, pan: false }), 400);
}

function mapCanMove(map) {
  if (!map) return false;
  const size = map.getSize?.();
  if (!size || !(size.x > 0) || !(size.y > 0)) return false;
  const zoom = map.getZoom?.();
  if (!Number.isFinite(zoom)) return false;
  const center = map.getCenter?.();
  if (!center || !isValidLatLng(center.lat, center.lng)) return false;
  return true;
}

function safeLatLng(point) {
  if (!point || !isValidLatLng(point.lat, point.lng)) return null;
  return [Number(point.lat), Number(point.lng)];
}

export default function BrowseTasksMap({ tasks, selectedId, onSelect, onExit }) {
  const [dark, setDark] = useState(false);
  const [ready, setReady] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const shellRef = useRef(null);
  const boxRef = useRef(null);
  const mapRef = useRef(null);
  const leafletRef = useRef(null);
  const markersRef = useRef(new Map());
  const pointsRef = useRef([]);
  const selectedRef = useRef(selectedId);
  const handoffTimerRef = useRef(null);
  const pendingFlyIdRef = useRef(null);
  const onSelectRef = useRef(onSelect);
  const onExitRef = useRef(onExit);
  onSelectRef.current = onSelect;
  onExitRef.current = onExit;
  selectedRef.current = selectedId;

  const points = (tasks || []).map(taskMapPoint).filter(Boolean);
  pointsRef.current = points;
  const pointsKey = points.map((p) => `${p.id}:${p.lat}:${p.lng}:${p.budget}:${p.icon}`).join("|");

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setDark(root.classList.contains("dark"));
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const mq = window.matchMedia(NARROW_MQ);
    const sync = () => {
      const next = mq.matches;
      setNarrow(next);
      if (next) setExpanded(false);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let booting = false;

    const boot = () => {
      if (cancelled || booting || mapRef.current) return;
      const host = boxRef.current;
      if (!host) return;
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
          fadeAnimation: true,
          zoomAnimation: true,
          markerZoomAnimation: true,
        }).setView([9.7392, 118.7353], 9);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "&copy; OpenStreetMap",
        }).addTo(map);
        L.control.zoom({ position: "bottomright" }).addTo(map);
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
    const t1 = setTimeout(boot, 80);
    const t2 = setTimeout(boot, 300);

    return () => {
      cancelled = true;
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(handoffTimerRef.current);
      observer.disconnect();
      markersRef.current.clear();
      mapRef.current?.remove();
      mapRef.current = null;
      leafletRef.current = null;
      setReady(false);
    };
  }, []);

  const flyToPoint = (point, { announce } = {}) => {
    const map = mapRef.current;
    const latlng = safeLatLng(point);
    if (!map || !latlng || !mapCanMove(map)) {
      if (announce && point?.id) onSelectRef.current?.(point.id);
      return;
    }
    pendingFlyIdRef.current = point.id;
    const currentZoom = map.getZoom();
    const zoom = Number.isFinite(currentZoom) ? Math.max(currentZoom, 12) : 12;
    const clearPending = () => {
      if (pendingFlyIdRef.current === point.id) pendingFlyIdRef.current = null;
    };
    try {
      map.flyTo(latlng, zoom, {
        duration: FLY_MS / 1000,
        easeLinearity: 0.2,
      });
      map.once("moveend", clearPending);
    } catch {
      clearPending();
    }
    if (announce) {
      clearTimeout(handoffTimerRef.current);
      handoffTimerRef.current = setTimeout(() => {
        onSelectRef.current?.(point.id);
      }, SELECT_HANDOFF_MS);
    }
  };

  const setMarkerSelected = (marker, point, selected) => {
    const L = leafletRef.current;
    if (!L || !marker) return;
    marker.setIcon(markerIcon(L, point, selected));
    marker.setZIndexOffset(selected ? 600 : 0);
  };

  // Sync marker set with points (add / move / remove) without flashing on select.
  useEffect(() => {
    const map = mapRef.current;
    const L = leafletRef.current;
    if (!map || !L || !ready) return;

    const validPoints = points.filter((p) => isValidLatLng(p.lat, p.lng));
    const nextIds = new Set(validPoints.map((p) => p.id));
    markersRef.current.forEach((marker, id) => {
      if (!nextIds.has(id)) {
        map.removeLayer(marker);
        markersRef.current.delete(id);
      }
    });

    validPoints.forEach((point) => {
      const selected = point.id === selectedRef.current;
      let marker = markersRef.current.get(point.id);
      if (!marker) {
        marker = L.marker([point.lat, point.lng], {
          icon: markerIcon(L, point, selected),
          title: esc(`${point.label} · ${point.priceLabel}`),
          riseOnHover: true,
        });
        marker.on("click", () => {
          const current = pointsRef.current.find((p) => p.id === point.id) || point;
          // Optimistic highlight before parent state catches up
          markersRef.current.forEach((m, id) => {
            const p = pointsRef.current.find((row) => row.id === id);
            if (p) setMarkerSelected(m, p, id === point.id);
          });
          flyToPoint(current, { announce: true });
        });
        marker.addTo(map);
        markersRef.current.set(point.id, marker);
      } else {
        marker.setLatLng([point.lat, point.lng]);
        marker.setIcon(markerIcon(L, point, selected));
        marker.setZIndexOffset(selected ? 600 : 0);
      }
    });

    refreshSize(map);

    if (!selectedRef.current && mapCanMove(map)) {
      const latlngs = validPoints.map((p) => safeLatLng(p)).filter(Boolean);
      try {
        if (latlngs.length > 1) {
          map.fitBounds(latlngs, {
            padding: [48, 48],
            maxZoom: 12,
            animate: true,
            duration: 0.55,
          });
        } else if (latlngs.length === 1) {
          map.flyTo(latlngs[0], 11, { duration: 0.5 });
        }
      } catch {
        /* map pane not ready */
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pointsKey, ready]);

  // Selection from list (or after map handoff): update pin styles + camera.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    markersRef.current.forEach((marker, id) => {
      const point = pointsRef.current.find((p) => p.id === id);
      if (point) setMarkerSelected(marker, point, id === selectedId);
    });

    if (!selectedId) return;
    if (pendingFlyIdRef.current === selectedId) return;
    if (!mapCanMove(map)) return;
    const selected = pointsRef.current.find((p) => p.id === selectedId);
    if (!safeLatLng(selected)) return;
    flyToPoint(selected, { announce: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const pane = map.getPane("tilePane");
    if (pane) {
      pane.style.transition = "filter 0.35s ease";
      pane.style.filter = dark
        ? "invert(1) hue-rotate(180deg) brightness(0.95) contrast(0.9)"
        : "";
    }
  }, [dark, ready]);

  useEffect(() => {
    if (!ready) return;
    refreshSize(mapRef.current);
  }, [expanded, ready, narrow]);

  const showExit = narrow || expanded;

  const handleChrome = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (narrow) {
      setExpanded(false);
      onExitRef.current?.();
      return;
    }
    setExpanded((open) => !open);
  };

  return (
    <div
      ref={shellRef}
      className={`browse-tasks-map relative h-full min-h-[16rem] w-full overflow-hidden transition-[box-shadow] duration-300 dark:bg-[#1A1E27] ${expanded && !narrow ? "fixed inset-0 z-[80] min-h-0" : ""}`}
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
        aria-label={showExit ? "Exit map" : "Expand map"}
        onClick={handleChrome}
        onPointerDown={(event) => event.stopPropagation()}
        className="pointer-events-auto absolute right-3 top-3 z-[9999] inline-flex h-9 items-center gap-1.5 rounded-full bg-[#163044]/90 px-3 text-[11px] font-black text-[#F7F4EC] shadow-md transition hover:bg-[#163044]"
      >
        {showExit ? <Minimize className="h-3.5 w-3.5" color="#F7F4EC" /> : <Maximize className="h-3.5 w-3.5" color="#F7F4EC" />}
        {showExit ? "Exit" : "Expand"}
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
