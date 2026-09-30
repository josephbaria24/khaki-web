"use client";

import { useEffect, useState } from "react";
import { X } from "@/components/icons";
import {
  isAndroid,
  isAndroidChrome,
  isAppInstalled,
  isIOS,
  isIOSSafari,
  markAppInstalled,
  openInChrome,
  openInSafari,
  promptInstall,
} from "@/lib/installApp";

const SAFARI_STEPS = "Tap the Share button, then Add to Home Screen.";
const SAFARI_HANDOFF = "Open this page in Safari, tap Share, then Add to Home Screen.";

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" aria-hidden="true">
      <path d="M12 4v10m0 0 3.5-3.5M12 14 8.5 10.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 16.5V18a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export default function InstallAppBanner() {
  const [visible, setVisible] = useState(false);
  const [guide, setGuide] = useState("");

  useEffect(() => {
    let cancelled = false;
    isAppInstalled().then((installed) => {
      if (cancelled || installed) return;
      setVisible(true);
      const params = new URLSearchParams(window.location.search);
      if (params.get("install") === "safari" && isIOS()) {
        setGuide(isIOSSafari() ? SAFARI_STEPS : SAFARI_HANDOFF);
        const url = new URL(window.location.href);
        url.searchParams.delete("install");
        const next = `${url.pathname}${url.search}${url.hash}`;
        window.history.replaceState(null, "", next);
      }
    });
    const onInstalled = () => {
      markAppInstalled();
      setVisible(false);
    };
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      cancelled = true;
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!visible) return null;

  const close = () => {
    setVisible(false);
  };

  const install = async () => {
    if (isIOS()) {
      if (isIOSSafari()) {
        setGuide(SAFARI_STEPS);
        return;
      }
      setGuide(SAFARI_HANDOFF);
      openInSafari();
      return;
    }
    if (isAndroid() && !isAndroidChrome()) {
      openInChrome();
      return;
    }
    const outcome = await promptInstall();
    if (outcome === "accepted") {
      markAppInstalled();
      close();
      return;
    }
    if (outcome == null) setGuide("Open the browser menu and choose Install app.");
  };

  return (
    <div className="mx-auto mb-4 w-full max-w-6xl px-4 sm:px-6 lg:px-8">
      <div className="relative flex items-center overflow-hidden rounded-[1.25rem] bg-gradient-to-r from-[#163044] via-[#1F6A62] to-[#3A73C4] p-1.5 shadow-[0_12px_28px_rgba(22,48,68,0.28)]">
        <span className="pointer-events-none absolute -right-4 -top-8 h-20 w-20 rounded-full bg-[#C8F0D8]/35" aria-hidden />
        <span className="pointer-events-none absolute -bottom-8 right-24 h-16 w-16 rounded-full bg-[#FAD4DC]/45" aria-hidden />
        <button
          type="button"
          onClick={install}
          className="relative flex min-h-12 min-w-0 flex-1 items-center gap-2.5 rounded-[1rem] px-2 py-1.5 text-left"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#C8F0D8] text-[#163044]">
            <DownloadIcon />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-black text-white">Install the app</span>
            <span className="block truncate text-[11px] font-semibold text-[#C8F0D8]">One tap, then it lives on your home screen</span>
          </span>
          <span className="shrink-0 rounded-full bg-[#FAD4DC] px-2.5 py-1 text-[11px] font-black text-[#9D3A5C]">Get</span>
        </button>
        <button
          type="button"
          onClick={close}
          className="relative mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-white"
          aria-label="Close"
        >
          <X className="h-3.5 w-3.5" color="currentColor" />
        </button>
      </div>
      {guide ? (
        <p className="mt-2 rounded-xl bg-[#163044] px-3 py-2 text-[11px] font-semibold leading-snug text-[#F7F4EC]">
          {guide}
        </p>
      ) : null}
    </div>
  );
}
