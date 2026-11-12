"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const VIEW = 280;

export default function AvatarCropper({ file, onCancel, onConfirm }) {
  const imgRef = useRef(null);
  const dragRef = useRef(null);
  const [src, setSrc] = useState("");
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const cover = natural.w && natural.h ? Math.max(VIEW / natural.w, VIEW / natural.h) : 1;
  const scale = cover * zoom;
  const display = { w: natural.w * scale, h: natural.h * scale };

  const clamp = (next, z = zoom) => {
    const s = cover * z;
    const w = natural.w * s;
    const h = natural.h * s;
    const limitX = Math.max(0, (w - VIEW) / 2);
    const limitY = Math.max(0, (h - VIEW) / 2);
    return {
      x: Math.min(limitX, Math.max(-limitX, next.x)),
      y: Math.min(limitY, Math.max(-limitY, next.y)),
    };
  };

  const onPointerDown = (event) => {
    dragRef.current = { x: event.clientX, y: event.clientY, ox: offset.x, oy: offset.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event) => {
    if (!dragRef.current) return;
    const dx = event.clientX - dragRef.current.x;
    const dy = event.clientY - dragRef.current.y;
    setOffset(clamp({ x: dragRef.current.ox + dx, y: dragRef.current.oy + dy }));
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  const confirm = async () => {
    const image = imgRef.current;
    if (!image || !natural.w) return;
    setBusy(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext("2d");
      const left = (VIEW - display.w) / 2 + offset.x;
      const top = (VIEW - display.h) / 2 + offset.y;
      const sx = -left / scale;
      const sy = -top / scale;
      const sw = VIEW / scale;
      ctx.drawImage(image, sx, sy, sw, sw, 0, 0, 512, 512);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
      const cropped = new File([blob], "avatar.jpg", { type: "image/jpeg" });
      await onConfirm(cropped);
    } finally {
      setBusy(false);
    }
  };

  if (!src || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#0C2230]/70 p-4">
      <div className="w-full max-w-sm rounded-[1.4rem] bg-white p-4 shadow-card dark:bg-[#1A1E27]">
        <p className="text-center text-sm font-black text-[#163044] dark:text-[#F5F3EE]">Crop photo</p>
        <p className="mt-1 text-center text-xs text-[#5F6B76] dark:text-[#A8B3C0]">Drag to move. Slide to zoom.</p>
        <div
          className="relative mx-auto mt-4 overflow-hidden rounded-full bg-[#11141A]"
          style={{ width: VIEW, height: VIEW, maxWidth: "100%", touchAction: "none" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={src}
            alt=""
            draggable={false}
            onLoad={(e) => setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
            className="absolute left-1/2 top-1/2 max-w-none select-none"
            style={{
              width: display.w || VIEW,
              height: display.h || VIEW,
              transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
            }}
          />
        </div>
        <label className="mt-4 block text-[11px] font-bold text-[#5F6B76] dark:text-[#A8B3C0]">
          Zoom
          <input
            type="range"
            min="1"
            max="3"
            step="0.01"
            value={zoom}
            onChange={(e) => {
              const next = Number(e.target.value);
              setZoom(next);
              setOffset((current) => clamp(current, next));
            }}
            className="mt-1 w-full accent-[#163044]"
          />
        </label>
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={onCancel} className="h-10 flex-1 rounded-full bg-[#E7F1FA] text-sm font-black text-[#163044] dark:bg-[#243445] dark:text-[#E7F1FA]">
            Cancel
          </button>
          <button type="button" onClick={confirm} disabled={busy || !natural.w} className="poster-photo-btn h-10 flex-1 rounded-full text-sm font-black disabled:opacity-60">
            {busy ? "Saving" : "Use photo"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
