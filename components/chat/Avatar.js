"use client";

import { useState } from "react";
import { cn, initials, avatarTone } from "@/lib/khaki";

const SIZES = {
  sm: "h-8 w-8 text-[11px]",
  md: "h-11 w-11 text-sm",
  lg: "h-14 w-14 text-base",
};

export default function ChatAvatar({ name, src, size = "md", className = "" }) {
  const [broken, setBroken] = useState(false);
  const tone = avatarTone(name);
  const photo = src && !broken ? src : null;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-black",
        SIZES[size] || SIZES.md,
        className
      )}
      style={photo ? undefined : { background: tone.bg, color: tone.fg }}
    >
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setBroken(true)}
        />
      ) : (
        initials(name)
      )}
    </span>
  );
}
