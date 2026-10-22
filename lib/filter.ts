import { TAXONOMY } from "./taxonomy.ts";
import type { Opp } from "./ingest.ts";
import type { Lead } from "./extract.ts";
import { citiesIn } from "./cities.ts";

export type Filters = {
  q: string; where: string; areas: string[]; mode: string[]; src: string[]; via: string[];
  city: string[]; days: number; sort: "new" | "rel" | "fresh"; saved: boolean; forYou: boolean;
};
export const EMPTY: Filters = { q: "", where: "", areas: [], mode: [], src: [], via: [], city: [], days: 0, sort: "new", saved: false, forYou: false };

const GENERIC = new Set(["and", "the", "management", "analysis", "services", "operations"]);
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Whole-word regex over the sub-area names. "Finance" (category only) expands to all its sub-areas.
export function areaRegex(areas: string[]) {
  const ps = areas.flatMap((a) => (a.includes(" / ") ? [a] : (TAXONOMY[a] ?? []).map((s) => `${a} / ${s}`)));
  const w = ps.flatMap((p) => p.slice(p.indexOf(" / ") + 3).toLowerCase().split(/[\s/,()-]+/)).filter((x) => x.length >= 3 && !GENERIC.has(x));
  // "Accounting" must also catch "Accountant"/"Accounts": stems of 4+ letters match as a word prefix
  const pat = [...new Set(w.map((x) => { const s = x.replace(/(ation|ing|ments?|ers?|ists?|s)$/, ""); return s.length >= 4 ? `${esc(s)}\\w*` : esc(s.length === 3 ? s : x); }))]; // 3-letter stems ("tax") match whole word only
  return pat.length ? new RegExp(`(^|[^\\w])(${pat.join("|")})($|[^\\w])`, "i") : null;
}

export const modeOf = (o: Opp) => (/\bremote\b/i.test(`${o.loc} ${o.title}`) ? "Remote" : /\bhybrid\b/i.test(`${o.loc} ${o.title} ${o.text}`) ? "Hybrid" : "On-site");
// Every real city named in the location; unknown places fall back to their first segment.
export const citiesOf = (o: Opp) => {
  const c = citiesIn(o.loc);
  if (c.length) return c;
  const first = o.loc.replace(/\(.*?\)/g, "").split(/[;,/]/)[0].trim();
  return !first || /\b(not|n\/a|none|unspecified)\b/i.test(first) ? ["Not specified"] : [first];
};
export const srcOf = (o: Opp) => o.source;
const LABEL = { form: "Apply form", email: "Email", jobpage: "Job page", link: "Link" } as const;
export const labelOf = (l: Lead) => (l.kind === "link" && /linkedin\.com/.test(l.domain) ? "LinkedIn post" : LABEL[l.kind]);
export const viaOf = (o: Opp) => [...new Set(o.leads.map(labelOf))];

export const ago = (iso: string, now = Date.now()) => {
  const h = (now - Date.parse(iso)) / 36e5;
  return h < 1 ? "Just now" : h < 24 ? `${Math.floor(h)}h ago` : h < 720 ? `${Math.floor(h / 24)}d ago` : "30d+ ago";
};

// Stage 1: what the user typed/picked. Facet counts are computed on this set.
// "India" must also match posts that only name an Indian city (they say "Mumbai", not "India")
export function baseFilter(feed: Opp[], f: Filters) {
  const words = f.q.toLowerCase().split(/\s+/).filter(Boolean);
  const where = f.where.toLowerCase().trim();
  const area = areaRegex(f.areas);
  return feed.filter((o) => {
    const hay = `${o.title} ${o.company} ${o.loc} ${o.text}`.toLowerCase();
    return words.every((w) => hay.includes(w)) && (!where || `${o.loc} ${o.text}`.toLowerCase().includes(where) || (where === "india" && citiesIn(o.loc).length > 0)) && (!area || area.test(o.title));
  });
}

// Stage 2: sidebar facets, then sort.
export function finish(base: Opp[], f: Filters, saved: Set<string>, now = Date.now()) {
  const words = f.q.toLowerCase().split(/\s+/).filter(Boolean);
  const score = (o: Opp) => words.reduce((s, w) => s + (o.title.toLowerCase().includes(w) ? 3 : 0) + (o.company.toLowerCase().includes(w) ? 2 : 0), 0);
  return base
    .filter((o) =>
      (!f.mode.length || f.mode.includes(modeOf(o))) &&
      (!f.src.length || f.src.includes(srcOf(o))) &&
      (!f.via.length || viaOf(o).some((v) => f.via.includes(v))) &&
      (!f.city.length || citiesOf(o).some((c) => f.city.includes(c))) &&
      (!f.days || now - Date.parse(o.date) <= f.days * 864e5) &&
      (!f.saved || saved.has(o.id)))
    .sort((a, b) => (f.sort === "rel" ? score(b) - score(a) : 0) || (f.sort === "fresh" ? (b.firstSeen ?? b.date).localeCompare(a.firstSeen ?? a.date) : 0) || b.date.localeCompare(a.date));
}

export function count(list: Opp[], key: (o: Opp) => string | string[]) {
  const m = new Map<string, number>();
  for (const o of list) for (const k of [key(o)].flat()) m.set(k, (m.get(k) ?? 0) + 1);
  return [...m].sort((a, b) => b[1] - a[1]);
}
