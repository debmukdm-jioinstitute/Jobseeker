import { TAXONOMY } from "./taxonomy.ts";
import type { Opp } from "./ingest.ts";

export type Filters = {
  q: string; where: string; areas: string[]; mode: string[]; src: string[]; via: string[];
  city: string[]; days: number; sort: "new" | "rel"; saved: boolean;
};
export const EMPTY: Filters = { q: "", where: "", areas: [], mode: [], src: [], via: [], city: [], days: 0, sort: "new", saved: false };

const GENERIC = new Set(["and", "the", "management", "analysis", "services", "operations"]);
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Whole-word regex over the sub-area names. "Finance" (category only) expands to all its sub-areas.
export function areaRegex(areas: string[]) {
  const ps = areas.flatMap((a) => (a.includes(" / ") ? [a] : (TAXONOMY[a] ?? []).map((s) => `${a} / ${s}`)));
  const w = ps.flatMap((p) => p.slice(p.indexOf(" / ") + 3).toLowerCase().split(/[\s/,()-]+/)).filter((x) => x.length >= 3 && !GENERIC.has(x));
  return w.length ? new RegExp(`(^|[^\\w])(${[...new Set(w)].map(esc).join("|")})($|[^\\w])`, "i") : null;
}

export const modeOf = (o: Opp) => (/\bremote\b/i.test(`${o.loc} ${o.title}`) ? "Remote" : /\bhybrid\b/i.test(`${o.loc} ${o.title} ${o.text}`) ? "Hybrid" : "On-site");
export const cityOf = (o: Opp) => o.loc.split(/[;,]/)[0].trim() || "Not specified";
export const srcOf = (o: Opp) => o.source;
const LABEL = { form: "Apply form", email: "Email", jobpage: "Job page", link: "Link" } as const;
export const viaOf = (o: Opp) => [...new Set(o.leads.map((l) => LABEL[l.kind]))];

export const ago = (iso: string, now = Date.now()) => {
  const h = (now - Date.parse(iso)) / 36e5;
  return h < 1 ? "Just now" : h < 24 ? `${Math.floor(h)}h ago` : h < 720 ? `${Math.floor(h / 24)}d ago` : "30d+ ago";
};

// Stage 1: what the user typed/picked. Facet counts are computed on this set.
export function baseFilter(feed: Opp[], f: Filters) {
  const words = f.q.toLowerCase().split(/\s+/).filter(Boolean);
  const where = f.where.toLowerCase().trim();
  const area = areaRegex(f.areas);
  return feed.filter((o) => {
    const hay = `${o.title} ${o.company} ${o.loc} ${o.text}`.toLowerCase();
    return words.every((w) => hay.includes(w)) && (!where || `${o.loc} ${o.text}`.toLowerCase().includes(where)) && (!area || area.test(o.title));
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
      (!f.city.length || f.city.includes(cityOf(o))) &&
      (!f.days || now - Date.parse(o.date) <= f.days * 864e5) &&
      (!f.saved || saved.has(o.id)))
    .sort((a, b) => (f.sort === "rel" ? score(b) - score(a) : 0) || b.date.localeCompare(a.date));
}

export function count(list: Opp[], key: (o: Opp) => string | string[]) {
  const m = new Map<string, number>();
  for (const o of list) for (const k of [key(o)].flat()) m.set(k, (m.get(k) ?? 0) + 1);
  return [...m].sort((a, b) => b[1] - a[1]);
}
