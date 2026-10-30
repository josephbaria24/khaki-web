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
    <div className="mx-auto mb-4 w-full max-w-6xl px-4 pt-2 sm:px-6 lg:px-8">
      <div className="install-banner-float">
      <div className="overflow-hidden rounded-[1.35rem] bg-white shadow-[0_8px_18px_rgba(22,48,68,0.12)] ring-1 ring-[#E6DFD2] dark:bg-[#1A1E27] dark:ring-[#2A303C]">
        <div className="flex items-center gap-1.5 py-2 pl-2.5 pr-1.5 sm:gap-2 sm:py-2.5 sm:pl-3 sm:pr-2">
          <button
            type="button"
            onClick={install}
            disabled={busy}
            className="flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-2xl text-left disabled:opacity-70"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo.png" alt="" className="h-11 w-11 shrink-0 rounded-[22%] bg-[#F3EFE3] object-contain dark:bg-[#252A35]" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-black tracking-tight text-[#163044] dark:text-[#F5F3EE]">{copy.title}</span>
              <span className="mt-0.5 block text-[12px] font-medium leading-snug text-[#6B6558] dark:text-[#94A3B8]">{copy.subtitle}</span>
            </span>
            <span className="inline-flex h-9 shrink-0 items-center rounded-full bg-[#163044] px-3.5 text-xs font-black text-[#F7F4EC] dark:bg-[#F5F3EE] dark:text-[#11141A]">
              {busy ? "…" : copy.cta}
            </span>
          </button>
          <button
            type="button"
            onClick={close}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#6B6558] transition hover:bg-[#F3EFE3] dark:text-[#94A3B8] dark:hover:bg-[#252A35]"
            aria-label="Close"
          >
            <X className="h-4 w-4" color="currentColor" />
          </button>
        </div>

        {showIosSteps ? (
          <div className="border-t border-[#E6DFD2] bg-[#FBF8F1] px-3 py-3 dark:border-[#2A303C] dark:bg-[#151922] sm:px-4">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#6B6558] dark:text-[#94A3B8]">
              {platform === "ios-safari" ? "Safari install" : "Finish in Safari"}
            </p>
            <ol className="mt-2.5 space-y-2.5">
              {IOS_STEPS.map((step, index) => (
                <li key={step.title} className="flex gap-2.5">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#163044] text-[11px] font-black text-[#F7F4EC] dark:bg-[#F5F3EE] dark:text-[#11141A]">
                    {index === 0 ? <ShareGlyph /> : index + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-black text-[#163044] dark:text-[#F5F3EE]">{step.title}</span>
                    <span className="block text-[12px] font-medium leading-snug text-[#6B6558] dark:text-[#94A3B8]">{step.detail}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        ) : null}

        {hint ? (
          <p className="border-t border-[#E6DFD2] px-3 py-2.5 text-[12px] font-medium leading-snug text-[#6B6558] dark:border-[#2A303C] dark:text-[#94A3B8] sm:px-4">
            {hint}
          </p>
        ) : null}
      </div>
      </div>
    </div>
  );
}
