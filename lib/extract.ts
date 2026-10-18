export type Kind = "form" | "email" | "jobpage" | "link";
export type Lead = { kind: Kind; value: string; domain: string };
export type Extracted = { leads: Lead[]; instruction: string; company: string };

const FORM = /forms\.gle|docs\.google\.com\/forms|typeform\.com|tally\.so|airtable\.com\/shared|forms\.office\.com|jotform\.com/i;
const JOB = /linkedin\.com\/jobs|lnkd\.in|lever\.co|greenhouse\.io|workable\.com|ashbyhq\.com|naukri\.com|wellfound\.com|careers?[./]|\/jobs?\//i;
const FREE_MAIL = /^(gmail|yahoo|outlook|hotmail|icloud|proton(mail)?|rediffmail)\./i;
const NO_COMPANY = /linkedin\.com|lnkd\.in|google\.com|forms\.gle|bit\.ly|t\.co/i;
const ACTION = /\b(apply|send|email|mail|fill|dm|resume|cv|reach out|drop|share|submit|comment)\b/i;

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
  const named = text.match(/\b(?:hiring at|join|at|@)\s+([A-Z][\w&.-]*(?:\s[A-Z][\w&.-]*)?)/)?.[1];
  const dom = leads.map((l) => l.domain).find((d) => d && !FREE_MAIL.test(d) && !NO_COMPANY.test(d));
  return { leads, instruction, company: named ?? dom?.split(".")[0] ?? "" };
}

export function lookups(company: string) {
  const q = encodeURIComponent(company);
  return [
    ["LinkedIn company", `https://www.linkedin.com/search/results/companies/?keywords=${q}`],
    ["Founders & leadership", `https://www.google.com/search?q=${q}+founder+CEO+CHRO`],
    ["Funding (Crunchbase)", `https://www.crunchbase.com/textsearch?q=${q}`],
    ["Reviews (Glassdoor)", `https://www.glassdoor.com/Search/results.htm?keyword=${q}`],
  ] as const;
}
