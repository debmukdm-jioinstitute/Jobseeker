import { extractKeywords } from "./resume.ts";
import type { Opp } from "./ingest.ts";

export type Enriched = {
  apply_type: "email" | "form" | "linkedin" | "link"; apply_email?: string; subject_template?: string;
  poster_name?: string; poster_title?: string; required_skills: string[]; post_highlight?: string;
};

// A subject the post dictates, in quotes ("with subject 'X'") or after "Subject:". Stored verbatim.
const SUBJ = /\bsubject(?:\s*line)?\s*(?:(?:as|of|is|to|should\s+(?:be|read))\s*)?[:=-]?\s*["“‘']([^\n]{3,120}?)["”’'](?=[\s.,;)]|$)/i; // closing quote must end a word, so "Founder's Office" survives
const SUBJ_PLAIN = /\bsubject\s*[:=]\s*([^\n.]{3,100})/i;
const HIGHLIGHT = /\b(?:is|are|we're|we are)\s+(entering a new phase|expanding|growing|scaling)\b/i;

// Pure text rules, run once per post by the collector (never per user or per view).
export function enrich(o: Pick<Opp, "title" | "poster" | "text" | "instruction" | "leads">): Enriched {
  const all = `${o.title}\n${o.instruction}\n${o.text}`;
  const email = o.leads.find((l) => l.kind === "email")?.value;
  const [name, title] = o.poster.split(",").map((x) => x.trim());
  const subject = (all.match(SUBJ) ?? all.match(SUBJ_PLAIN))?.[1].trim();
  return {
    apply_type: email ? "email" : o.leads.some((l) => l.kind === "form") ? "form" : o.leads.some((l) => /linkedin\.com|lnkd\.in/.test(l.domain)) ? "linkedin" : "link",
    ...(email && { apply_email: email }), ...(subject && { subject_template: subject }),
    ...(name && { poster_name: name }), ...(title && { poster_title: title }),
    required_skills: extractKeywords(`${o.title}\n${o.text}`, 8),
    ...(all.match(HIGHLIGHT) && { post_highlight: all.match(HIGHLIGHT)![1].toLowerCase() }),
  };
}
