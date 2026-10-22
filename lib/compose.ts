import type { Profile, Template } from "./profile.ts";
import type { Cv } from "./cv.ts";
import type { Opp } from "./ingest.ts";

// Placeholders that may legitimately be empty: their whole line is dropped instead of blocking the email.
const DROPPABLE = new Set(["linkedin_url", "portfolio_url", "matched_skills_line", "post_hook", "cv_link", "poster_first_name"]);
const an = (s: string) => (/^[aeiou]/i.test(s) ? "an" : "a");

function profileSentence(p: Profile) {
  const deg = p.degree && p.college ? `${p.degree} student at ${p.college}` : p.degree ? `${p.degree} student` : p.college ? `student at ${p.college}` : "student";
  const grad = p.graduation_year ? `, graduating in ${p.graduation_year}` : "";
  const s = p.status === "working"
    ? `${p.current_role || "working professional"}${p.experience_years ? ` with ${p.experience_years} years of experience` : ""}`
    : p.status === "fresher"
      ? `${p.degree ? `${p.degree} graduate` : "recent graduate"}${p.college ? ` from ${p.college}` : ""}${p.graduation_year ? ` (${p.graduation_year})` : ""}`
      : deg + grad;
  return `${an(s)} ${s}.`;
}

// Skills the post asks for that the candidate really lists (profile skills + CV skills). Empty = the line is dropped.
export function matchedSkills(post: Pick<Opp, "required_skills">, p: Profile, cv?: Cv | null) {
  const mine = [...p.skills.split(/[,;\n]/), ...(cv?.skills ?? [])].map((x) => x.trim().toLowerCase()).filter(Boolean);
  return (post.required_skills ?? []).filter((r) => mine.some((m) => m === r.toLowerCase() || m.includes(r.toLowerCase()) || r.toLowerCase().includes(m)));
}
const list = (a: string[]) => (a.length > 1 ? `${a.slice(0, -1).join(", ")} and ${a.at(-1)}` : a[0] ?? "");

export type Composed = { to: string; subject: string; body: string; missing: string[] };
export const leftover = (t: string) => [...new Set(t.match(/\{\{\s*\w+\s*\}\}/g) ?? [])];

// Pure code, no AI: fill the user's template from profile + CV + the post. Anything unresolved is reported in `missing`.
export function compose(p: Profile, cv: Cv | null, tpl: Template, post: Opp, cvLink = ""): Composed {
  const matched = matchedSkills(post, p, cv).slice(0, 4);
  const poster = post.poster_name ?? "";
  const vars: Record<string, string> = {
    ...p, role: post.title.slice(0, 100), company: post.company || "your organisation",
    poster_name: poster, poster_first_name: poster ? poster.split(/\s+/)[0] : "Hiring Team",
    post_hook: post.post_highlight
      ? `I came across your post about this opening, and it caught my eye that the team is ${post.post_highlight}.`
      : `I saw ${poster ? `${poster}'s` : "your"} post about this opening and am applying directly, as requested in the post.`,
    matched_skills_line: matched.length ? `Your post mentions ${list(matched)}, which are part of my background.` : "",
    profile_sentence: profileSentence(p), availability_sentence: p.availability ? `I am available ${p.availability}.` : "", cv_link: cvLink,
  };
  const missing = new Set<string>();
  const fill = (text: string) =>
    text.split("\n").flatMap((line) => {
      let drop = false;
      const out = line.replace(/\{\{\s*(\w+)\s*\}\}/g, (m, k: string) => {
        const v = vars[k];
        if (v === undefined) { missing.add(k); return m; }
        if (!v) { if (DROPPABLE.has(k)) drop = true; else missing.add(k); }
        return v ?? "";
      });
      return drop ? [] : [out];
    }).join("\n").replace(/\n{3,}/g, "\n\n").trim();

  let subject = fill(tpl.subject);
  if (post.subject_template) { // the post's own format always wins
    subject = post.subject_template
      .replace(/\[\s*(role|position|job\s*title)[^\]]*\]/gi, vars.role)
      .replace(/\[\s*(your\s+)?(full\s+)?name\s*\]/gi, p.full_name)
      .replace(/\[\s*company[^\]]*\]/gi, post.company || "");
    for (const m of subject.match(/\[[^\]]+\]/g) ?? []) missing.add(m);
  }
  return { to: post.apply_email ?? "", subject, body: fill(tpl.body), missing: [...missing] };
}
