"use client";

import { useEffect, useRef, useState } from "react";
import {
  decodeSignatureStrokes,
  encodeSignatureStrokes,
  hasDrawnSignature,
  signaturePath,
} from "@/lib/taskerApplication";

const TEAL = "#0D666A";
const HEIGHT = 148;

function paint(canvas, strokes) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1;
  const width = canvas.width / dpr;
  const height = canvas.height / dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = TEAL;
  ctx.lineWidth = 2.4;
  (strokes || []).forEach((stroke) => {
    if (!stroke || stroke.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(stroke[0][0] * width, stroke[0][1] * height);
    stroke.slice(1).forEach(([x, y]) => ctx.lineTo(x * width, y * height));
    ctx.stroke();
  });
}

function pointFromEvent(event, canvas) {
  const rect = canvas.getBoundingClientRect();
  const source = event.touches?.[0] || event.changedTouches?.[0] || event;
  const x = (source.clientX - rect.left) / rect.width;
  const y = (source.clientY - rect.top) / rect.height;
  return [Math.min(1, Math.max(0, x)), Math.min(1, Math.max(0, y))];
}

export function SignaturePreview({ value, className = "" }) {
  const strokes = decodeSignatureStrokes(value);
  if (value?.startsWith("data:image")) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={value} alt="Signature" className={`h-16 w-full object-contain object-left ${className}`} />
    );
  }
  if (strokes?.length) {
    return (
      <svg viewBox="0 0 100 40" className={`h-16 w-full ${className}`} aria-hidden>
        <path d={signaturePath(strokes, 100, 40)} fill="none" stroke={TEAL} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (value) return <p className={`font-serif italic text-sm ${className}`}>{value}</p>;
  return null;
}

export default function SignaturePad({ value, onChange, disabled }) {
  const canvasRef = useRef(null);
  const strokesRef = useRef(decodeSignatureStrokes(value) || []);
  const drawingRef = useRef(false);
  const [, setTick] = useState(0);

  const bump = () => setTick((n) => n + 1);

  const redraw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(parent?.clientWidth || 280, 160);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(HEIGHT * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${HEIGHT}px`;
    paint(canvas, strokesRef.current);
  };

  useEffect(() => {
    strokesRef.current = decodeSignatureStrokes(value) || [];
    redraw();
  }, [value]);

  useEffect(() => {
    redraw();
    const onResize = () => redraw();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const start = (event) => {
    if (disabled) return;
    event.preventDefault();
    drawingRef.current = true;
    const canvas = canvasRef.current;
    canvas.setPointerCapture?.(event.pointerId);
    strokesRef.current = [...strokesRef.current, [pointFromEvent(event, canvas)]];
    paint(canvas, strokesRef.current);
    bump();
  };

  const move = (event) => {
    if (!drawingRef.current || disabled) return;
    event.preventDefault();
    const canvas = canvasRef.current;
    const current = strokesRef.current[strokesRef.current.length - 1];
    current.push(pointFromEvent(event, canvas));
    paint(canvas, strokesRef.current);
  };

  const end = (event) => {
    if (!drawingRef.current) return;
    event.preventDefault();
    drawingRef.current = false;
    onChange(encodeSignatureStrokes(strokesRef.current));
  };

  const empty = !(strokesRef.current.length || hasDrawnSignature(value));

  return (
    <div className="mt-1">
      <div
        className="relative overflow-hidden rounded-xl bg-[#FFFCF7]"
        style={{ border: `1.5px dashed ${TEAL}66`, height: HEIGHT }}
      >
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 h-full w-full touch-none ${disabled ? "cursor-default" : "cursor-crosshair"}`}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
          onPointerCancel={end}
        />
        <div className="pointer-events-none absolute inset-x-4 bottom-4 border-b border-[#0D666A]/35" />
        {empty ? (
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-[12px] font-semibold text-[#0D666A]/45">
            Sign here
          </p>
        ) : null}
        {!disabled ? (
          <button
            type="button"
            className="absolute right-2 top-2 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#0D666A] shadow-sm"
            onClick={() => {
              strokesRef.current = [];
              onChange("");
              redraw();
            }}
          >
            Clear
          </button>
        ) : null}
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">Draw your signature with mouse, trackpad, or finger.</p>
    </div>
  );
}
