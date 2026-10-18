import { extract, type Extracted } from "./extract.ts";

export type Opp = Extracted & { id: string; source: string; title: string; poster: string; date: string; loc: string; text: string };

const KINDS = ["form", "email", "jobpage", "link"];
const s = (v: unknown, max = 300) => (typeof v === "string" ? v.trim().slice(0, max) : typeof v === "number" ? String(v) : "");
// Files come from outside the site: only http(s) URLs and plain emails may become links (blocks javascript: etc).
const safe = (kind: string, v: string) => (kind === "email" ? /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(v) : /^https?:\/\/[^\s<>"]+$/i.test(v));
const domainOf = (kind: string, v: string) => { try { return kind === "email" ? v.split("@")[1] : new URL(v).hostname.replace(/^www\./, ""); } catch { return ""; } };
const hash = (t: string) => { let h = 0; for (const c of t) h = (h * 31 + c.charCodeAt(0)) | 0; return (h >>> 0).toString(36); };

// Turn one agent-supplied record (any reasonable field names) into an Opp, or null if unusable.
export function normalize(r: any, fallbackSource = "agent"): Opp | null {
  if (!r || typeof r !== "object") return null;
  const title = s(r.title ?? r.role ?? r.position, 160);
  const full = s(r.text ?? r.description ?? r.post ?? r.content, 5000);
  if (!title && !full) return null;

  const source = s(r.source, 40) || fallbackSource;
  const e = extract(`${title}\n${full}`);
  const url = s(r.url ?? r.link ?? r.post_url, 500);
  const given = [...(url ? [{ kind: "link", value: url }] : []), ...(Array.isArray(r.leads) ? r.leads : [])]
    .map((l: any) => ({ kind: KINDS.includes(l?.kind) ? (l.kind as string) : "link", value: s(l?.value ?? l?.url, 500) }));
  const seen = new Set<string>();
  const leads = [...given, ...e.leads]
    .filter((l) => safe(l.kind, l.value) && !seen.has(l.value) && seen.add(l.value))
    .map((l) => ({ kind: l.kind as Opp["leads"][number]["kind"], value: l.value, domain: domainOf(l.kind, l.value) }));

  const company = s(r.company ?? r.company_name ?? r.employer, 100) || e.company;
  const rid = s(r.id, 120);
  const d = new Date(r.date ?? r.posted_at ?? r.created_at ?? "");
  return {
    leads, company, instruction: s(r.instruction, 300) || e.instruction,
    id: rid ? (rid.startsWith(source) ? rid : `${source}-${rid}`) : `${source}-${hash(title + company + (leads[0]?.value ?? full.slice(0, 80)))}`,
    source, title: title || full.slice(0, 120), poster: s(r.poster ?? r.author ?? r.posted_by, 100), loc: s(r.loc ?? r.location, 100),
    text: full.slice(0, 300), date: isNaN(+d) ? new Date().toISOString() : d.toISOString(),
  };
}
