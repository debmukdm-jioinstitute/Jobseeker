import { extractKeywords } from "./resume.ts";

export type Entry = { title: string; bullets: string[] };
export type Cv = { summary: string; skills: string[]; experience: Entry[]; education: string[]; projects: Entry[] };

const HEAD: [RegExp, keyof Cv | "skip"][] = [
  [/^(professional |career )?(summary|profile|objective|about( me)?)$/, "summary"],
  [/^(work |professional |relevant )?(experience|employment( history)?|internships?|work history)$/, "experience"],
  [/^(education|academics?|academic (background|qualifications?)|qualifications?)$/, "education"],
  [/^(technical |key |core )?(skills|competencies|core competencies|skills (&|and) tools|tools)$/, "skills"],
  [/^(academic |personal |key )?projects?$/, "projects"],
  [/^(certifications?|achievements?|awards?|positions of responsibility|extra.?curriculars?|interests|languages|references|publications)$/, "skip"],
];
const BULLET = /^[•·▪●◦*–—-]\s*/;
const heading = (l: string) => {
  const t = l.replace(/[^A-Za-z &]/g, "").trim().toLowerCase();
  return t.length <= 32 ? HEAD.find(([re]) => re.test(t))?.[1] : undefined;
};

// Rule-based (no AI): split the text on section headings, then group lines. Copies what is there, invents nothing.
export function parseCv(text: string): Cv {
  const sec: Record<string, string[]> = {};
  let cur = "";
  for (const raw of text.split(/\r?\n/)) {
    const l = raw.replace(/\s+/g, " ").trim();
    if (!l) continue;
    const h = heading(l);
    if (h) { cur = h; sec[cur] ??= []; } else if (cur) sec[cur].push(l);
  }
  const entries = (lines: string[] = []): Entry[] => {
    const out: Entry[] = [];
    for (const l of lines) {
      const last = out.at(-1);
      if (BULLET.test(l)) (last ?? out[out.push({ title: "", bullets: [] }) - 1]).bullets.push(l.replace(BULLET, ""));
      else if (last?.bullets.length && /^[a-z]/.test(l)) last.bullets[last.bullets.length - 1] += ` ${l}`; // wrapped bullet line
      else if (last && !last.bullets.length) last.title += ` · ${l}`; // "Role, Company" then "Jan 2023 – Mar 2024"
      else out.push({ title: l, bullets: [] });
    }
    return out.filter((e) => e.title || e.bullets.length).slice(0, 12).map((e) => ({ title: e.title.slice(0, 160), bullets: e.bullets.slice(0, 10).map((b) => b.slice(0, 300)) }));
  };
  const listed = (sec.skills ?? []).join(",").split(/[,•·|;]/).map((s) => s.replace(BULLET, "").replace(/^[^:]{0,30}:\s*/, "").trim()).filter((s) => s && s.length <= 40);
  const skills = [...new Set([...extractKeywords(text, 20), ...listed.map((s) => s.toLowerCase())])].slice(0, 40);
  return {
    summary: (sec.summary ?? []).join(" ").slice(0, 500), skills,
    experience: entries(sec.experience), education: (sec.education ?? []).map((s) => s.slice(0, 200)).slice(0, 8), projects: entries(sec.projects),
  };
}

const s = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const arr = <T,>(v: unknown, n: number, f: (x: unknown) => T) => (Array.isArray(v) ? v.slice(0, n).map(f) : []);
const entry = (x: unknown): Entry => {
  const r = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
  return { title: s(r.title, 160), bullets: arr(r.bullets, 10, (b) => s(b, 300)).filter(Boolean) };
};
export function cleanCv(v: unknown): Cv {
  const r = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  return {
    summary: s(r.summary, 500), skills: arr(r.skills, 40, (x) => s(x, 40)).filter(Boolean),
    experience: arr(r.experience, 12, entry).filter((e) => e.title || e.bullets.length), education: arr(r.education, 8, (x) => s(x, 200)).filter(Boolean),
    projects: arr(r.projects, 12, entry).filter((e) => e.title || e.bullets.length),
  };
}

// Editable text form: an entry is its title line then "- bullet" lines; entries are separated by a blank line.
export const entriesToText = (es: Entry[]) => es.map((e) => [e.title, ...e.bullets.map((b) => `- ${b}`)].join("\n")).join("\n\n");
export const textToEntries = (t: string): Entry[] =>
  cleanCv({ experience: t.split(/\n\s*\n/).map((blk) => { const ls = blk.split("\n").map((l) => l.trim()).filter(Boolean); const title = ls.length && !BULLET.test(ls[0]) ? ls.shift()! : ""; return { title, bullets: ls.map((l) => l.replace(BULLET, "")) }; }) }).experience;
