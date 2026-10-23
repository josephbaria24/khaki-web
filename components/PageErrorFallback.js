"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, CircleAlert, Refresh } from "@/components/icons";
import { isLang, LANG_STORAGE_KEY, translateText } from "@/lib/i18n";

export default function PageErrorFallback({ error, onRetry }) {
  const [lang, setLang] = useState("en");

  useEffect(() => {
    console.error(error);
    try {
      const stored = window.localStorage.getItem(LANG_STORAGE_KEY);
      if (isLang(stored)) setLang(stored);
    } catch {
      /* private mode */
    }
  }, [error]);

  const t = (text) => translateText(text, lang);

  function goBack() {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    window.location.assign("/");
  }

  const digest = error?.digest;

  return (
    <div
      data-no-translate
      role="alert"
      className="flex min-h-dvh items-center justify-center bg-background px-5 py-[max(2.5rem,env(safe-area-inset-top))] pb-[max(2.5rem,env(safe-area-inset-bottom))]"
    >
      <div className="flex w-full max-w-sm flex-col items-center text-center">
        <a href="/" className="mb-8 flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.png" alt="" className="h-10 w-10 rounded-[22.5%] object-contain" />
          <span className="text-left">
            <span className="block text-xl font-black uppercase leading-none tracking-tight text-foreground">KHAKI</span>
            <span className="mt-0.5 block text-[10px] font-semibold text-muted-foreground">{t("Jobs & Services in Palawan")}</span>
          </span>
        </a>

        <div className="grid h-16 w-16 place-items-center rounded-full bg-[#FFE4D6] text-[#163044] dark:bg-[#3A2A22] dark:text-[#FFE4D6]">
          <CircleAlert className="h-7 w-7" />
        </div>

        <h1 className="mt-5 text-2xl font-black tracking-tight text-foreground">{t("Something went wrong")}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t("This page didn't load. You can go back to where you were, or try again.")}
        </p>

        <div className="mt-7 flex w-full flex-col gap-2.5">
          <button
            type="button"
            onClick={goBack}
            className="inline-flex h-12 items-center justify-center gap-1.5 rounded-full bg-[#163044] px-5 text-sm font-black text-[#F7F4EC] dark:bg-[#F5F3EE] dark:text-[#11141A]"
          >
            <ChevronLeft className="h-4 w-4" />
            {t("Go back")}
          </button>
          <button
            type="button"
            onClick={() => onRetry?.()}
            className="inline-flex h-12 items-center justify-center gap-1.5 rounded-full bg-[#F3EFE3] px-5 text-sm font-black text-[#2C2A22] dark:bg-[#252A35] dark:text-[#F5F3EE]"
          >
            <Refresh className="h-4 w-4" />
            {t("Try again")}
          </button>
          <a
            href="/"
            className="mt-1 inline-flex h-10 items-center justify-center text-sm font-bold text-[#163044] underline-offset-4 hover:underline dark:text-[#8EC8E8]"
          >
            {t("Go home")}
          </a>
        </div>

        {process.env.NODE_ENV === "development" && error?.message ? (
          <details className="mt-8 w-full text-left">
            <summary className="cursor-pointer text-xs font-semibold text-muted-foreground">{t("Technical details")}</summary>
            <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-2xl bg-[#F3EFE3] p-3 text-left text-xs text-muted-foreground dark:bg-[#252A35]">
              {error.message}
            </pre>
          </details>
        ) : digest ? (
          <p className="mt-6 text-xs text-muted-foreground">
            {t("Error code")}: {digest}
          </p>
        ) : null}
      </div>
    </div>
  );
}
