"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { DEFAULT_LANG, LANGS, LANG_STORAGE_KEY, isLang, translateText } from "@/lib/i18n";

const LanguageContext = createContext({ lang: DEFAULT_LANG, setLanguage: () => {}, translating: false });

const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "CODE", "PRE"]);
const ATTRS = ["placeholder", "aria-label", "title"];
const SWAP_AT = 420;
const HIDE_AT = 1150;

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

export default function LanguageProvider({ children }) {
  const [lang, setLang] = useState(DEFAULT_LANG);
  const [overlay, setOverlay] = useState(null);
  const langRef = useRef(DEFAULT_LANG);
  const textRef = useRef(new WeakMap());
  const attrRef = useRef(new WeakMap());
  const timers = useRef([]);

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

  const walk = useCallback((root) => {
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

  const apply = useCallback((next) => {
    langRef.current = next;
    setLang(next);
    document.documentElement.lang = next === "tl" ? "fil" : "en";
    walk(document.body);
  }, [walk]);

  useEffect(() => {
    apply(readLang());
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === "characterData") translateNode(record.target);
        else if (record.type === "attributes") translateAttr(record.target, record.attributeName);
        else record.addedNodes.forEach(walk);
      }
    });
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ATTRS,
    });
    const pending = timers.current;
    return () => {
      observer.disconnect();
      pending.forEach(clearTimeout);
    };
  }, [apply, translateAttr, translateNode, walk]);

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

  const setLanguage = useCallback((next) => {
    if (!isLang(next) || next === langRef.current) return;
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch {
      /* private mode */
    }
    timers.current.forEach(clearTimeout);
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      apply(next);
      return;
    }
    setOverlay({ to: next, leaving: false });
    timers.current = [
      setTimeout(() => apply(next), SWAP_AT),
      setTimeout(() => setOverlay((o) => (o ? { ...o, leaving: true } : o)), HIDE_AT),
      setTimeout(() => setOverlay(null), HIDE_AT + 260),
    ];
  }, [apply]);

  return (
    <LanguageContext.Provider value={{ lang, setLanguage, translating: Boolean(overlay) }}>
      {children}
      {overlay ? <TranslatingOverlay to={overlay.to} leaving={overlay.leaving} /> : null}
    </LanguageContext.Provider>
  );
}

function TranslatingOverlay({ to, leaving }) {
  const target = LANGS.find((l) => l.id === to) || LANGS[0];
  const from = LANGS.find((l) => l.id !== to) || LANGS[1];
  return (
    <div data-no-translate className={`lang-overlay ${leaving ? "is-leaving" : ""}`} role="status" aria-live="polite">
      <div className="lang-card">
        <div className="lang-swap" aria-hidden>
          <span className="lang-chip lang-chip-from">{from.short}</span>
          <span className="lang-arrow">⇄</span>
          <span className="lang-chip lang-chip-to">{target.short}</span>
        </div>
        <p className="lang-title">{to === "tl" ? "Nagta-translate sa Tagalog" : "Translating to English"}</p>
        <p className="lang-sub">
          {to === "tl" ? "Sandali lang" : "One moment"}
          <span className="lang-dots"><i /><i /><i /></span>
        </p>
        <div className="lang-lines" aria-hidden>
          <span style={{ width: "88%" }} />
          <span style={{ width: "64%" }} />
          <span style={{ width: "76%" }} />
        </div>
      </div>
    </div>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
