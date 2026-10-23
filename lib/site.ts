import type { Opp } from "./ingest.ts";
import { modeOf, sectorOf } from "./filter.ts";
import { citiesIn } from "./cities.ts";
import { liveAt } from "./notify.ts";
import { ORDER, labelOf } from "./journey.ts";

const ico = (d: string) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">${d}</svg>`;
// The nine areas of finance the site covers. `rx` decides which area a post belongs to (first match wins, title and company first).
export const FIELDS = [
  { name: "FP&A", subs: "Budgeting · Forecasting · Monthly reports", rx: /fp&a|\bfpa\b|financial planning|budget|forecast/i, icon: ico('<path d="M4 20V10m6 10V4m6 16v-7m4 7H2" transform="translate(1 0)"/>') },
  { name: "Investment Banking", subs: "M&A · ECM · DCM · Coverage", rx: /investment bank|\bm&a\b|\becm\b|\bdcm\b|pitch ?book|mergers|\bib\b|deal (team|execution)|capital markets/i, icon: ico('<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>') },
  { name: "Equity Research", subs: "Sell-side · Buy-side · Sector coverage", rx: /equity research|research analyst|sell[- ]side|buy[- ]side|equity analyst/i, icon: ico('<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>') },
  { name: "Asset Management", subs: "PMS · Mutual funds · Fund research", rx: /asset management|mutual fund|portfolio|\bpms\b|\bamc\b|wealth|fund manage/i, icon: ico('<path d="M12 3a9 9 0 1 0 9 9h-9V3z"/><path d="M15.5 2.6A9 9 0 0 1 21.4 8.5h-5.9V2.6z"/>') },
  { name: "Private Equity", subs: "PE · VC · Growth equity", rx: /private equity|venture|\bvc\b|\bpe\b|growth equity|investment (associate|analyst|intern)/i, icon: ico('<path d="M4 19V5m0 14h16M8 15l4-5 3 3 5-7"/>') },
  { name: "Corporate Finance", subs: "Fundraising · Investor relations · Corp dev", rx: /corporate finance|investor relations|fundrais|corp(orate)? dev|\bfinance\b|financial|\bbanking\b|\bbank\b|\bcfo\b/i, icon: ico('<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M9 7h2m3 0h2M9 11h2m3 0h2M9 15h2m3 0h2M10 21v-3h4v3"/>') },
  { name: "Treasury", subs: "Cash · FX · Funding & ALM", rx: /treasury|\bfx\b|\balm\b|cash management/i, icon: ico('<path d="M4 8h13l-3.5-3.5M20 16H7l3.5 3.5"/>') },
  { name: "Risk & Credit", subs: "Credit analysis · Risk modelling · Underwriting", rx: /credit|risk|underwrit|lending|\bloan/i, icon: ico('<path d="M12 3l7 3v6c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6l7-3z"/><path d="M9 12l2 2 4-4"/>') },
  { name: "Accounting & Audit", subs: "Ind AS · Reporting · Internal audit", rx: /account|audit|ind ?as|\bcfa\b|\bca\b|\btax|bookkeep|payroll|\bgst\b|reconcil/i, icon: ico('<path d="M5 4h13a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5z"/><path d="M5 4v16M9 8h6M9 12h6"/>') },
];

// Skills a candidate can tap, and how each one is spotted in a post.
export const SKILLS: [string, RegExp][] = [
  ["Financial Modelling", /financial model/i], ["DCF Valuation", /\bdcf\b|valuation/i], ["Excel", /\bexcel\b/i], ["Bloomberg", /bloomberg/i],
  ["SQL", /\bsql\b/i], ["Python", /\bpython\b/i], ["Equity Research", /equity research/i], ["Credit Analysis", /credit (analy|apprais)/i],
  ["Pitch Books", /pitch ?book/i], ["Ind AS", /ind ?as\b/i], ["Treasury", /treasury/i], ["Portfolio Analytics", /portfolio/i],
  ["PowerPoint", /power ?point|\bppt\b/i], ["Due Diligence", /due diligence/i], ["Risk Modelling", /risk model/i], ["VBA", /\bvba\b|\bmacros?\b/i],
];
export const SKILL_POOL = SKILLS.map(([n]) => n);

export const LIFE_H = 72; // every post is deleted 3 days (72 hours) after it goes up

