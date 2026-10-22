import type { Cv } from "./cv.ts";

// Rule-based tailoring: only REORDERS and re-summarises what the CV already says. Nothing is added or invented.
export function tailor(cv: Cv, post: { title: string; required_skills?: string[] }, headline: string): Cv {
  const terms = [...new Set([...(post.required_skills ?? []), ...post.title.toLowerCase().split(/[^a-z&+#.]+/).filter((w) => w.length >= 4)].map((t) => t.toLowerCase()))];
  const score = (t: string) => terms.filter((x) => t.toLowerCase().includes(x)).length;
  const rank = <T,>(xs: T[], f: (x: T) => number) => xs.map((x, i) => [x, i] as const).sort((a, b) => f(b[0]) - f(a[0]) || a[1] - b[1]).map(([x]) => x);
  const skills = rank(cv.skills, score);
  const top = skills.filter((s) => score(s) > 0).slice(0, 3);
  const entries = (es: Cv["experience"]) => es.map((e) => ({ ...e, bullets: rank(e.bullets, score) }));
  const summary = top.length ? `${headline}. Strengths for this role: ${top.join(", ")}.` : cv.summary || headline;
  return { summary, skills, experience: entries(cv.experience), education: cv.education, projects: entries(cv.projects) };
}

export const cvFilename = (first: string, company: string, role: string) =>
  `${[first, "CV", company, role].map((s) => s.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "")).filter(Boolean).join("-").slice(0, 100)}.pdf`;
