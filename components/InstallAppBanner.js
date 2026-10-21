"use client";

import { useEffect, useMemo, useState } from "react";
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

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" aria-hidden="true">
      <path d="M12 4v10m0 0 3.5-3.5M12 14 8.5 10.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 16.5V18a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function ShareGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
      <path d="M12 3v11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8.5 6.5 12 3l3.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

const IOS_STEPS = [
  { title: "Tap Share", detail: "Use the Share icon at the bottom of Safari." },
  { title: "Add to Home Screen", detail: "Scroll the sheet and choose Add to Home Screen." },
  { title: "Tap Add", detail: "Confirm — Khaki will sit on your home screen." },
];

export default function InstallAppBanner() {
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState("other");
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState("");
  const [showIosSteps, setShowIosSteps] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const nextPlatform = isIOS()
      ? isIOSSafari()
        ? "ios-safari"
        : "ios-other"
      : isAndroid()
        ? isAndroidChrome()
          ? "android-chrome"
          : "android-other"
        : "other";

    isAppInstalled().then((installed) => {
      if (cancelled || installed) return;
      setPlatform(nextPlatform);
      setVisible(true);
      const params = new URLSearchParams(window.location.search);
      if (params.get("install") === "safari" && isIOS()) {
        setShowIosSteps(true);
        if (!isIOSSafari()) {
          setHint("Open this page in Safari to finish installing.");
        }
        const url = new URL(window.location.href);
        url.searchParams.delete("install");
        window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
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

  const copy = useMemo(() => {
    switch (platform) {
      case "android-chrome":
        return {
          title: "Install Khaki",
          subtitle: "Add it from Chrome — one tap to your home screen.",
          cta: "Install",
        };
      case "android-other":
        return {
          title: "Install in Chrome",
          subtitle: "Open this page in Chrome, then install the app.",
          cta: "Open Chrome",
        };
      case "ios-safari":
        return {
          title: "Add to Home Screen",
          subtitle: "Install Khaki from Safari in three quick steps.",
          cta: "Show steps",
        };
      case "ios-other":
        return {
          title: "Install in Safari",
          subtitle: "iPhone and iPad install only works in Safari.",
          cta: "Open Safari",
        };
      default:
        return {
          title: "Install the app",
          subtitle: "Put Khaki on your home screen for faster access.",
          cta: "Install",
        };
    }
  }, [platform]);

  if (!visible) return null;

  const close = () => setVisible(false);

  const install = async () => {
    setHint("");
    if (platform === "ios-safari") {
      setShowIosSteps(true);
      return;
    }
    if (platform === "ios-other") {
      setShowIosSteps(true);
      setHint("If Safari does not open, copy the link and paste it there.");
      openInSafari();
      return;
    }
    if (platform === "android-other") {
      openInChrome();
      return;
    }

    setBusy(true);
    try {
      const outcome = await promptInstall();
      if (outcome === "accepted") {
        markAppInstalled();
        close();
        return;
      }
      if (outcome === "dismissed") {
        setHint("Install cancelled. You can try again anytime from Chrome’s menu.");
        return;
      }
      setHint("In Chrome, open the menu (⋮) and tap Install app or Add to Home screen.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto mb-4 w-full max-w-6xl px-4 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-[1.25rem] bg-gradient-to-r from-[#163044] via-[#1F6A62] to-[#3A73C4] p-1.5 shadow-[0_12px_28px_rgba(22,48,68,0.28)]">
        <span className="pointer-events-none absolute -right-4 -top-8 h-20 w-20 rounded-full bg-[#C8F0D8]/35" aria-hidden />
        <span className="pointer-events-none absolute -bottom-8 right-24 h-16 w-16 rounded-full bg-[#FAD4DC]/45" aria-hidden />

        <div className="relative flex items-start gap-1">
          <button
            type="button"
            onClick={install}
            disabled={busy}
            className="flex min-h-12 min-w-0 flex-1 items-center gap-2.5 rounded-[1rem] px-2 py-1.5 text-left disabled:opacity-70"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#C8F0D8] text-[#163044]">
              <DownloadIcon />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-black text-white">{copy.title}</span>
              <span className="mt-0.5 block text-[11px] font-semibold leading-snug text-[#C8F0D8]">{copy.subtitle}</span>
            </span>
            <span className="shrink-0 rounded-full bg-[#FAD4DC] px-2.5 py-1 text-[11px] font-black text-[#9D3A5C]">
              {busy ? "…" : copy.cta}
            </span>
          </button>
          <button
            type="button"
            onClick={close}
            className="mt-1.5 mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-white"
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5" color="currentColor" />
          </button>
        </div>

        {showIosSteps ? (
          <div className="relative mt-1.5 rounded-[1rem] bg-[#0F2433]/55 px-3 py-3 text-[#F7F4EC]">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#C8F0D8]">
              {platform === "ios-safari" ? "Safari install" : "Finish in Safari"}
            </p>
            <ol className="mt-2 space-y-2">
              {IOS_STEPS.map((step, index) => (
                <li key={step.title} className="flex gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#C8F0D8] text-[10px] font-black text-[#163044]">
                    {index === 0 ? <ShareGlyph /> : index + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[12px] font-black">{step.title}</span>
                    <span className="block text-[11px] font-semibold leading-snug text-[#F7F4EC]/75">{step.detail}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        ) : null}

        {hint ? (
          <p className="relative mt-1.5 rounded-[1rem] bg-[#0F2433]/55 px-3 py-2 text-[11px] font-semibold leading-snug text-[#F7F4EC]">
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  );
}
