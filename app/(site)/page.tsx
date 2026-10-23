"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FIELDS, LIFE_H, SKILL_POOL } from "@/lib/site";
import SiteNav from "./SiteNav";
import { useSite } from "./SiteProvider";

const SWAP = ["FP&A", "banking", "research", "treasury", "credit", "trading"];
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

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

// Cards slide up and fade in one by one as they scroll into view. --d staggers siblings.
function useReveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(".rv"));
    if (reduced() || !("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("in")); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.18, rootMargin: "0px 0px -6% 0px" });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);
}

// Thin progress bar along the top edge that fills as the page is read.
function Progress() {
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const on = () => { const h = document.documentElement; if (bar.current) bar.current.style.transform = `scaleX(${scrollY / Math.max(1, h.scrollHeight - innerHeight)})`; };
    on(); addEventListener("scroll", on, { passive: true });
    return () => removeEventListener("scroll", on);
  }, []);
  return <div className="progress" ref={bar} aria-hidden="true" />;
}

export default function Landing() {
  const { jobs, skills, toggleSkill, exp, setExp, pickArea } = useSite();
  const router = useRouter();
  const all = jobs ?? [];
  const count = (n: string) => all.filter((j) => j.field === n).length;
  useReveal();
  const openArea = (n: string) => { pickArea(n); router.push("/dashboard"); };

  return (
    <>
      <SiteNav />
      <Progress />
      <header id="top">
        <div className="hero-grid-bg" aria-hidden="true" />
        <div className="wrap">
          <div className="hero-cols">
            <div>
              <span className="hero-tag"><i />Finance jobs only · India · Every post is deleted after 3 days</span>
              <h1>Your next <SwapWord /> role was <span className="hl">posted, not listed.<svg viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true"><path d="M1 7 C 18 2, 34 9, 52 5 S 84 3, 99 6" fill="none" stroke="#e39a2d" strokeWidth="2.6" strokeLinecap="round" /></svg></span></h1>
              <p className="hero-sub">OpenToWork collects finance jobs posted by the people doing the hiring: <b>founders, CFOs and team heads</b>. From every post we pull out the three things you need: <b>where to apply</b>, <b>the email to write to</b>, and <b>exactly what they ask you to send</b>. And every post is <b>deleted after 3 days</b>, so you never waste time on an old job that is already filled.</p>
              <div className="hero-actions">
                <Link className="btn btn-solid" href="/dashboard">See the live jobs
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 4v16m0 0l-6-6m6 6l6-6" /></svg>
                </Link>
                <a className="btn btn-ghost" href="#how" onClick={(e) => { e.preventDefault(); document.getElementById("how")?.scrollIntoView({ behavior: reduced() ? "auto" : "smooth" }); }}>See how it works</a>
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
          <div className="stats rv">
            <div className="stat"><div className="num"><Count to={all.length} /></div><div className="lbl">Jobs live right now</div></div>
            <div className="stat"><div className="num"><Count to={FIELDS.length} /></div><div className="lbl">Types of finance jobs, nothing else</div></div>
            <div className="stat"><div className="num"><Count to={LIFE_H / 24} /><em> days</em></div><div className="lbl">A post stays up, then it is deleted</div></div>
            <div className="stat"><div className="num">0</div><div className="lbl">Old, already-filled jobs shown, ever</div></div>
          </div>
        </div>
      </header>

      <main>
        <section id="fields" style={{ background: "var(--bg-2)", borderBlock: "1px solid var(--line)" }}>
          <div className="wrap">
            <div className="sec-head rv">
              <span className="sec-tag">Types of finance jobs</span>
              <h2>Only finance jobs: pick your area</h2>
              <p>No engineering jobs. No marketing jobs. Just finance. Tap an area and your dashboard opens with only those jobs.</p>
            </div>
            <div className="fields">
              {FIELDS.map((f) => (
                <button className="field-card rv" style={{ "--d": `${(FIELDS.indexOf(f) % 3) * 90}ms` } as React.CSSProperties} key={f.name} onClick={() => openArea(f.name)}>
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
            <div className="sec-head rv">
              <span className="sec-tag">Check your fit</span>
              <h2>How well do you fit?</h2>
              <p>Tap the skills you have and set your years of experience. We then score every job against you, so you see your best matches first.</p>
            </div>
            <div className="scanner rv">
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
                  ? <div className="scan-empty">No skills picked yet. Tap at least one skill on the left, and we will rank every job by how well it fits you.</div>
                  : <div className="scan-empty">Got it: <b>{skills.size} skill{skills.size > 1 ? "s" : ""}</b> and <b>{exp} yrs</b> of experience. Your best matches are waiting inside your dashboard.</div>}
                <Link className="btn btn-solid" href="/dashboard" style={{ alignSelf: "flex-start" }}>See my matches</Link>
              </div>
            </div>
          </div>
        </section>

        <section id="how" style={{ background: "var(--bg-2)", borderBlock: "1px solid var(--line)" }}>
          <div className="wrap">
            <div className="sec-head rv">
              <span className="sec-tag">How it works</span>
              <h2>Three taps, and you are talking to the person hiring</h2>
              <p>This is how people really look for jobs: decide fast, understand the post in seconds, and apply while it is still new. We do the searching and the cleaning-up in the background. You just tap.</p>
            </div>
            <div className="steps">
              <div className="step rv" style={{ "--d": "0ms" } as React.CSSProperties}><span className="pin">1</span><h3>Pick your area of finance</h3><p>FP&amp;A, banking, research, treasury and more. One tap, and everything (the job list, the fit checker and your dashboard) shows only that area. You can look at every job without signing up.</p><div className="extract"><span>1 TAP</span><span>NO SIGN-UP NEEDED TO LOOK</span></div></div>
              <div className="step rv" style={{ "--d": "120ms" } as React.CSSProperties}><span className="pin">2</span><h3>Read what they ask for</h3><p>Every post is cleaned up into the three things you need, so one quick look (about ten seconds) tells you if the job is worth your evening.</p><div className="extract"><span>WHERE TO APPLY</span><span>THE EMAIL</span><span>WHAT TO SEND</span></div></div>
              <div className="step rv" style={{ "--d": "240ms" } as React.CSSProperties}><span className="pin">3</span><h3>Apply directly, then track it here</h3><p>You go straight to the founder's form or the CFO's email while the post is new. Your dashboard then follows that job step by step: Applied, Replied, Interview, Offer. So it never goes silent on you.</p><div className="extract"><span>APPLIED</span><span>REPLIED</span><span>INTERVIEW</span><span>OFFER</span></div></div>
            </div>
            <div className="cta rv" style={{ marginTop: 54 }}>
              <h2>Your dashboard is already <em>set up for you.</em></h2>
              <p>Your areas of finance, your newest posts, and every job you are tracking, all on one page, the moment you open it.</p>
              <div className="cta-row">
                <Link className="btn btn-solid" href="/dashboard">Open your dashboard</Link>
                <a className="btn btn-ghost" href="#top" onClick={(e) => { e.preventDefault(); scrollTo({ top: 0, behavior: reduced() ? "auto" : "smooth" }); }}>Back to the top ↑</a>
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