export type Job = {
  id: string; o: Opp; title: string; company: string; field: string; sub: string; loc: string; remote: boolean; india: boolean;
  type: string; postedH: number; source: string; apply: "form" | "email"; excerpt: string; asks: string[]; skills: string[]; expMin: number; expMax: number;
};

export const fieldOf = (o: Opp) => (FIELDS.find((f) => f.rx.test(`${o.title} ${o.company}`)) ?? FIELDS.find((f) => f.rx.test(`${o.title} ${o.company} ${o.text}`)))?.name ?? "";

function years(t: string): [number, number] {
  const r = t.match(/(\d+)\s*(?:-|–|to)\s*(\d+)\s*\+?\s*(?:yrs?|years?)/i);
  if (r) return [+r[1], +r[2]];
  const p = t.match(/(\d+)\s*\+?\s*(?:yrs?|years?)/i);
  if (p) return [+p[1], +p[1] + 2];
  return /intern|fresher|graduate|trainee/i.test(t) ? [0, 1] : [0, 3];
}

export function toJob(o: Opp, now = Date.now()): Job | null {
  const field = fieldOf(o);
  if (!field) return null;
  const hay = `${o.title} ${o.text}`;
  const sents = o.text.split(/(?<=[.!?])\s+/).map((x) => x.trim());
  const asks = [...new Set([o.instruction, ...sents].map((x) => (x ?? "").trim()).filter((x) => x.length > 12 && !/^see post/i.test(x)))].slice(0, 3);
  const [expMin, expMax] = years(hay);
  const named = SKILLS.filter(([, rx]) => rx.test(hay)).map(([n]) => n);
  const extra = (o.required_skills ?? []).map((s) => s.replace(/^./, (c) => c.toUpperCase())).filter((s) => !named.some((n) => n.toLowerCase() === s.toLowerCase()));
  const remote = modeOf(o) === "Remote";
  return {
    id: o.id, o, title: o.title, company: o.company || "Company not stated", field, sub: sectorOf(o).find((s) => s !== "General Roles") ?? field, loc: o.loc || "Location not stated", remote,
    india: remote || citiesIn(o.loc).length > 0 || /india/i.test(o.loc) || !o.loc,
    type: /intern/i.test(o.title) ? "Internship" : "Full-time", postedH: Math.max(0, Math.round((now - liveAt(o)) / 36e5)), source: o.source,
    apply: o.apply_type === "email" ? "email" : "form", excerpt: sents.slice(0, 2).join(" ").slice(0, 200) || o.title,
    asks: asks.length ? asks : ["Read the original post for the details"], skills: [...named, ...extra].slice(0, 8), expMin, expMax,
  };
}

// Finance posts that are still inside their 3 days, newest first.
export const toJobs = (feed: Opp[], now = Date.now()) =>
  feed.map((o) => toJob(o, now)).filter((j): j is Job => !!j && j.postedH <= LIFE_H).sort((a, b) => a.postedH - b.postedH);

export function matchScore(j: Job, skills: Set<string>, exp: number): number | null {
  if (!skills.size) return null;
  const hits = j.skills.filter((s) => skills.has(s)).length;
  const skillPart = hits / Math.max(1, j.skills.length);
  const expFit = exp >= j.expMin && exp <= j.expMax + 2 ? 1 : exp < j.expMin ? Math.max(0, 1 - (j.expMin - exp) * 0.18) : 0.72;
  return Math.round(100 * (0.72 * skillPart + 0.28 * expFit));
}

export function lifeInfo(h: number) {
  const left = Math.max(0, LIFE_H - h), d = Math.floor(left / 24), hh = left % 24;
  const label = d > 0 ? `${d}d ${hh ? hh + "h left" : "left"}` : `${hh}h left`;
  return { pct: Math.round((left / LIFE_H) * 100), label, cls: left > 48 ? "" : left > 24 ? " mid" : " late", note: left <= 24 ? `Only ${label}, then this post is deleted` : `${label} before this post is deleted` };
}
export const timeAgo = (h: number) => (h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`);
export const initials = (n: string) => n.replace(/[^A-Za-z ]/g, "").split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "OT";
export const hue = (n: string) => { let h = 0; for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) % 360; return h; };

// STAGES: the tracker steps (see journey.ts). Saved covers saved posts and emails that were opened but not confirmed.
export const STAGE_KEYS = ORDER;
export const STAGES = ORDER.map(labelOf);
