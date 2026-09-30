const INSTALLED_KEY = "khaki.appInstalled";
const DISMISS_KEY = "khaki.installBannerClosed";

let deferredPrompt = null;

function rememberPrompt(event) {
  event.preventDefault();
  deferredPrompt = event;
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", rememberPrompt);
  window.addEventListener("appinstalled", () => {
    markAppInstalled();
  });
  try {
    window.localStorage.removeItem(DISMISS_KEY);
  } catch {
    /* ignore */
  }
  if (process.env.NODE_ENV === "production") {
    const register = () => {
      if (!("serviceWorker" in navigator)) return;
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register);
  }
}

export function markAppInstalled() {
  try {
    window.localStorage.setItem(INSTALLED_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function isStandaloneApp() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function installWasRecorded() {
  try {
    return window.localStorage.getItem(INSTALLED_KEY) === "1";
  } catch {
    return false;
  }
}

export async function isAppInstalled() {
  if (isStandaloneApp() || installWasRecorded()) return true;
  if (typeof navigator.getInstalledRelatedApps !== "function") return false;
  try {
    const related = await navigator.getInstalledRelatedApps();
    const installed = related.some((app) => app.platform === "webapp");
    if (installed) markAppInstalled();
    return installed;
  } catch {
    return false;
  }
}

export function isAndroid() {
  return /Android/i.test(navigator.userAgent);
}

export function isAndroidChrome() {
  const ua = navigator.userAgent;
  return isAndroid() && /Chrome\/\d/.test(ua) && !/EdgA|OPR\/|SamsungBrowser|Firefox\/|FBAN|FBAV|Instagram/.test(ua) && !/; wv\)/.test(ua);
}

export function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function isIOSSafari() {
  const ua = navigator.userAgent;
  const inApp = /FBAN|FBAV|Instagram|Line\/|Twitter|GSA\/|CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  return isIOS() && /Safari/.test(ua) && !inApp;
}

export function openInChrome() {
  const url = new URL(window.location.href);
  url.hash = "";
  const fallback = encodeURIComponent(url.toString());
  const scheme = url.protocol.replace(":", "");
  window.location.href = `intent://${url.host}${url.pathname}${url.search}#Intent;scheme=${scheme};package=com.android.chrome;S.browser_fallback_url=${fallback};end`;
}

export function openInSafari() {
  const url = new URL(window.location.href);
  url.hash = "";
  url.searchParams.set("install", "safari");
  const absolute = url.toString();
  window.location.href = absolute.replace(/^https:\/\//i, "x-safari-https://").replace(/^http:\/\//i, "x-safari-http://");
}

export async function promptInstall() {
  if (!deferredPrompt) return null;
  deferredPrompt.prompt();
  const choice = await deferredPrompt.userChoice;
  deferredPrompt = null;
  return choice.outcome;
}
