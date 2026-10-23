"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { DEFAULT_LANG, LANGS, LANG_STORAGE_KEY, isLang, translateText } from "@/lib/i18n";

const LanguageContext = createContext({
  lang: DEFAULT_LANG,
  setLanguage: () => {},
  finishLanguage: () => {},
  translating: false,
});

const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "CODE", "PRE"]);
const ATTRS = ["placeholder", "aria-label", "title"];
const SWAP_DESKTOP = 360;
const HIDE_DESKTOP = 900;
const SWAP_TOUCH = 180;
const HIDE_TOUCH = 520;

function skipped(el) {
  return !el || SKIP_TAGS.has(el.tagName) || Boolean(el.closest("[data-no-translate]"));
}

function readLang() {
  try {
    const stored = window.localStorage.getItem(LANG_STORAGE_KEY);
    return isLang(stored) ? stored : DEFAULT_LANG;
  } catch {
    return DEFAULT_LANG;
  }
}

function isTouchUi() {
  return Boolean(window.matchMedia?.("(hover: none) and (pointer: coarse)").matches);
}

export default function LanguageProvider({ children }) {
  const [lang, setLang] = useState(DEFAULT_LANG);
  const [overlay, setOverlay] = useState(null);
  const langRef = useRef(DEFAULT_LANG);
  const textRef = useRef(new WeakMap());
  const attrRef = useRef(new WeakMap());
  const timers = useRef([]);
  const walkToken = useRef(0);
  const pendingLang = useRef(null);

  const translateNode = useCallback((node) => {
    if (skipped(node.parentElement)) return;
    const current = node.nodeValue;
    const rec = textRef.current.get(node);
    const src = rec && current === rec.out ? rec.src : current;
    const out = translateText(src, langRef.current);
    if (out !== current) node.nodeValue = out;
    textRef.current.set(node, { src, out });
  }, []);

  const translateAttr = useCallback((el, name) => {
    if (!el.hasAttribute(name) || el.closest("[data-no-translate]")) return;
    const current = el.getAttribute(name);
    const recs = attrRef.current.get(el) || {};
    const rec = recs[name];
    const src = rec && current === rec.out ? rec.src : current;
    const out = translateText(src, langRef.current);
    if (out !== current) el.setAttribute(name, out);
    recs[name] = { src, out };
    attrRef.current.set(el, recs);
  }, []);

  const walkSync = useCallback((root) => {
    if (!root) return;
    if (root.nodeType === Node.TEXT_NODE) {
      translateNode(root);
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE) return;
    ATTRS.forEach((name) => translateAttr(root, name));
    root.querySelectorAll("[placeholder],[aria-label],[title]").forEach((el) => {
      ATTRS.forEach((name) => translateAttr(el, name));
    });
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      translateNode(node);
      node = walker.nextNode();
    }
  }, [translateAttr, translateNode]);

  /** Chunked walk so phones don't freeze the main thread. */
  const walkChunked = useCallback((root) => {
    if (!root || root.nodeType !== Node.ELEMENT_NODE) {
      walkSync(root);
      return;
    }
    ATTRS.forEach((name) => translateAttr(root, name));
    root.querySelectorAll("[placeholder],[aria-label],[title]").forEach((el) => {
      ATTRS.forEach((name) => translateAttr(el, name));
    });

    const token = ++walkToken.current;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const batch = () => {
      if (token !== walkToken.current) return;
      let n = 0;
      let node = walker.nextNode();
      while (node && n < 80) {
        translateNode(node);
        node = walker.nextNode();
        n += 1;
      }
      if (node) {
        if (typeof window.requestIdleCallback === "function") {
          window.requestIdleCallback(batch, { timeout: 48 });
        } else {
          window.setTimeout(batch, 0);
        }
      }
    };
    batch();
  }, [translateAttr, translateNode, walkSync]);

  const apply = useCallback((next, { chunked = true } = {}) => {
    langRef.current = next;
    setLang(next);
    document.documentElement.lang = next === "tl" ? "fil" : "en";
    if (chunked && isTouchUi()) walkChunked(document.body);
    else walkSync(document.body);
  }, [walkChunked, walkSync]);

  useEffect(() => {
    let cancelled = false;
    let observer = null;
    // Wait until streamed segments finish hydrating before rewriting text nodes.
    // Translating earlier makes React see English vs Tagalog (or alt spellings) as a mismatch.
    const start = () => {
      if (cancelled) return;
      apply(readLang(), { chunked: false });
      observer = new MutationObserver((records) => {
        for (const record of records) {
          if (record.type === "characterData") translateNode(record.target);
          else if (record.type === "attributes") translateAttr(record.target, record.attributeName);
          else record.addedNodes.forEach(walkSync);
        }
      });
      observer.observe(document.body, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true,
        attributeFilter: ATTRS,
      });
    };
    const idle =
      typeof window.requestIdleCallback === "function"
        ? window.requestIdleCallback(start, { timeout: 400 })
        : window.setTimeout(start, 0);
    const pending = timers.current;
    return () => {
      cancelled = true;
      if (typeof window.cancelIdleCallback === "function" && typeof idle === "number") {
        window.cancelIdleCallback(idle);
      } else {
        window.clearTimeout(idle);
      }
      observer?.disconnect();
      pending.forEach(clearTimeout);
      walkToken.current += 1;
    };
  }, [apply, translateAttr, translateNode, walkSync]);

  useEffect(() => {
    const { alert, confirm } = window;
    const tr = (message) => translateText(String(message ?? ""), langRef.current);
    window.alert = (message) => alert.call(window, tr(message));
    window.confirm = (message) => confirm.call(window, tr(message));
    return () => {
      window.alert = alert;
      window.confirm = confirm;
    };
  }, []);

  const finishLanguage = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    const pending = pendingLang.current;
    if (pending && pending !== langRef.current) apply(pending);
    pendingLang.current = null;
    setOverlay((o) => (o ? { ...o, leaving: true } : o));
    timers.current = [setTimeout(() => setOverlay(null), 200)];
  }, [apply]);

  const setLanguage = useCallback((next) => {
    if (!isLang(next) || next === langRef.current) return;
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch {
      /* private mode */
    }
    timers.current.forEach(clearTimeout);
    const touch = isTouchUi();
    const swapAt = touch ? SWAP_TOUCH : SWAP_DESKTOP;
    const hideAt = touch ? HIDE_TOUCH : HIDE_DESKTOP;
    pendingLang.current = next;
    setOverlay({ to: next, leaving: false });
    timers.current = [
      setTimeout(() => {
        apply(next);
        pendingLang.current = null;
      }, swapAt),
      setTimeout(() => setOverlay((o) => (o ? { ...o, leaving: true } : o)), hideAt),
      setTimeout(() => setOverlay(null), hideAt + 220),
    ];
  }, [apply]);

  return (
    <LanguageContext.Provider value={{ lang, setLanguage, finishLanguage, translating: Boolean(overlay) }}>
      {children}
      {overlay ? (
        <TranslatingOverlay to={overlay.to} leaving={overlay.leaving} onDismiss={finishLanguage} />
      ) : null}
    </LanguageContext.Provider>
  );
}

