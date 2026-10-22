import { TAXONOMY } from "./taxonomy.ts";
import type { Opp } from "./ingest.ts";
import type { Lead } from "./extract.ts";
import { citiesIn } from "./cities.ts";

export type Filters = {
  q: string; where: string; areas: string[]; mode: string[]; src: string[]; via: string[];
  city: string[]; sector: string[]; days: number; sort: "new" | "rel" | "fresh"; saved: boolean; forYou: boolean;
};
export const EMPTY: Filters = { q: "", where: "", areas: [], mode: [], src: [], via: [], city: [], sector: [], days: 0, sort: "new", saved: false, forYou: false };

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
// Sector of the hiring firm. [name, phrases that count anywhere in the post, names/short tags that count only in company + title
// (so "PE", "AMC" or a firm name in a long description cannot mislabel a post)]. A post can be in several sectors.
export const SECTORS: [string, RegExp, RegExp][] = [
  ["Investment Banking", /investment bank/i, /\b(IB|M&A|ECM|DCM|capital markets?|leveraged finance|barclays|goldman|morgan stanley|jp ?morgan|nomura|jefferies|avendus|ambit|spark capital|jm financial|axis capital|kotak mahindra capital|iifl capital|dam capital|equirus|o3 capital|rothschild|lazard|evercore|motilal oswal)\b/i],
  ["PE / VC", /private equity|venture capital|growth equity|buyout/i, /\b(PE|VC|ventures?|capital partners|kedaara|chryscapital|multiples|temasek|kkr|blackstone|carlyle|warburg|tpg|a91|elevation|lightspeed|sequoia|blume|accel)\b/i],
  ["Asset Management", /asset management|mutual funds?|hedge funds?|wealth management|portfolio management|fund management/i, /\b(AMC|PMS|AIF|asset|wealth|nippon|prudential)\b/i],
  ["Research & Broking", /equity research|stock ?broking|brokerage|sell[- ]side|buy[- ]side/i, /\b(securities|broking)\b/i],
  ["Boutique & Advisory", /boutique|transaction advisory|deal advisory|corporate finance advisory/i, /\b(boutique|advisory|advisors?|consulting|consultancy|restructuring|valuations?)\b/i],
];
// Firm types beyond finance, matched on company + title only.
SECTORS.push(
  ["Banking & NBFC", /(?!)/, /\b(banks?|nbfc|finserv|small finance|housing finance|financial services|loans?|mortgage|lending|credit|trade finance|structured finance|citi|northern trust|bse india|home first|oxyzo|fatakpay|satin|drive finance)\b/i],
  ["Big 4 & Consulting", /(?!)/, /\b(deloitte|ey|kpmg|pwc|mckinsey|bcg|bain|rsm|genpact|protiviti|grant thornton|consultant)\b/i],
  ["Technology & IT", /(?!)/, /\b(software|developer|engineer(ing)?|programmer|AI|(?<!\.)tech|technologies|technology|systems|infosys|mphasis|accenture|tcs|wipro|zensar|saas|fintech|it services)\b/i],
);
// What the role is, matched on the title only. Gives every post a tag the firm-type rules cannot.
export const FUNCTIONS: [string, RegExp][] = [
  ["Founder's Office & Strategy", /founders?['’]?s?\b|founding|chief of staff|chairman|\bstrateg/i],
  ["Marketing & Brand", /marketing|brand|\bseo\b|content|copywrit|social media|influencer|\bpr\b|public relations|publicist|creative|designer|graphic|video edit|communications?|events?/i],
  ["Growth & Sales", /growth|business development|\bBD\b|\bsales\b|account executive|category|gtm|relationship manager|lead generation|commercial|quick commerce|client relations/i],
  ["Accounting, Audit & Tax", /accountant|accounting|audit|\bCA\b|chartered|\bCMA\b|\btax\b|\bGST\b|bookkeeping|\bCPA\b|internal controls?|order to cash/i],
  ["Finance & FP&A", /FP&A|financ|budgeting|\bCFO\b|treasury|working capital/i],
  ["Risk & Compliance", /\brisk\b|compliance|\bkyc\b|forensic|surveillance|validation|underwriting|fraud/i],
  ["Operations & Trainee", /operations?|management trainee|\bMT\b|\bPMO\b|project (manager|associate)|program|supply chain|procurement|logistics|trainee|executive assistant|\bEA\b/i],
  ["HR & Talent", /\bHR\b|talent|recruit|people ops|human resources/i],
  ["Analytics & Research", /analyst|research|analytics|\bdata\b|insights|\bMIS\b/i],
];
export const SECTOR_NAMES = [...SECTORS.map(([n]) => n), ...FUNCTIONS.map(([n]) => n), "General Roles"];
export const sectorOf = (o: Opp) => {
  const ct = `${o.company} ${o.title}`, all = `${ct} ${o.text} ${o.instruction}`;
  const hit = [...SECTORS.filter(([, anywhere, short]) => anywhere.test(all) || short.test(ct)).map(([n]) => n), ...FUNCTIONS.filter(([, re]) => re.test(o.title)).map(([n]) => n)];
  return hit.length ? hit : ["General Roles"];
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
      (!f.sector.length || sectorOf(o).some((x) => f.sector.includes(x))) &&
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
