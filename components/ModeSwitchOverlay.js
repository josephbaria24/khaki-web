"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";

const COPY = {
  poster: { title: "Poster", sub: "Mag-post ng gawain" },
  tasker: { title: "Tasker", sub: "Maghanap ng gawain" },
};

export default function ModeSwitchOverlay() {
  const { modeFlash, clearModeFlash } = useAuth();
  const [leaving, setLeaving] = useState(false);
  const [shown, setShown] = useState(null);

  useEffect(() => {
    if (!modeFlash) {
      setShown(null);
      setLeaving(false);
      return undefined;
    }
    setShown(modeFlash);
    setLeaving(false);
    const hold = setTimeout(() => setLeaving(true), 1100);
    const done = setTimeout(() => {
      setShown(null);
      setLeaving(false);
      clearModeFlash();
    }, 1400);
    return () => {
      clearTimeout(hold);
      clearTimeout(done);
    };
  }, [modeFlash, clearModeFlash]);

  if (!shown) return null;
  const copy = COPY[shown] || COPY.poster;

  return (
    <div
      className={`mode-switch-overlay ${leaving ? "is-leaving" : ""}`}
      role="status"
      aria-live="polite"
    >
      <div className="mode-switch-card">
        <p className="mode-switch-kicker">Switching</p>
        <p className="mode-switch-title">{copy.title}</p>
        <p className="mode-switch-sub">{copy.sub}</p>
      </div>
    </div>
  );
}
