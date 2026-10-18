import { citiesIn } from "./cities.ts";

export type Kind = "form" | "email" | "jobpage" | "link";
export type Lead = { kind: Kind; value: string; domain: string };
export type Extracted = { leads: Lead[]; instruction: string; company: string };

const FORM = /forms\.gle|docs\.google\.com\/forms|typeform\.com|tally\.so|airtable\.com\/shared|forms\.office\.com|jotform\.com/i;
const JOB = /linkedin\.com\/jobs|lnkd\.in|lever\.co|greenhouse\.io|workable\.com|ashbyhq\.com|naukri\.com|wellfound\.com|careers?[./]|\/jobs?\//i;
const FREE_MAIL = /^(gmail|yahoo|outlook|hotmail|icloud|proton(mail)?|rediffmail)\./i;
const NO_COMPANY = /linkedin\.com|lnkd\.in|google\.com|forms\.gle|bit\.ly|t\.co/i;
const ACTION = /\b(apply|send|email|mail|fill|dm|resume|cv|reach out|drop|share|submit|comment)\b/i;

const STOP = new Set(["us", "our", "the", "a", "an", "this", "we", "you", "your", "my", "team", "now", "all", "any", "with", "as", "in", "for", "and"]);
const trim = (s: string) => s.replace(/[.,;:!?)\]}>'"]+$/, "");
const host = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };

export function extract(text: string): Extracted {
  const emails = [...new Set((text.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g) ?? []).map(trim))];
  const urls = [...new Set((text.match(/https?:\/\/[^\s<>"]+/gi) ?? []).map(trim))];
  const leads: Lead[] = [
    ...urls.map((value): Lead => ({ value, domain: host(value), kind: FORM.test(value) ? "form" : JOB.test(value) ? "jobpage" : "link" })),
    ...emails.map((value): Lead => ({ value, domain: value.split("@")[1], kind: "email" })),
  ];
  const instruction = text.split(/(?<=[.!?])\s+|\n+/).map((s) => s.trim()).filter((s) => ACTION.test(s)).slice(0, 3).join(" ");
  let named = ""; // "hiring at X" is the strongest signal; "Join Our Team" / "at Mumbai" are not companies
  for (const m of text.matchAll(/\b(hiring at|@|join|at)\s+([A-Z][\w&.-]*(?:\s[A-Z][\w&.-]*)?)/g)) {
    const c = m[2].replace(/[.,;:!?-]+$/, "");
    if (STOP.has(c.split(/\s/)[0].toLowerCase()) || citiesIn(c).length) continue;
    if (m[1] === "hiring at") { named = c; break; }
    named ||= c;
  }
  const dom = leads.map((l) => l.domain).find((d) => d && !FREE_MAIL.test(d) && !NO_COMPANY.test(d));
  return { leads, instruction, company: named || dom?.split(".")[0] || "" };
}

// Agents often write "Role firm (via Agency)" or "Not named in post": research the agency, or nothing.
export function researchName(company: string) {
  const via = company.match(/\bvia\s+([^)]+)\)?\s*$/i)?.[1];
  const name = (via ?? company.replace(/\(.*?\)/g, "")).trim();
  return /\b(not|unnamed|undisclosed)\b.*\b(named|stated|specified|disclosed)\b|^confidential$/i.test(name) ? "" : name;
}

export function lookups(company: string) {
  const name = researchName(company);
  if (!name) return [] as const;
  const q = encodeURIComponent(name);
  return [
    ["LinkedIn company", `https://www.linkedin.com/search/results/companies/?keywords=${q}`],
    ["Founders & leadership", `https://www.google.com/search?q=${q}+founder+CEO+CHRO`],
    ["Funding (Crunchbase)", `https://www.crunchbase.com/textsearch?q=${q}`],
    ["Reviews (Glassdoor)", `https://www.glassdoor.com/Search/results.htm?keyword=${q}`],
  ] as const;
}