function TranslatingOverlay({ to, leaving, onDismiss }) {
  const target = LANGS.find((l) => l.id === to) || LANGS[0];
  const from = LANGS.find((l) => l.id !== to) || LANGS[1];
  return (
    <button
      type="button"
      data-no-translate
      className={`lang-overlay ${leaving ? "is-leaving" : ""}`}
      role="status"
      aria-live="polite"
      aria-label="Dismiss translation"
      onClick={onDismiss}
    >
      <div className="lang-card" onClick={(e) => e.stopPropagation()}>
        <div className="lang-swap" aria-hidden>
          <span className="lang-chip lang-chip-from">{from.short}</span>
          <span className="lang-arrow">⇄</span>
          <span className="lang-chip lang-chip-to">{target.short}</span>
        </div>
        <p className="lang-title">{to === "tl" ? "Nagta-translate sa Tagalog" : "Translating to English"}</p>
        <p className="lang-sub">
          {to === "tl" ? "Sandali lang · tap to skip" : "One moment · tap to skip"}
          <span className="lang-dots"><i /><i /><i /></span>
        </p>
        <div className="lang-lines" aria-hidden>
          <span style={{ width: "88%" }} />
          <span style={{ width: "64%" }} />
          <span style={{ width: "76%" }} />
        </div>
      </div>
    </button>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
