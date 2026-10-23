"use client";
import { useEffect, useMemo, useState } from "react";
import { FIELDS, STAGES, STAGE_KEYS, initials, lifeInfo, matchScore, timeAgo, type Job } from "@/lib/site";
import SiteNav from "../SiteNav";
import Avatar from "../Avatar";
import { useSite } from "../SiteProvider";
import Link from "next/link";

const FEED = 6;
const ist = () => { try { return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })); } catch { return new Date(); } };
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const dateLine = (d: Date) => `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
const day = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
const put = (body: object) => fetch("/api/apply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.ok);

type Row = { key: string; title: string; company: string; stage: number; when: string; to: string; postId: string };

export default function Dashboard() {
  const { jobs, me, saved, skills, exp, areas, toggleArea, toast, confetti, apply, refreshMe } = useSite();
  const [shown, setShown] = useState(FEED);
  const [hour, setHour] = useState(ist());
  useEffect(() => setHour(ist()), []);
  const all = jobs ?? [];
  const byId = useMemo(() => new Map(all.map((j) => [j.id, j])), [all]);
  const score = (j: Job) => matchScore(j, skills, exp);

  const mine = useMemo(() => all.filter((j) => areas.size === 0 || areas.has(j.field)), [all, areas]);
  const ranked = useMemo(() => all.map((j) => ({ j, m: score(j) })).filter((r) => r.m !== null).sort((a, b) => b.m! - a.m!), [all, skills, exp]); // eslint-disable-line react-hooks/exhaustive-deps
  const top = useMemo(() => mine.map((j) => ({ j, m: score(j) ?? 0 })).sort((a, b) => b.m - a.m).slice(0, 3), [mine, skills, exp]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => setShown(FEED), [areas]);

  // Tracker: every job logged as an application, plus saved posts that are still live and not yet applied to.
  const rows: Row[] = useMemo(() => {
    const apps = me.apps ?? [];
    const fromApps = apps.map((a): Row => {
      const stage = Math.max(0, STAGE_KEYS.indexOf(a.status as (typeof STAGE_KEYS)[number]));
      const when = a.status === "opened" ? "Email opened, not confirmed yet. Move it forward once you have sent it." : `${a.status === "applied" ? "Applied" : "Updated"} ${day(a.at)}`;
      return { key: a.postId, postId: a.postId, title: a.title, company: a.company || "Company not stated", stage, when, to: a.to };
    });
    const inApps = new Set(apps.map((a) => a.postId));
    const fromSaved = [...saved].filter((id) => !inApps.has(id) && byId.has(id)).map((id): Row => {
      const j = byId.get(id)!;
      return { key: id, postId: id, title: j.title, company: j.company, stage: 0, when: `Saved · posted ${timeAgo(j.postedH)}, ${lifeInfo(j.postedH).label} before it is deleted`, to: j.o.apply_email ?? "" };
    });
    return [...fromApps, ...fromSaved].sort((a, b) => b.stage - a.stage);
  }, [me.apps, saved, byId]);

  async function move(r: Row) {
    if (!me.email) { toast("Sign in to track your applications."); return; }
    const status = STAGE_KEYS[r.stage + 1];
    const j = byId.get(r.postId);
    if (!(await put({ postId: r.postId, title: r.title, company: r.company === "Company not stated" ? "" : r.company, to: r.to, subject: "", body: "", cv: "tailored", status }))) { toast("Could not update that job. Try again."); return; }
    await refreshMe();
    if (status === "offer") { confetti(); toast(`Offer stage for “${r.title}”: congratulations! This is the moment the whole page is built for.`); }
    else if (j) toast(`Moved “${r.title}” to ${STAGES[r.stage + 1]}.`);
  }

  const fresh = mine.filter((j) => j.postedH <= 24).length;
  const best = ranked[0];
  const names = [...areas];
  const pretty = names.length === 1 ? names[0] : names.slice(0, -1).join(", ") + " and " + names.at(-1);
  const h = hour.getHours();
  const name = me.profile?.full_name?.trim();
  const feed = mine.slice(0, shown);

  return (
    <>
      <SiteNav dash />
      <main className="wrap dashwrap">
        <div className="dash-hero">
          <div>
            <h2 className="greet">{h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"}, here's <em>your page.</em></h2>
            <p className="sub">{dateLine(hour)} · {names.length ? <>showing the jobs in <b>{pretty}</b>. Newest posts first; the jobs you are tracking are on the right.</> : "no areas picked yet, showing all finance jobs. Tap an area below to make this page yours."}</p>
          </div>
          <div className="dash-id">
            <span className="av" aria-hidden="true">{name ? initials(name) : "YOU"}</span>
            <div><b>{name || "Finance candidate"}</b><span>{exp} yrs · {skills.size ? `${skills.size} skill${skills.size > 1 ? "s" : ""} picked` : "no skills picked yet"}{names.length ? ` · ${names.length} areas` : ""}</span></div>
          </div>
        </div>

        <div className="kpis">
          <div className="kpi"><div className="k-num">{fresh}</div><div className="k-lbl">New in your areas</div><div className="k-sub">Posted in the last 24 hours. Remember, every post is deleted after 3 days</div></div>
          <div className="kpi"><div className="k-num">{best ? <>{best.m}<em>%</em></> : "-"}</div><div className="k-lbl">Your best match right now</div><div className="k-sub">{best ? `${best.j.title} · ${best.j.field}` : "Pick your skills in the fit checker to score jobs"}</div></div>
          <div className="kpi"><div className="k-num">{rows.filter((r) => r.stage >= 1).length}</div><div className="k-lbl">Jobs you have applied to</div><div className="k-sub">Followed below, step by step</div></div>
          <div className="kpi"><div className="k-num">{rows.filter((r) => r.stage >= 3).length}</div><div className="k-lbl">Interviews lined up</div><div className="k-sub">Jobs where you reached the interview step</div></div>
        </div>

        <div className="dash-layout">
          <section className="dash-card" aria-label="Your personal feed">
            <div className="dc-head">
              <div>
                <h3>Jobs in your areas</h3>
                <p className="dc-sub">Tap an area to change what shows up here. Only finance jobs: no marketing, no engineering, nothing else. Every post is deleted after 3 days, so this list is always new.</p>
              </div>
              <span className="mono">ONLY YOU CAN SEE THIS PAGE</span>
            </div>
            <div className="skill-pool">{FIELDS.map((f) => <button key={f.name} className="chip" aria-pressed={areas.has(f.name)} onClick={() => toggleArea(f.name)}>{f.name}</button>)}</div>
            <div className="dash-count">{!jobs ? "LOADING YOUR LIST…" : names.length === 0 ? "NO AREAS PICKED, SHOWING ALL FINANCE JOBS" : <>YOUR LIST · <b>{feed.length}</b> NEWEST OF {mine.length} LIVE POSTS IN YOUR AREAS</>}</div>
            <div>
              {feed.map((j) => {
                const m = score(j);
                return (
                  <div className="mini-row" key={j.id}>
                    <Avatar name={j.company} cls="av" />
                    <div className="mr-main"><b>{j.title}</b><span className="mr-sub">{j.company} · {j.remote ? "Remote" : j.loc} · {timeAgo(j.postedH)} · {lifeInfo(j.postedH).label} · {j.source}</span></div>
                    <div className="mr-match">{m !== null ? <div className="pct">{m}%</div> : j.postedH <= 12 ? <span className="newtag">NEW</span> : null}</div>
                    <a className="apply" href="#apply" onClick={(e) => { e.preventDefault(); apply(j); }}>Apply</a>
                  </div>
                );
              })}
            </div>
            {mine.length > shown && <div className="more-row"><button className="chip" onClick={() => setShown(shown + FEED)}>Show more jobs</button></div>}
          </section>

          <div>
            <section className="dash-card" aria-label="Application tracker">
              <div className="dc-head">
                <div>
                  <h3>Jobs you are tracking</h3>
                  <p className="dc-sub">Every job you apply to lands here. One click moves it to the next step. No spreadsheet to maintain, and nothing to keep re-checking on other sites.</p>
                </div>
              </div>
              <div>
                {rows.length === 0 && <p className="track-empty">Nothing here yet. Save a job or press Apply and it shows up here.{!me.email && <> <Link href="/login">Sign in</Link> to keep your list on every device.</>}</p>}
                {rows.map((r) => (
                  <div className="track-row" key={r.key}>
                    <div className="tr-top"><b>{r.title}</b><span className="co">{r.company}</span><span className={`stage-pill s${r.stage}`}>{STAGES[r.stage].toUpperCase()}</span></div>
                    <div className="tr-meta">
                      <span className="dots" aria-hidden="true">{STAGES.map((s, k) => <i key={s} className={k <= r.stage ? "on" : ""} />)}</span>
                      <span className="tr-when">{r.when}</span>
                      {r.stage < STAGES.length - 1 ? <button className="adv-btn" onClick={() => move(r)}>Move to {STAGES[r.stage + 1]} →</button> : <button className="adv-btn" disabled>Offer in hand</button>}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="dash-card" aria-label="Top matches">
              <div className="dc-head">
                <div>
                  <h3>Worth your evening</h3>
                  <p className="dc-sub">Your best matches in your areas right now, based on the skills you picked.</p>
                </div>
              </div>
              <div>
                {skills.size === 0 ? (
                  <>
                    {mine.slice(0, 3).map((j) => <div className="mini-row" key={j.id}><Avatar name={j.company} cls="av" /><div className="mr-main"><b>{j.title}</b><span className="mr-sub">{j.company} · newest in your areas</span></div></div>)}
                    <p className="feed-note" style={{ marginTop: 12 }}>Pick your skills in the <Link href="/#scanner" style={{ color: "var(--accent-deep)", fontWeight: 800 }}>fit checker</Link> on the home page, and these will be ranked by how well they fit you, not just by newest first.</p>
                  </>
                ) : top.map((r) => <div className="match-row" key={r.j.id}><div className="mr-top"><span>{r.j.title} · {r.j.field}</span><span>{r.m}%</span></div><div className="bar"><i style={{ width: `${r.m}%` }} /></div></div>)}
              </div>
            </section>
          </div>
        </div>

        <p className="feed-note dash-foot-note">Your areas, skills and saved jobs are remembered on this device{me.email ? " and in your account" : ", and in your account once you sign in"}. Every post here is live and deleted after 3 days.</p>
      </main>
    </>
  );
}
