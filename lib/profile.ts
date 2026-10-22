export const STATUSES = ["student", "working", "fresher"] as const;
export type Profile = {
  full_name: string; phone: string; city: string; linkedin_url: string; portfolio_url: string; headline: string; status: string;
  current_role: string; college: string; degree: string; graduation_year: string; experience_years: string; skills: string;
  preferred_roles: string; availability: string;
};
export type Template = { subject: string; body: string };

export const PROFILE_KEYS = ["full_name", "phone", "city", "linkedin_url", "portfolio_url", "headline", "status", "current_role", "college", "degree", "graduation_year", "experience_years", "skills", "preferred_roles", "availability"] as const satisfies readonly (keyof Profile)[];
export const REQUIRED: (keyof Profile)[] = ["full_name", "phone", "city", "headline", "status", "availability"];
export const EMPTY_PROFILE = Object.fromEntries(PROFILE_KEYS.map((k) => [k, ""])) as Profile;
export const missingProfile = (p?: Partial<Profile> | null) => REQUIRED.filter((k) => !p?.[k]?.trim());

export const DEFAULT_TEMPLATE: Template = {
  subject: "Application for {{role}} — {{full_name}} | {{headline}}",
  body: `Dear {{poster_first_name}},

I am writing to apply for the {{role}} role at {{company}}. {{post_hook}}

{{matched_skills_line}}

A little about me: I am {{profile_sentence}} {{availability_sentence}}

I have attached my CV, tailored to this role. It is also available here: {{cv_link}}

I would welcome a short conversation at your convenience.

Regards,
{{full_name}}
{{phone}} | {{city}}
LinkedIn: {{linkedin_url}}
Portfolio: {{portfolio_url}}`,
};

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const url = (v: unknown) => {
  const s = str(v, 300);
  if (!s) return "";
  try { const u = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`); return /^https?:$/.test(u.protocol) && u.hostname.includes(".") ? u.href : ""; } catch { return ""; }
};

// Everything from the client is re-validated here: caps lengths, rejects non-http(s) links, restricts status.
export function cleanProfile(v: unknown): Profile {
  const r = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  const p = Object.fromEntries(PROFILE_KEYS.map((k) => [k, str(r[k], k === "skills" || k === "preferred_roles" ? 500 : 200)])) as Profile;
  p.linkedin_url = url(r.linkedin_url);
  p.portfolio_url = url(r.portfolio_url);
  if (!(STATUSES as readonly string[]).includes(p.status)) p.status = "";
  return p;
}

export function cleanTemplate(v: unknown): Template {
  const r = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  return { subject: str(r.subject, 300) || DEFAULT_TEMPLATE.subject, body: str(r.body, 4000) || DEFAULT_TEMPLATE.body };
}
