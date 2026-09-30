"use client";

import { useEffect, useState } from "react";
import { X } from "@/components/icons";
import {
  closeInstallBanner,
  installBannerClosed,
  isAndroid,
  isAndroidChrome,
  isIOS,
  isIOSSafari,
  isStandaloneApp,
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
    if (isStandaloneApp() || installBannerClosed()) return undefined;
    setVisible(true);
    const params = new URLSearchParams(window.location.search);
    if (params.get("install") === "safari" && isIOS()) {
      setGuide(isIOSSafari() ? SAFARI_STEPS : SAFARI_HANDOFF);
      const url = new URL(window.location.href);
      url.searchParams.delete("install");
      const next = `${url.pathname}${url.search}${url.hash}`;
      window.history.replaceState(null, "", next);
    }
    const onInstalled = () => {
      closeInstallBanner();
      setVisible(false);
    };
    window.addEventListener("appinstalled", onInstalled);
    return () => window.removeEventListener("appinstalled", onInstalled);
  }, []);

  if (!visible) return null;

  const close = () => {
    closeInstallBanner();
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
      close();
      return;
    }
    if (outcome == null) setGuide("Open the browser menu and choose Install app.");
  };

  return (
    <div className="mx-auto mb-4 w-full max-w-6xl px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={install}
          className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-full border border-[#E6DDD0] bg-[#FFFCF7] px-3 text-left text-[#163044] shadow-card"
        >
          <DownloadIcon />
          <span className="truncate text-xs font-bold">Install the app</span>
        </button>
        <button
          type="button"
          onClick={close}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#E6DDD0] bg-[#FFFCF7] text-[#2A3F4D]"
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
