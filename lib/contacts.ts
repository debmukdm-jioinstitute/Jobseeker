import type { Opp } from "./ingest.ts";

export type Contact = { id: string; name: string; title: string; company: string; sector: string; email: string; phone: string; linkedin: string; firstSeen: string; lastSeen: string };

// Industry sectors shown as filters in the Database. First match on company + role + post wins.
export const SECTORS: [string, RegExp][] = [
  ["Private Equity", /private equity|\bPE\b|growth equity|buyout|kedaara|chryscapital|a91|temasek|kkr|blackstone|carlyle|warburg|tpg/i],
  ["Venture Capital", /venture|\bVC\b|seed fund|accel\b|sequoia|peak xv|nexus|lightspeed/i],
  ["Investment Banks", /investment bank|\bIB\b|\bM&A\b|capital markets?|goldman|morgan stanley|jp ?morgan|nomura|jefferies|avendus|ambit|jm financial|barclays|deutsche|\bUBS\b|credit suisse|spark capital|axis capital|iifl capital/i],
  ["Broking Firms", /broking|brokerage|securities|stock ?broker|sharekhan|zerodha|motilal|angel one|upstox|groww|5paisa/i],
  ["Boutique Firms", /boutique|advisory|advisors?|consultanc|valuations?|restructuring|transaction/i],
  ["Asset Management", /asset management|mutual fund|\bAMC\b|wealth|\bPMS\b|\bAIF\b|fund management/i],
  ["Banks & NBFCs", /\bbanks?\b|\bNBFC\b|finserv|housing finance|small finance|finance ltd|financial services|lending|\bloans?\b|microfinance/i],
  ["Outsourcing", /outsourc|\bBPO\b|\bKPO\b|genpact|eclerx|\bWNS\b|firstsource|\bEXL\b|concentrix|conduent|teleperformance|cognizant|capgemini|shared services|startek/i],
  ["Consulting & Big 4", /deloitte|kpmg|pwc|\bEY\b|ernst|mckinsey|\bBCG\b|\bbain\b|grant thornton|\bRSM\b|protiviti|consulting/i],
];
export const SECTOR_NAMES = [...SECTORS.map(([n]) => n), "Other"];
export const sectorOf = (o: Pick<Opp, "company" | "title" | "text">) => {
  const hay = `${o.company} ${o.title} ${o.text}`;
  return SECTORS.find(([, rx]) => rx.test(o.company) )?.[0] ?? SECTORS.find(([, rx]) => rx.test(hay))?.[0] ?? "Other";
};

const PHONE = /(?:\+91[\s-]?)?\b[6-9]\d{4}[\s-]?\d{5}\b|\+\d{1,3}[\s-]?\d{8,12}\b/;
export const phoneIn = (t: string) => t.match(PHONE)?.[0].replace(/\s+/g, " ").trim() ?? "";

const ORG = /\b(ltd|limited|pvt|private|inc|llp|technologies|solutions|services|india|group|bank|capital|hr team|hiring team|careers)\b/i;
const company = (c: string) => (/\b(not|unnamed|undisclosed)\b.*\b(named|stated|specified|disclosed)\b|^confidential$/i.test(c) ? "" : c);

function linkedinOf(o: Opp, name: string) {
  const direct = o.leads.map((l) => l.value.match(/^https?:\/\/(?:[a-z]+\.)?linkedin\.com\/(?:in|company)\/[^\s/?#]+/i)?.[0]).find(Boolean);
  if (direct) return direct;
  // a post URL is /posts/<profile-vanity>_<slug>: the vanity is the poster's profile when it contains their first name
  if (ORG.test(name) || name === name.toUpperCase()) return ""; // a company page, not a person's profile
  const first = name.split(/\s+/)[0].toLowerCase().replace(/[^a-z]/g, "");
  for (const l of o.leads) {
    const v = l.value.match(/linkedin\.com\/posts\/([^_/?#]+)_/i)?.[1];
    if (v && first.length >= 3 && v.toLowerCase().includes(first)) return `https://www.linkedin.com/in/${v}`;
  }
  return "";
}

// One contact per post's poster. Needs a name and at least one way to reach them.
export function toContact(o: Opp, now = new Date().toISOString()): Contact | null {
  const raw = (o.poster || o.poster_name || "").trim();
  const inner = raw.match(/\(([^)]*)\)?/)?.[1]?.split(",")[0].trim();
  const name = raw.split(/[,(]/)[0].trim();
  if (name.length < 3) return null;
  const co = company(o.company);
  let title = (o.poster_title && !/\)/.test(o.poster_title) ? o.poster_title : inner || raw.split(",")[1] || "").trim();
  if (title.toLowerCase() === co.toLowerCase() || co.toLowerCase().startsWith(title.toLowerCase())) title = "";
  const email = o.leads.find((l) => l.kind === "email")?.value ?? "";
  const phone = phoneIn(`${o.text} ${o.instruction}`);
  const linkedin = linkedinOf(o, name);
  if (!email && !phone && !linkedin) return null;
  return { id: (email || linkedin || `${name}|${o.company}`).toLowerCase(), name, title, company: co, sector: sectorOf(o), email, phone, linkedin, firstSeen: o.firstSeen ?? now, lastSeen: o.firstSeen ?? now };
}

// Contacts never expire: posts leave the feed after a while, the people stay. Newer non-empty fields win.
export function mergeContacts(old: Contact[], feed: Opp[], now = new Date().toISOString()) {
  const by = new Map(old.map((c) => [c.id, c]));
  for (const o of feed) {
    const c = toContact(o, now);
    if (!c) continue;
    const p = by.get(c.id);
    by.set(c.id, p ? { ...p, ...Object.fromEntries(Object.entries(c).filter(([k, v]) => v && k !== "firstSeen")), lastSeen: c.lastSeen > p.lastSeen ? c.lastSeen : p.lastSeen } as Contact : c);
  }
  return [...by.values()].sort((a, b) => b.lastSeen.localeCompare(a.lastSeen));
}
