import { extract, type Extracted } from "./extract.ts";

export type Opp = Extracted & { id: string; source: string; title: string; poster: string; date: string; text: string };

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

function mk(source: string, id: string | number, title: string, company: string, poster: string, date: string, html: string, applyUrl = ""): Opp {
  const text = htmlToText(html);
  const e = extract(`${title}\n${text}`);
  if (applyUrl) e.leads.unshift({ kind: "jobpage", value: applyUrl, domain: applyUrl.split("/")[2] ?? "" });
  return { ...e, company: company || e.company, instruction: e.instruction || (applyUrl ? "Apply on the job page." : ""), id: `${source}-${id}`, source, title, poster, date, text: text.slice(0, 600) };
}

const getJson = async (url: string) => {
  const r = await fetch(url, { next: { revalidate: 21600 } }); // 6h: stays under Remotive's rate limit
  if (!r.ok) throw new Error(`${url} ${r.status}`);
  return r.json();
};

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

async function remotive(): Promise<Opp[]> {
  const d = await getJson("https://remotive.com/api/remote-jobs?limit=60");
  return d.jobs.map((j: Record<string, string>) => mk("Remotive", j.id, j.title, j.company_name, "", j.publication_date, j.description, j.url));
}

async function arbeitnow(): Promise<Opp[]> {
  const d = await getJson("https://www.arbeitnow.com/api/job-board-api");
  return d.data.slice(0, 60).map((j: Record<string, string | number>) => mk("Arbeitnow", j.slug as string, j.title as string, j.company_name as string, "", new Date((j.created_at as number) * 1000).toISOString(), j.description as string, j.url as string));
}

export async function getFeed(): Promise<Opp[]> {
  const r = await Promise.allSettled([hn(), remotive(), arbeitnow()]);
  return r.flatMap((x) => (x.status === "fulfilled" ? x.value : [])).sort((a, b) => b.date.localeCompare(a.date));
}
