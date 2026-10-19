"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Opp } from "@/lib/ingest";
import { loadProfile } from "@/lib/profile-client";
import { match } from "@/lib/resume";
import { labelOf } from "@/lib/filter";

// Home-page "For you": jobs from our own feed that match the keywords scanned from the user's resume.
export default function ForYou() {
  const [kws, setKws] = useState<string[] | null>(null);
  const [feed, setFeed] = useState<Opp[]>([]);

  useEffect(() => {
    loadProfile().then((p) => setKws(p.keywords));
    fetch("/api/feed").then((r) => r.json()).then(setFeed).catch(() => {});
  }, []);

  if (kws === null) return null;
  if (!kws.length) {
    return (
      <section>
        <h2>For you</h2>
        <div className="card">
          <b>Get jobs matched to your resume</b>
          <p className="mut">Upload your resume and we scan it for keywords, then show the jobs on Jobseeker that match. Your resume is read in your browser and never uploaded.</p>
          <Link href="/profile" className="btn">Upload resume</Link>
        </div>
      </section>
    );
  }

  const all = feed.map((o) => ({ o, m: match(o, kws) })).filter((x) => x.m.score > 0).sort((a, b) => b.m.score - a.m.score || b.o.date.localeCompare(a.o.date));
  return (
    <section>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h2>For you</h2>
        <span className="row"><Link href="/profile" className="plain small">Edit keywords</Link>{all.length > 6 && <Link href="/dashboard?foryou=1" className="btn alt">See all {all.length}</Link>}</span>
      </div>
      {all.length === 0 ? <div className="card"><p className="mut">No jobs match your keywords right now. New posts arrive regularly, or <Link href="/profile">edit your keywords</Link>.</p></div> : (
        <div className="tiles" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))" }}>
          {all.slice(0, 6).map(({ o, m }) => {
            const lead = o.leads.find((l) => l.kind !== "link") ?? o.leads[0];
            return (
              <article className="card" key={o.id}>
                <span className="tag">Match {m.pct}%</span>
                <h3 style={{ margin: "8px 0 2px" }}>{o.title.slice(0, 80)}</h3>
                <div className="mut small">{o.company}{o.loc && ` · ${o.loc.slice(0, 30)}`}</div>
                <div className="mut small" style={{ margin: "8px 0" }}>Matched: {m.hits.slice(0, 4).join(" · ")}</div>
                {lead && <a className="btn" href={lead.kind === "email" ? `mailto:${lead.value}` : lead.value} target="_blank" rel="noopener noreferrer">{labelOf(lead)}</a>}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
