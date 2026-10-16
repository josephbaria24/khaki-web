import { PATTERNS, PHRASES } from "./dict";

export const LANGS = [
  { id: "en", label: "English", short: "EN" },
  { id: "tl", label: "Tagalog", short: "TL" },
];

export const LANG_STORAGE_KEY = "khaki.lang";
export const DEFAULT_LANG = "en";

export function isLang(value) {
  return value === "en" || value === "tl";
}

const toEn = new Map();
const toTl = new Map();
for (const [en, tl, ...alts] of PHRASES) {
  if (!toEn.has(tl)) toEn.set(tl, en);
  if (!toTl.has(en)) toTl.set(en, tl);
  for (const alt of alts) {
    if (!toEn.has(alt)) toEn.set(alt, en);
    if (!toTl.has(alt)) toTl.set(alt, tl);
  }
}

// Quoted values ("{a}") are user content such as task titles, so they stay as written.
function compile(template) {
  const keys = [];
  const source = template
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\\\{([a-z])\\\}/g, (_, key) => {
      keys.push(key);
      return key === "n" ? "(\\d+)" : "(.+?)";
    });
  const raw = new Set(keys.filter((key) => template.includes(`"{${key}}"`)));
  return { re: new RegExp(`^${source}$`), keys, raw };
}

const lowerEn = new Map();
const lowerTl = new Map();
for (const [map, lower] of [[toEn, lowerEn], [toTl, lowerTl]]) {
  for (const [from, to] of map) {
    const key = from.toLowerCase();
    if (!lower.has(key)) lower.set(key, to);
  }
}

function lookup(text, lang) {
  const hit = (lang === "en" ? toEn : toTl).get(text);
  if (hit != null) return hit;
  if (text !== text.toLowerCase()) return undefined;
  return (lang === "en" ? lowerEn : lowerTl).get(text)?.toLowerCase();
}

function fill(template, values) {
  return template.replace(/\{([a-z])\}/g, (_, key) => values[key] ?? "");
}

const COMPILED = PATTERNS.map(([en, tl, ...alts]) => ({
  en,
  tl,
  fromTl: [tl, ...alts, en].map(compile),
  fromEn: [en, ...alts, tl].map(compile),
}));

function translateCore(text, lang) {
  const exact = lookup(text, lang);
  if (exact != null) return exact;
  for (const p of COMPILED) {
    for (const from of lang === "en" ? p.fromTl : p.fromEn) {
      const match = text.match(from.re);
      if (!match) continue;
      const values = {};
      from.keys.forEach((key, i) => {
        values[key] = from.raw.has(key) ? match[i + 1] : translateCore(match[i + 1], lang);
      });
      return fill(lang === "en" ? p.en : p.tl, values);
    }
  }
  return text;
}

export function translateText(text, lang) {
  if (typeof text !== "string" || !text) return text;
  const match = text.match(/^(\s*)([\s\S]*?)(\s*)$/);
  const core = match[2];
  if (!core) return text;
  const out = translateCore(core, lang);
  return out === core ? text : `${match[1]}${out}${match[3]}`;
}
