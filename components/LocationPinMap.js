"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import { MapPin, Maximize, Minimize, X } from "@/components/icons";
import { cn } from "@/lib/khaki";

const FIXED_LOCKS = [
  ["transform", "none"],
  ["filter", "none"],
  ["perspective", "none"],
  ["will-change", "auto"],
  ["animation", "none"],
];

function releaseFixedAncestors(el) {
  const restores = [];
  let node = el?.parentElement;
  while (node && node !== document.documentElement) {
    const cs = getComputedStyle(node);
    const willChange = cs.willChange || "";
    if (cs.transform !== "none" || cs.filter !== "none" || cs.perspective !== "none" || willChange.includes("transform") || cs.animationName !== "none") {
      restores.push({
        node,
        props: FIXED_LOCKS.map(([prop]) => [prop, node.style.getPropertyValue(prop), node.style.getPropertyPriority(prop)]),
      });
      FIXED_LOCKS.forEach(([prop, value]) => node.style.setProperty(prop, value, "important"));
    }
    node = node.parentElement;
  }
  return () => {
    restores.forEach((item) => {
      item.props.forEach(([prop, value, priority]) => {
        item.node.style.removeProperty(prop);
        if (value) item.node.style.setProperty(prop, value, priority);
      });
    });
  };
}

function pinIcon(L, color, label) {
  return L.divIcon({
    className: "",
    iconSize: [34, 44],
    iconAnchor: [17, 42],
    html: `<div style="position:relative;width:34px;height:44px">
      <svg viewBox="0 0 34 44" width="34" height="44" style="filter:drop-shadow(0 4px 6px rgba(22,48,68,.35))">
        <path d="M17 1C8.2 1 1 8 1 16.8 1 28.6 17 43 17 43s16-14.4 16-26.2C33 8 25.8 1 17 1Z" fill="${color}" stroke="#fff" stroke-width="2"/>
        <circle cx="17" cy="16.5" r="6" fill="#fff"/>
      </svg>
      <span style="position:absolute;left:50%;top:-20px;transform:translateX(-50%);white-space:nowrap;border-radius:999px;background:#163044;color:#F7F4EC;font:800 10px/1 system-ui,sans-serif;padding:4px 7px">${label}</span>
    </div>`,
  });
}

