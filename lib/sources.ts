import { extract, type Extracted } from "./extract.ts";
import { readFileSync } from "node:fs";

export type Opp = Extracted & { id: string; source: string; title: string; poster: string; date: string; loc: string; text: string };

const ENT: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

export function htmlToText(h: string) {
  return h
    .replace(/<a [^>]*href="([^"]+)"[^>]*>.*?<\/a>/gis, "$1") // HN truncates link text; href is the full URL
    .replace(/<(p|br|li|div|h\d)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&#x([0-9a-f]+);/gi, (_, x) => String.fromCodePoint(parseInt(x, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
    .replace(/&(\w+);/g, (m, n) => ENT[n] ?? m)
    .trim();
}

function mk(source: string, id: string | number, title: string, company: string, poster: string, date: string | number, html: string, applyUrl = "", loc = ""): Opp {
  const text = htmlToText(html ?? "");
  const e = extract(`${title}\n${text}`);
  if (applyUrl) e.leads.unshift({ kind: "jobpage", value: applyUrl, domain: applyUrl.split("/")[2] ?? "" });
  const d = new Date(date);
  return {
    ...e, company: company || e.company, instruction: e.instruction || (applyUrl ? "Apply on the job page." : ""),
    id: `${source}-${id}`, source, title, poster, loc, text: text.slice(0, 300),
    date: isNaN(+d) ? new Date().toISOString() : d.toISOString(),
  };
}

const getJson = async (url: string) => {
  const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 Jobseeker" } });
  if (!r.ok) throw new Error(`${url} ${r.status}`);
  return r.json();
};
// one failing URL must not drop the rest of a source
const many = async (urls: string[], f: (d: any) => Opp[]): Promise<Opp[]> =>
  (await Promise.allSettled(urls.map(getJson))).flatMap((r) => (r.status === "fulfilled" ? f(r.value) : []));

async function hn(): Promise<Opp[]> {
  const s = await getJson("https://hn.algolia.com/api/v1/search_by_date?tags=story,author_whoishiring&hitsPerPage=5");
  const story = s.hits.find((h: { title: string }) => /who is hiring/i.test(h.title));
  if (!story) return [];
  const c = await getJson(`https://hn.algolia.com/api/v1/search_by_date?tags=comment,story_${story.objectID}&hitsPerPage=400&attributesToRetrieve=objectID,author,comment_text,created_at,parent_id`);
  return c.hits
    .filter((h: { parent_id: number; comment_text?: string }) => String(h.parent_id) === story.objectID && h.comment_text)
    .slice(0, 150)
    .map((h: { objectID: string; author: string; comment_text: string; created_at: string }) => {
      const first = htmlToText(h.comment_text).split("\n")[0];
      const company = first.includes("|") ? first.split("|")[0].trim().slice(0, 60) : "";
      return mk("Hacker News", h.objectID, first.slice(0, 120), company, h.author, h.created_at, h.comment_text);
    });
}

const remotive = () => many(["https://remotive.com/api/remote-jobs?limit=60"], (d) =>
  d.jobs.map((j: Record<string, string>) => mk("Remotive", j.id, j.title, j.company_name, "", j.publication_date, j.description, j.url)));

const arbeitnow = () => many(["https://www.arbeitnow.com/api/job-board-api"], (d) =>
  d.data.slice(0, 60).map((j: Record<string, any>) => mk("Arbeitnow", j.slug, j.title, j.company_name, "", j.created_at * 1000, j.description, j.url, j.location)));

// Finance / strategy / marketing / sales worldwide, plus India cities
const enc = encodeURIComponent;
const MUSE = "https://www.themuse.com/api/public/jobs?";
const museUrls = [
  ...["Accounting and Finance", "Business and Strategy", "Marketing", "Sales"].flatMap((c) => [0, 1].map((p) => `${MUSE}category=${enc(c)}&page=${p}`)),
  ...["Mumbai", "Bengaluru", "Gurugram", "Delhi"].map((c) => `${MUSE}category=${enc("Accounting and Finance")}&category=${enc("Business and Strategy")}&location=${enc(c + ", India")}&page=0`),
];
const muse = () => many(museUrls, (d) =>
  d.results.map((j: Record<string, any>) => mk("The Muse", j.id, j.name, j.company.name, "", j.publication_date, j.contents, j.refs.landing_page, j.locations.map((l: { name: string }) => l.name).join("; "))));

const jobicy = () => many(["accounting-finance", "business", "management", "marketing", "legal", "hr"].map((i) => `https://jobicy.com/api/v2/remote-jobs?count=30&industry=${i}`), (d) =>
  (d.jobs ?? []).map((j: Record<string, any>) => mk("Jobicy", j.id, j.jobTitle, j.companyName, "", j.pubDate, j.jobDescription, j.url, [j.jobGeo].flat().join("; "))));

// country=IN is a Himalayas server-side filter: India-eligible roles only
const himalayas = () => many(["finance", "investment banking", "consulting", "marketing", "analyst", "accounting"].map((q) => `https://himalayas.app/jobs/api/search?q=${enc(q)}&country=IN&sort=recent`), (d) =>
  d.jobs.map((j: Record<string, any>) => mk("Himalayas", j.guid, j.title, j.companyName, "", j.pubDate < 1e12 ? j.pubDate * 1000 : j.pubDate, j.description, j.applicationLink, (j.locationRestrictions ?? []).join("; "))));

// Company career boards with public JSON: India fintech/startups first
const greenhouse = () => many(["groww", "razorpaysoftwareprivatelimited", "slice"].map((b) => `https://boards-api.greenhouse.io/v1/boards/${b}/jobs?content=true`), (d) =>
  d.jobs.map((j: Record<string, any>) => mk("Greenhouse", j.id, j.title, j.company_name, "", j.first_published ?? j.updated_at, htmlToText(j.content ?? ""), j.absolute_url, j.location?.name)));

const lever = () => many(["cred", "meesho", "paytm"].map((c) => `https://api.lever.co/v0/postings/${c}?mode=json`), (d) =>
  d.map((j: Record<string, any>) => mk("Lever", j.id, j.text, new URL(j.hostedUrl).pathname.split("/")[1], "", j.createdAt, j.descriptionPlain, j.hostedUrl, j.categories?.location)));

// LinkedIn hiring posts, collected by the assistant every 6h into data/jobseeker-linkedin.json.
// Read from the local file so the scheduled collect workflow merges them into data/feed.json.
async function linkedinFile(): Promise<Opp[]> {
  try {
    const raw = JSON.parse(readFileSync(new URL("../data/jobseeker-linkedin.json", import.meta.url), "utf8"));
    if (!Array.isArray(raw)) return [];
    return raw.filter((o) => o && typeof o.id === "string" && o.source === "LinkedIn");
  } catch {
    return []; // file not present yet: never fail the whole feed
  }
}

export async function getFeed(): Promise<Opp[]> {
  const r = await Promise.allSettled([hn(), remotive(), arbeitnow(), muse(), jobicy(), himalayas(), greenhouse(), lever(), linkedinFile()]);
  return r.flatMap((x) => (x.status === "fulfilled" ? x.value : [])).sort((a, b) => b.date.localeCompare(a.date));
}

