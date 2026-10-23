"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { FIELDS, LIFE_H, SKILL_POOL, lifeInfo, matchScore, timeAgo, type Job } from "@/lib/site";
import SiteNav from "./SiteNav";
import Avatar from "./Avatar";
import { useSite } from "./SiteProvider";

const SWAP = ["FP&A", "banking", "research", "treasury", "credit", "trading"];
const PAGE = 24;
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const check = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M4 12.5l5 5L20 6.5" /></svg>;
const chev = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M6 9l6 6 6-6" /></svg>;
const mark = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12v18l-6-4.5L6 21z" /></svg>;

// Hero word that rotates; the box is resized to each word so the sentence never jumps.
function SwapWord() {
  const [i, setI] = useState(0);
  const [w, setW] = useState(0);
  const [show, setShow] = useState(true);
  const el = useRef<HTMLSpanElement>(null);
  const fit = (word: string) => {
    const e = el.current; if (!e) return;
    const cs = getComputedStyle(e), ctx = document.createElement("canvas").getContext("2d")!;
    ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    setW(Math.ceil(ctx.measureText(word).width) + 8);
  };
  const cur = useRef(SWAP[0]);
  useEffect(() => { cur.current = SWAP[i]; fit(SWAP[i]); }, [i]);
  // Measured in the real font: refit once Nunito has actually loaded, and when the window resizes.
  useEffect(() => {
    const refit = () => fit(cur.current);
    document.fonts?.load("900 60px Nunito").then(refit);
    addEventListener("resize", refit);
    return () => removeEventListener("resize", refit);
  }, []);
  useEffect(() => {
    if (reduced()) return;
    const t = setInterval(() => { setShow(false); setTimeout(() => { setI((x) => (x + 1) % SWAP.length); setShow(true); }, 190); }, 2500);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="swap-wrap" style={w ? { width: w } : undefined}>
      <span id="swapWord" ref={el} style={{ opacity: show ? 1 : 0, transform: show ? "translateY(0)" : "translateY(7px)" }}>{SWAP[i]}</span>
    </span>
  );
}

function Count({ to }: { to: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (reduced()) { setN(to); return; }
    let start = 0, raf = 0;
    const step = (ts: number) => { if (!start) start = ts; const p = Math.min((ts - start) / 1300, 1); setN(Math.round(to * (1 - Math.pow(1 - p, 3)))); if (p < 1) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <>{n}</>;
}

export default function Landing() {
  const { jobs, skills, toggleSkill, exp, setExp, saved, toggleSave, toast, apply } = useSite();
  const [field, setField] = useState("All");
  const [mode, setMode] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("new");
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [flash, setFlash] = useState("");
  const [shown, setShown] = useState(PAGE);
  const all = jobs ?? [];
  const score = (j: Job) => matchScore(j, skills, exp);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const l = all.filter((j) => {
      if (field !== "All" && j.field !== field) return false;
      if (mode === "remote" && !j.remote) return false;
      if (mode === "india" && !j.india) return false;
      if (mode === "form" && j.apply !== "form") return false;
      if (mode === "email" && j.apply !== "email") return false;
      return !q || `${j.title} ${j.company} ${j.field} ${j.sub} ${j.loc} ${j.skills.join(" ")}`.toLowerCase().includes(q);
    });
    if (sort === "new") l.sort((a, b) => a.postedH - b.postedH);
    if (sort === "az") l.sort((a, b) => a.company.localeCompare(b.company));
    if (sort === "match") l.sort((a, b) => (score(b) ?? 0) - (score(a) ?? 0) || a.postedH - b.postedH);
    return l;
  }, [all, field, mode, query, sort, skills, exp]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => setShown(PAGE), [field, mode, query, sort]);

  const ranked = useMemo(() => all.map((j) => ({ j, m: score(j) })).filter((r) => r.m !== null).sort((a, b) => b.m! - a.m!), [all, skills, exp]); // eslint-disable-line react-hooks/exhaustive-deps
  const count = (n: string) => (n === "All" ? all.length : all.filter((j) => j.field === n).length);
  const toggle = (id: string) => setOpen((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const goFeed = () => document.getElementById("feed")?.scrollIntoView({ behavior: reduced() ? "auto" : "smooth" });
  const lucky = () => {
    if (!list.length) { toast("No jobs match right now. Try removing a filter first."); return; }
    const p = list[Math.floor(Math.random() * list.length)];
    const idx = list.indexOf(p);
    if (idx >= shown) setShown(idx + 1);
    setOpen((s) => new Set(s).add(p.id)); setFlash(p.id); setTimeout(() => setFlash(""), 2200);
    setTimeout(() => document.querySelector(`[data-id="${CSS.escape(p.id)}"]`)?.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "center" }), 60);
    toast(`Here is one for you: ${p.title} at ${p.company}. It has ${lifeInfo(p.postedH).label}. Remember, every post is deleted after 3 days.`);
  };
  const ticker = all.slice(0, 10).map((j) => (
    <span className="tick-item" key={j.id}><span className="tag">{j.field.toUpperCase()}</span><b>{j.title}</b> · {j.loc} · {timeAgo(j.postedH)}</span>
  ));

  return (
    <>
      <SiteNav />
      <header id="top">
        <div className="hero-grid-bg" aria-hidden="true" />
        <div className="wrap">
          <div className="hero-cols">
            <div>
              <span className="hero-tag"><i />Finance jobs only · India · Every post is deleted after 3 days</span>
              <h1>Your next <SwapWord /> role was <span className="hl">posted, not listed.<svg viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true"><path d="M1 7 C 18 2, 34 9, 52 5 S 84 3, 99 6" fill="none" stroke="#e39a2d" strokeWidth="2.6" strokeLinecap="round" /></svg></span></h1>
              <p className="hero-sub">OpenToWork collects finance jobs posted by the people doing the hiring: <b>founders, CFOs and team heads</b>. From every post we pull out the three things you need: <b>where to apply</b>, <b>the email to write to</b>, and <b>exactly what they ask you to send</b>. And every post is <b>deleted after 3 days</b>, so you never waste time on an old job that is already filled.</p>
              <div className="hero-actions">
                <a className="btn btn-solid" href="#feed" onClick={(e) => { e.preventDefault(); goFeed(); }}>See the live jobs
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 4v16m0 0l-6-6m6 6l6-6" /></svg>
                </a>
                <Link className="btn btn-ghost" href="/dashboard">See your dashboard</Link>
              </div>
              <div className="hero-people">
                <div className="avatar-stack" aria-hidden="true">
                  {[["RS", "#0b7f66"], ["AK", "#b06a12"], ["MP", "#5b5bd6"], ["DV", "#a03d63"], ["+", "#17251c"]].map(([t, c]) => <span className="av" style={{ background: c }} key={t}>{t}</span>)}
                </div>
                <p>Posted by <b>real people</b>: founders, CFOs and team heads you can reply to directly.</p>
              </div>
            </div>
            <div className="hero-visual" aria-hidden="true">
              <svg className="hero-arrow" viewBox="0 0 74 64" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6 C 34 2, 58 14, 62 40" /><path d="M52 34 L62 44 L70 30" /></svg>
              <div className="postcard">
                <span className="tape" />
                <div className="pc-who">
                  <span className="av" style={{ background: "#0b7f66" }}>RS</span>
                  <div><b>Rohan · CFO</b><span>Series A fintech · Bengaluru</span></div>
                  <span className="pc-when">9:12 AM</span>
                </div>
                <p className="pc-body">"Hiring our first FP&amp;A analyst. Here's the P&amp;L, here's the monthly report I need ready every month: <em>reply with one forecast you built</em> and what it changed. I read every reply myself."</p>
                <div className="pc-ask"><span>WHAT TO SEND · 1 forecast you built</span><span className="alt">APPLY BY · EMAIL</span><span className="alt">POSTED BY ROHAN HIMSELF</span></div>
              </div>
              <div className="replycard">
                <span className="rc-tag">WHAT HAPPENS NEXT</span>
                <p>You reply at 11:53 AM. By Thursday you're <b>on a call with Rohan</b>, not refreshing a status page that says "viewed".</p>
              </div>
            </div>
          </div>
          <div className="stats">
            <div className="stat"><div className="num"><Count to={all.length} /></div><div className="lbl">Jobs live right now</div></div>
            <div className="stat"><div className="num"><Count to={FIELDS.length} /></div><div className="lbl">Types of finance jobs, nothing else</div></div>
            <div className="stat"><div className="num"><Count to={LIFE_H / 24} /><em> days</em></div><div className="lbl">A post stays up, then it is deleted</div></div>
            <div className="stat"><div className="num">0</div><div className="lbl">Old, already-filled jobs shown, ever</div></div>
          </div>
        </div>
      </header>

      <div className="ticker" aria-hidden="true"><div className="ticker-track">{ticker}{ticker}</div></div>

      <main>
        <section id="feed">
          <div className="wrap">
            <div className="sec-head">
              <span className="sec-tag">Fresh jobs</span>
              <h2>New finance jobs, made simple</h2>
              <p>Every post below is a real finance job, cleaned up for you: who posted it, where to apply, and what they ask you to send. Tap a type of finance job above the list to see only those jobs. That is all there is to learn.</p>
            </div>
            <div className="fresh-note">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></svg>
              <p><b>Why is everything here so new?</b> Every post on OpenToWork is deleted after 3 days. So this list only ever shows new hiring, never an old post for a job that is already filled. The bar on each card shows how much time that post has left.</p>
            </div>
            <div className="toolbar">
              <div className="tool-row">
                <label className="search">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
                  <input type="search" placeholder="Search roles, companies, skills…" autoComplete="off" value={query} onChange={(e) => setQuery(e.target.value)} />
                </label>
                <select className="sort" aria-label="Sort the jobs" value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option value="new">Newest first</option>
                  <option value="match">Best fit for me</option>
                  <option value="az">Company A–Z</option>
                </select>
                <button className="lucky-btn" type="button" onClick={lucky}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="4" /><circle cx="8.5" cy="8.5" r="1.4" fill="currentColor" stroke="none" /><circle cx="15.5" cy="15.5" r="1.4" fill="currentColor" stroke="none" /><circle cx="15.5" cy="8.5" r="1.4" fill="currentColor" stroke="none" /><circle cx="8.5" cy="15.5" r="1.4" fill="currentColor" stroke="none" /></svg>
                  Pick one for me
                </button>
              </div>
              <div className="tool-row" role="group" aria-label="Filter by field">
                {["All", ...FIELDS.map((f) => f.name)].map((n) => <button key={n} className={`chip${field === n ? " on" : ""}`} onClick={() => setField(n)}>{n}<span className="n">{count(n)}</span></button>)}
              </div>
              <div className="tool-row" role="group" aria-label="Filter by work mode">
                {[["all", "All locations"], ["remote", "Remote"], ["india", "India"], ["form", "Apply by form"], ["email", "Apply by email"]].map(([k, l]) => <button key={k} className={`chip${mode === k ? " on" : ""}`} onClick={() => setMode(k)}>{l}</button>)}
              </div>
            </div>
            <div className="feed-meta">
              <span className="count">{jobs ? <>SHOWING <b>{list.length}</b> OF {all.length} LIVE POSTS · {field === "All" ? "ALL AREAS OF FINANCE" : field.toUpperCase()}</> : "LOADING THE LIVE POSTS…"}</span>
              <span className="feed-note">Live posts, refreshed through the day. Your own list lives in your dashboard</span>
            </div>
            <div className="grid">
              {list.slice(0, shown).map((j, idx) => {
                const m = score(j), life = lifeInfo(j.postedH), isSaved = saved.has(j.id), isOpen = open.has(j.id);
                const orig = j.o.leads.find((l) => l.kind !== "email");
                return (
                  <article key={j.id} data-id={j.id} className={`card${j.postedH <= 12 ? " fresh" : ""}${isOpen ? " open" : ""}${flash === j.id ? " flash" : ""}`} style={{ animationDelay: `${Math.min(idx, 12) * 45}ms` }}>
                    <div className="card-top">
                      <Avatar name={j.company} />
                      <div><h3>{j.title}</h3><div className="co">{j.company}</div></div>
                      {m === null
                        ? <div className="match"><div className="pct" style={{ color: "var(--ink-3)" }}>-</div><div className="cap">Pick skills<br />to see your fit</div></div>
                        : <div className="match"><div className="pct">{m}%</div><div className="cap">Your fit</div></div>}
                    </div>
                    <div className="tags">
                      <span className="tag field">{j.field}{j.sub !== j.field && ` · ${j.sub}`}</span>
                      <span className="tag">{j.remote ? "Remote" : j.loc}</span><span className="tag">{j.type}</span>
                      <span className="tag">{j.apply === "form" ? "Apply: form" : "Apply: email"}</span>
                    </div>
                    <p className="excerpt">{j.excerpt}</p>
                    <div className={`life${life.cls}`}><div className="life-bar"><i style={{ width: `${life.pct}%` }} /></div><span>{life.note}</span></div>
                    <div className="card-foot">
                      <span className="src">{j.source.toUpperCase()} · {timeAgo(j.postedH).toUpperCase()}</span>
                      <button className={`save-btn${isSaved ? " saved" : ""}`} aria-pressed={isSaved} onClick={() => toggleSave(j)}>{mark}<span>{isSaved ? "Saved" : "Save"}</span></button>
                      <button className="expand-btn" style={{ marginLeft: 0 }} aria-expanded={isOpen} onClick={() => toggle(j.id)}>{isOpen ? "Hide " : "What they ask "}{chev}</button>
                    </div>
                    <div className="detail">
                      <div><h4>What the post asks you to do</h4><ul>{j.asks.map((a) => <li key={a}>{check}<span>{a}</span></li>)}</ul></div>
                      {j.skills.length > 0 && <div><h4>Skills named in the post</h4><div className="skills-line">{j.skills.map((s) => <span key={s} className={`sk${skills.has(s) ? " hit" : ""}`}>{s}</span>)}</div></div>}
                      <div className="apply-row">
                        <button className="apply-btn" onClick={() => apply(j)}>{j.apply === "form" ? "Open the application form" : "Get the email to apply"}</button>
                        {orig && <a className="apply-btn alt" href={orig.value} target="_blank" rel="noopener noreferrer">See the original post</a>}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
            {jobs && list.length === 0 && <div className="empty show"><b>Nothing here right now</b>No jobs match that. Try removing a filter, or search for something else.</div>}
            {list.length > shown && <div className="more-row"><button className="chip" onClick={() => setShown(shown + PAGE)}>Show more jobs</button></div>}
          </div>
        </section>

        <section id="fields" style={{ background: "var(--bg-2)", borderBlock: "1px solid var(--line)" }}>
          <div className="wrap">
            <div className="sec-head">
              <span className="sec-tag">Types of finance jobs</span>
              <h2>Only finance jobs: pick your area</h2>
              <p>No engineering jobs. No marketing jobs. Just finance. Tap an area and the list above will show only those jobs.</p>
            </div>
            <div className="fields">
              {FIELDS.map((f) => (
                <button className="field-card" key={f.name} onClick={() => { setField(f.name); goFeed(); }}>
                  <span className="ic" dangerouslySetInnerHTML={{ __html: f.icon }} />
                  <h3>{f.name}</h3><p>{f.subs}</p>
                  <span className="fc-foot"><span className="fc-count"><b>{count(f.name)}</b> live posts</span><span className="go">See these jobs →</span></span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section id="scanner">
          <div className="wrap">
            <div className="sec-head">
              <span className="sec-tag">Check your fit</span>
              <h2>How well do you fit?</h2>
              <p>Tap the skills you have and set your years of experience. We then score every job against you, here and on each job card, so you see your best matches first.</p>
            </div>
            <div className="scanner">
              <div className="scan-left">
                <h3>Tap the skills you have</h3>
                <p>This also powers your dashboard. Set it once, and your own page puts your best matches first.</p>
                <div className="skill-pool">{SKILL_POOL.map((s) => <button key={s} className="chip" aria-pressed={skills.has(s)} onClick={() => toggleSkill(s)}>{s}</button>)}</div>
                <div className="scan-ctl">
                  <label htmlFor="expRange">Experience</label>
                  <input type="range" id="expRange" min={0} max={12} value={exp} step={1} onChange={(e) => setExp(+e.target.value)} />
                  <span className="exp-val">{exp}{exp >= 12 ? "+ yrs" : " yrs"}</span>
                </div>
              </div>
              <div className="scan-right">
                <h4>Your best matches right now</h4>
                {skills.size === 0
                  ? <div className="scan-empty">No skills picked yet. Tap at least one skill on the left, and we will rank every job here by how well it fits you.</div>
                  : ranked.slice(0, 4).map((r) => (
                    <div className="match-row" key={r.j.id}><div className="mr-top"><span>{r.j.title} · {r.j.field}</span><span>{r.m}%</span></div><div className="bar"><i style={{ width: `${r.m}%` }} /></div></div>
                  ))}
              </div>
            </div>
          </div>
        </section>

        <section id="how" style={{ background: "var(--bg-2)", borderBlock: "1px solid var(--line)" }}>
          <div className="wrap">
            <div className="sec-head">
              <span className="sec-tag">How it works</span>
              <h2>Three taps, and you are talking to the person hiring</h2>
              <p>This is how people really look for jobs: decide fast, understand the post in seconds, and apply while it is still new. We do the searching and the cleaning-up in the background. You just tap.</p>
            </div>
            <div className="steps">
              <div className="step"><span className="pin">1</span><h3>Pick your area of finance</h3><p>FP&amp;A, banking, research, treasury and more. One tap, and everything (the job list, the fit checker and your dashboard) shows only that area. You can look at every job without signing up.</p><div className="extract"><span>1 TAP</span><span>NO SIGN-UP NEEDED TO LOOK</span></div></div>
              <div className="step"><span className="pin">2</span><h3>Read what they ask for</h3><p>Every post is cleaned up into the three things you need, so one quick look (about ten seconds) tells you if the job is worth your evening.</p><div className="extract"><span>WHERE TO APPLY</span><span>THE EMAIL</span><span>WHAT TO SEND</span></div></div>
              <div className="step"><span className="pin">3</span><h3>Apply directly, then track it here</h3><p>You go straight to the founder's form or the CFO's email while the post is new. Your dashboard then follows that job step by step: Applied, Replied, Interview, Offer. So it never goes silent on you.</p><div className="extract"><span>APPLIED</span><span>REPLIED</span><span>INTERVIEW</span><span>OFFER</span></div></div>
            </div>
            <div className="cta" style={{ marginTop: 54 }}>
              <h2>Your dashboard is already <em>set up for you.</em></h2>
              <p>Your areas of finance, your newest posts, and every job you are tracking, all on one page, the moment you open it.</p>
              <div className="cta-row">
                <Link className="btn btn-solid" href="/dashboard">Open your dashboard</Link>
                <a className="btn btn-ghost" href="#feed" onClick={(e) => { e.preventDefault(); goFeed(); }}>See the live jobs ↓</a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap foot">
          <Link className="brand" href="/" aria-label="OpenToWork, back to the top"><img src="/logo.png" alt="OpenToWork" /></Link>
          <p>OpenToWork (<a href="https://opentowork.work/">opentowork.work</a>): finance jobs only, posted by founders, CFOs and hiring teams. For every post we pull out where to apply, the email, and what they ask you to send. And every post is deleted after 3 days, so the list is always new.</p>
        </div>
      </footer>
    </>
  );
}