export default function LocationPinMap({ center, slots, pins, onChange, compact = false }) {
  const shellRef = useRef(null);
  const boxRef = useRef(null);
  const mapRef = useRef(null);
  const leafletRef = useRef(null);
  const markersRef = useRef({});
  const activeRef = useRef(slots[0]?.key);
  const pinsRef = useRef(pins);
  const [active, setActive] = useState(slots[0]?.key);
  const [ready, setReady] = useState(false);
  const [locating, setLocating] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const restoreAncestorsRef = useRef(null);

  pinsRef.current = pins;
  activeRef.current = active;

  const place = (key, latlng) => {
    const next = { ...pinsRef.current, [key]: { lat: latlng.lat, lng: latlng.lng } };
    onChange(next);
    const idx = slots.findIndex((s) => s.key === key);
    const nextEmpty = slots.find((s, i) => i > idx && !next[s.key]);
    if (nextEmpty) setActive(nextEmpty.key);
  };

  useEffect(() => {
    if (!slots.some((s) => s.key === active)) setActive(slots[0]?.key);
  }, [slots, active]);

  useEffect(() => {
    let cancelled = false;
    let booting = false;
    const node = boxRef.current;
    const boot = () => {
      if (cancelled || booting || mapRef.current) return;
      const box = boxRef.current;
      if (!box || box.clientWidth < 20 || box.clientHeight < 20) return;
      booting = true;
      import("leaflet").then((mod) => {
        if (cancelled || !boxRef.current || mapRef.current) return;
        const L = mod.default || mod;
        leafletRef.current = L;
        const host = boxRef.current;
        if (host._leaflet_id) {
          host._leaflet_id = undefined;
          host.replaceChildren();
        }
        const map = L.map(host, { zoomControl: true, attributionControl: true }).setView(center, 14);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "&copy; OpenStreetMap",
        }).addTo(map);
        map.on("click", (e) => place(activeRef.current, e.latlng));
        mapRef.current = map;
        setReady(true);
        requestAnimationFrame(() => map.invalidateSize({ animate: false, pan: false }));
      });
    };
    const observer = new ResizeObserver(boot);
    if (node) observer.observe(node);
    boot();
    return () => {
      cancelled = true;
      observer.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const hasPin = slots.some((s) => pins[s.key]);
    if (!hasPin) map.setView(center, 14);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center[0], center[1], ready]);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;
    for (const [key, marker] of Object.entries(markersRef.current)) {
      if (!pins[key] || !slots.some((s) => s.key === key)) {
        marker.remove();
        delete markersRef.current[key];
      }
    }
    for (const slot of slots) {
      const pin = pins[slot.key];
      if (!pin) continue;
      const existing = markersRef.current[slot.key];
      if (existing) {
        existing.setLatLng([pin.lat, pin.lng]);
        continue;
      }
      const marker = L.marker([pin.lat, pin.lng], { draggable: true, icon: pinIcon(L, slot.color, slot.short) }).addTo(map);
      marker.on("dragend", () => place(slot.key, marker.getLatLng()));
      markersRef.current[slot.key] = marker;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pins, slots, ready]);

  useEffect(() => {
    const node = boxRef.current;
    const frame = node?.parentElement;
    if (!node || !frame) return undefined;
    if (fullscreen) {
      const height = frame.clientHeight;
      node.style.position = "absolute";
      node.style.top = "0";
      node.style.right = "0";
      node.style.bottom = "0";
      node.style.left = "0";
      node.style.width = "100%";
      node.style.height = height > 20 ? `${height}px` : "100%";
    } else {
      node.style.position = "relative";
      node.style.top = "";
      node.style.right = "";
      node.style.bottom = "";
      node.style.left = "";
      node.style.width = "";
      node.style.height = "";
    }
    const fit = () => {
      if (!mapRef.current || node.clientWidth < 20 || node.clientHeight < 20) return;
      mapRef.current.invalidateSize({ animate: false, pan: false });
    };
    const frameObserver = new ResizeObserver(() => {
      if (fullscreen) {
        const next = frame.clientHeight;
        if (next > 20) node.style.height = `${next}px`;
      }
      fit();
    });
    frameObserver.observe(frame);
    frameObserver.observe(node);
    const frameId = requestAnimationFrame(fit);
    const later = setTimeout(fit, 200);
    const afterEnter = setTimeout(fit, 600);
    return () => {
      frameObserver.disconnect();
      cancelAnimationFrame(frameId);
      clearTimeout(later);
      clearTimeout(afterEnter);
    };
  }, [fullscreen, ready, compact]);

  useEffect(() => {
    if (!fullscreen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [fullscreen]);

  useEffect(() => {
    if (fullscreen) return undefined;
    restoreAncestorsRef.current?.();
    restoreAncestorsRef.current = null;
    return undefined;
  }, [fullscreen]);

  const toggleFullscreen = () => {
    if (fullscreen) {
      setFullscreen(false);
      return;
    }
    restoreAncestorsRef.current?.();
    restoreAncestorsRef.current = releaseFixedAncestors(shellRef.current);
    setFullscreen(true);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const latlng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        mapRef.current?.setView([latlng.lat, latlng.lng], 17);
        place(activeRef.current, latlng);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const clear = (key) => {
    const next = { ...pins };
    delete next[key];
    onChange(next);
    setActive(key);
  };

  const activeSlot = slots.find((s) => s.key === active) || slots[0];

  return (
    <div
      ref={shellRef}
      className={cn(
        "overflow-hidden bg-white",
        fullscreen
          ? "fixed inset-0 z-[2000] flex h-dvh max-h-dvh w-dvw flex-col pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]"
          : "relative z-0 rounded-2xl border border-[#EFE7DA]"
      )}
    >
      {slots.length > 1 ? (
        <div className="grid grid-cols-2 gap-1.5 p-2">
          {slots.map((slot) => (
            <button
              key={slot.key}
              type="button"
              onClick={() => setActive(slot.key)}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-[12px] font-bold",
                active === slot.key ? "bg-[#163044] text-[#F7F4EC]" : "bg-[#F3EFE3] text-[#163044]"
              )}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: slot.color }} />
              {slot.label}
              {pins[slot.key] ? <span aria-hidden>✓</span> : null}
            </button>
          ))}
        </div>
      ) : null}

      <div className={cn("relative", fullscreen && "min-h-0 w-full flex-1")}>
        <div ref={boxRef} className={cn("map-pin-canvas w-full", compact ? "is-compact h-40 sm:h-56" : "h-64 sm:h-72")} style={{ zIndex: 0 }} />
        <button
          type="button"
          onClick={toggleFullscreen}
          aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen map"}
          title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
          className="absolute left-[10px] top-[84px] z-[400] grid h-[34px] w-[34px] place-items-center rounded-[4px] border-2 border-black/20 bg-white bg-clip-padding text-[#163044] hover:bg-[#F4F4F4]"
        >
          {fullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </button>
        <div className="pointer-events-none absolute left-2 right-2 top-2 z-[400] flex justify-center">
          <span className="rounded-full bg-[#163044]/90 px-3 py-1.5 text-[11px] font-bold text-[#F7F4EC] shadow">
            I-tap ang mapa para i-pin ang {activeSlot?.label.toLowerCase()}
          </span>
        </div>
        <button
          type="button"
          onClick={useMyLocation}
          className="absolute bottom-3 right-3 z-[400] inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-[11px] font-bold text-[#163044] shadow-md"
        >
          <MapPin className="h-3.5 w-3.5" color="#2F6F9A" />
          {locating ? "Hinahanap..." : "Gamitin ang location ko"}
        </button>
      </div>

      <div className="space-y-1.5 p-2.5">
        {slots.map((slot) => (
          <div key={slot.key} className="flex items-center gap-2 rounded-xl bg-[#FBF8F1] px-3 py-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: slot.color }} />
            <span className="min-w-0 flex-1 text-[12px] font-semibold text-[#163044]">
              {slot.label}:{" "}
              {pins[slot.key] ? (
                <span className="font-bold">{pins[slot.key].lat.toFixed(5)}, {pins[slot.key].lng.toFixed(5)}</span>
              ) : (
                <span className="font-medium text-[#2A3F4D]/45">Wala pang pin</span>
              )}
            </span>
            {pins[slot.key] ? (
              <button type="button" onClick={() => clear(slot.key)} aria-label={`Clear ${slot.label}`} className="rounded-full p-1 text-[#2A3F4D]/55 hover:bg-black/5">
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
