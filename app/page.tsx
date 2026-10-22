"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { TAXONOMY } from "@/lib/taxonomy";
import type { Opp } from "@/lib/ingest";

// Derive top-level field from TAXONOMY by checking if any sub-area keyword appears in title+text
const FIELD_KEYS = Object.keys(TAXONOMY);
function fieldOf(o: Opp): string {
  const hay = `${o.title} ${o.text}`.toLowerCase();
  return FIELD_KEYS.find((cat) =>
    TAXONOMY[cat].some((sub) => sub.toLowerCase().split(" ").filter((w) => w.length > 3).some((w) => hay.includes(w)))
  ) ?? "";
}
function hoursAgo(iso: string) {
  if (!iso) return 999;
  return Math.round((Date.now() - new Date(iso).getTime()) / 3_600_000);
}

const FIELDS = [
  {
    name: "Finance",
    subs: "FP&A · Investment Banking · Asset Management",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M4 20V10m6 10V4m6 16v-7m4 7H2" transform="translate(1 0)" />
      </svg>
    )
  },
  {
    name: "Business",
    subs: "Business Development · Strategy · Operations",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18" />
      </svg>
    )
  },
  {
    name: "Marketing",
    subs: "Brand Marketing · Performance / Growth · Content & Copy",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M3 11l14-5v12L3 13v-2z" />
        <path d="M7 13v5a2 2 0 0 0 4 0v-4M17 8a4 4 0 0 1 0 8" />
      </svg>
    )
  },
  {
    name: "Consulting",
    subs: "Strategy Consulting · Management Consulting · Technology Consulting",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M15.5 8.5l-2 5-5 2 2-5 5-2z" />
      </svg>
    )
  },
  {
    name: "Sales",
    subs: "Enterprise Sales · SDR / BDR · Inside Sales",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M4 19V5m0 14h16M8 15l4-5 3 3 5-7" />
      </svg>
    )
  },
  {
    name: "Consumer & Retail",
    subs: "FMCG · E-commerce · Retail Operations",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M4 7h16l-1.5 12h-13L4 7z" />
        <path d="M8 10V6a4 4 0 0 1 8 0v4" />
      </svg>
    )
  }
];

const SKILL_POOL = [
  "Financial Modelling", "Excel", "SQL", "Data Analysis", "PowerPoint",
  "Negotiation", "CRM", "Communication", "Analytics", "Performance Marketing",
  "Brand Strategy", "Copywriting", "Problem Structuring", "Stakeholder Management",
  "P&L Management", "Partnerships"
];

const WORDS = ["hiring", "recruiting", "building", "staffing"];

export default function LandingPage() {
  const [feed, setFeed] = useState<Opp[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [mode, setMode] = useState<"all" | "remote" | "india" | "form" | "email">("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"new" | "match" | "az">("new");
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set());
  const [exp, setExp] = useState(3);
  const [openCards, setOpenCards] = useState<Set<string>>(new Set());

  const [clock, setClock] = useState("--:-- IST");
  const [wordIdx, setWordIdx] = useState(0);
  const [wordOpacity, setWordOpacity] = useState(1);
  const [applicantNum, setApplicantNum] = useState(0);
  const [counters, setCounters] = useState({ opps: 0, fields: 0, days: 0, signals: 0 });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const applicantRef = useRef<HTMLDivElement | null>(null);

  // Fetch live feed
  useEffect(() => { fetch("/api/feed").then((r) => r.json()).then(setFeed).catch(() => {}); }, []);

  // Clock in IST
  useEffect(() => {
    function tick() {
      try {
        const t = new Date().toLocaleTimeString("en-IN", {
          timeZone: "Asia/Kolkata",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false
        });
        setClock(t + " IST");
      } catch {
        setClock("");
      }
    }
    tick();
    const interval = setInterval(tick, 20000);
    return () => clearInterval(interval);
  }, []);

  // Swapping hero word
  useEffect(() => {
    const interval = setInterval(() => {
      setWordOpacity(0);
      setTimeout(() => {
        setWordIdx((prev) => (prev + 1) % WORDS.length);
        setWordOpacity(1);
      }, 260);
    }, 2600);
    return () => clearInterval(interval);
  }, []);

  // Stats Counters
  useEffect(() => {
    let start: number | null = null;
    const duration = 1300;
    const targets = { opps: 252, fields: 6, days: 30, signals: 3 };

    function step(ts: number) {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setCounters({
        opps: Math.round(targets.opps * ease),
        fields: Math.round(targets.fields * ease),
        days: Math.round(targets.days * ease),
        signals: Math.round(targets.signals * ease)
      });
      if (p < 1) requestAnimationFrame(step);
    }
    const raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Applicant counter on scroll
  useEffect(() => {
    const el = applicantRef.current;
    if (!el) return;

    let done = false;
    function run() {
      if (done) return;
      done = true;
      let start: number | null = null;
      const target = 2314;
      function step(ts: number) {
        if (!start) start = ts;
        const p = Math.min((ts - start) / 1700, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        setApplicantNum(Math.round(target * ease));
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            run();
            observer.disconnect();
          }
        },
        { threshold: 0.3 }
      );
      observer.observe(el);
      return () => observer.disconnect();
    } else {
      run();
    }
  }, []);

  // Net particle canvas
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    let pts: { x: number; y: number; vx: number; vy: number }[] = [];
    let W = (cv.width = cv.offsetWidth);
    let H = (cv.height = cv.offsetHeight);
    let raf: number;

    function size() {
      if (!cv) return;
      W = cv.width = cv.offsetWidth;
      H = cv.height = cv.offsetHeight;
      const n = Math.min(70, Math.floor((W * H) / 22000));
      pts = [];
      for (let i = 0; i < n; i++) {
        pts.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35
        });
      }
    }

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);
      const dot = "rgba(37,99,235,.5)";
      const line = "70,130,10";

      pts.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.6, 0, 7);
        ctx.fillStyle = dot;
        ctx.fill();
      });

      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const d = dx * dx + dy * dy;
          if (d < 130 * 130) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(${line},${0.14 * (1 - d / (130 * 130))})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    }

    size();
    window.addEventListener("resize", size);
    draw();

    return () => {
      window.removeEventListener("resize", size);
      cancelAnimationFrame(raf);
    };
  }, []);

  function initials(name: string) {
    return (
      name
        .replace(/[^A-Za-z ]/g, "")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase() || "OT"
    );
  }

  function timeAgo(h: number) {
    if (h < 24) return `${h}h ago`;
    const d = Math.round(h / 24);
    return `${d}d ago`;
  }

  // matchScore removed — live Opp data has no extracted skills list
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function matchScore(_o: Opp): number | null { return null; }

  // Multi-field toggle
  function toggleField(fieldName: string) {
    if (fieldName === "All") {
      setSelectedFields([]);
      return;
    }
    setSelectedFields((prev) =>
      prev.includes(fieldName) ? prev.filter((f) => f !== fieldName) : [...prev, fieldName]
    );
  }

  function toggleSkill(skill: string) {
    setSelectedSkills((prev) => {
      const next = new Set(prev);
      if (next.has(skill)) next.delete(skill);
      else next.add(skill);
      return next;
    });
  }

  function toggleCard(id: string) {
    setOpenCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Filtered jobs
  const visibleJobs = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = feed.filter((o) => {
      const field = fieldOf(o);
      if (selectedFields.length > 0 && !selectedFields.includes(field)) return false;
      const locL = (o.loc ?? "").toLowerCase();
      const isRemote = locL.includes("remote");
      const isIndia = locL.length > 0 && !locL.includes("uk") && !locL.includes("us") && !locL.includes("london") && !locL.includes("new york") && !locL.includes("singapore");
      if (mode === "remote" && !isRemote) return false;
      if (mode === "india" && !isIndia) return false;
      const hasEmail = o.leads.some((l) => l.kind === "email");
      if (mode === "form" && hasEmail) return false;
      if (mode === "email" && !hasEmail) return false;
      if (q) {
        const hay = `${o.title} ${o.company} ${o.loc} ${o.text}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (sort === "new") list.sort((a, b) => hoursAgo(a.date) - hoursAgo(b.date));
    if (sort === "az") list.sort((a, b) => (a.company || "").localeCompare(b.company || ""));
    // match sort falls back to newest since we have no skills
    if (sort === "match") list.sort((a, b) => hoursAgo(a.date) - hoursAgo(b.date));
    return list;
  }, [feed, query, selectedFields, mode, sort]);

  // Top scanner matches — not available without extracted skills
  const topMatches: { j: Opp; m: number }[] = [];

  const checkSvg = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <path d="M4 12.5l5 5L20 6.5" />
    </svg>
  );

  const chevSvg = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );

  const tickerItems = feed.slice(0, 10);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: LANDING_CSS }} />
      <nav>
        <div className="wrap nav-in">
          <Link className="brand" href="#top" aria-label="OpenToWork home"><img src="/logo.png" alt="OpenToWork" height={34} /></Link>
          <div className="nav-links">
            <a href="#story">The story</a>
            <a href="#feed">Live feed</a>
            <a href="#fields">Fields</a>
            <a href="#scanner">Match scanner</a>
            <a href="#how">How it works</a>
          </div>
          <div className="nav-right">
            <div className="live-dot">
              <i />
              <span>BOARD SNAPSHOT</span>
              <span className="mono">{clock}</span>
            </div>
            <Link className="nav-cta" href="/dashboard">
              Open the board
            </Link>
          </div>
        </div>
      </nav>

      <header id="top">
        <canvas id="net" ref={canvasRef} aria-hidden="true" />
        <div className="hero-grid" aria-hidden="true" />
        <div className="wrap hero-in">
          <span className="hero-tag">
            <i />HIRING POSTS FROM FOUNDERS &amp; HIRING TEAMS · 30 DAYS OF HISTORY
          </span>
          <h1>
            Find roles where the{" "}
            <span className="swap" style={{ opacity: wordOpacity, transition: "opacity .25s" }}>
              {WORDS[wordIdx]}
            </span>{" "}
            <span className="hl">actually happens.</span>
          </h1>
          <p className="hero-sub">
            OpenToWork collects hiring posts straight from <b>founders and hiring teams</b> — then pulls out the
            three things that matter: the <b>apply form</b>, the <b>email</b>, and{" "}
            <b>exactly what the post asks you to do</b>. No portal maze. No dead listings.
          </p>
          <div className="hero-actions">
            <a className="btn btn-solid" href="#feed">
              Browse the live feed
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 4v16m0 0l-6-6m6 6l6-6" />
              </svg>
            </a>
            <a className="btn btn-ghost" href="#scanner">
              Scan my match
            </a>
          </div>
          <div className="stats">
            <div className="stat">
              <div className="num">
                <span>{counters.opps}</span>
              </div>
              <div className="lbl">Live opportunities on the board</div>
            </div>
            <div className="stat">
              <div className="num">
                <span>{counters.fields}</span>
              </div>
              <div className="lbl">Fields tracked</div>
            </div>
            <div className="stat">
              <div className="num">
                <span>{counters.days}</span>
                <em>d</em>
              </div>
              <div className="lbl">Of post history</div>
            </div>
            <div className="stat">
              <div className="num">
                <span>{counters.signals}</span>
              </div>
              <div className="lbl">Signals extracted per post</div>
            </div>
          </div>
        </div>
      </header>

      <div className="ticker" aria-hidden="true">
        <div className="ticker-track">
          {[...tickerItems, ...tickerItems].map((j, i) => (
            <span className="tick-item" key={i}>
              <span className="tag">{fieldOf(j).toUpperCase() || j.source.toUpperCase()}</span>
              <b>{j.title}</b> · {j.loc} · {timeAgo(hoursAgo(j.date))}
            </span>
          ))}
        </div>
      </div>

      <main>
        {/* ============ STORY ============ */}
        <section id="story">
          <div className="wrap">
            <div className="sec-head">
              <div>
                <span className="sec-idx">01 / THE STORY</span>
                <h2>Application #2,314</h2>
                <p>Every job seeker knows this story by heart. It&apos;s exactly why this board exists.</p>
              </div>
            </div>
            <div className="story-grid">
              <div className="story-copy">
                <p>
                  You know the ritual. The coffee goes cold while you scroll. Every posting reads like it was written
                  by the same tired committee — <i>fast-paced environment</i>, <i>rockstar</i>, a <i>competitive salary</i>{" "}
                  that never dares to name a number. So you tailor the résumé anyway. You rewrite the cover letter anyway.
                  You press <b>Apply</b> — and your name drops into a pile of two thousand other names.
                </p>
                <p>
                  Then comes the worst part. Not rejection — <b>silence</b>. A no would at least be an answer. Instead,
                  one grey line on a dashboard: <i>Application viewed.</i> Week after week, it just sits there. Until one
                  morning the listing is simply gone, and the whole evening you spent on it quietly goes with it.
                </p>
                <p className="pull">
                  Job postings weren&apos;t written for you. They were written to be safe — scrubbed of the salary, the
                  team, the real work, and <em>the human who decides</em>.
                </p>
                <p>
                  Now walk through the other door. A founder posts at 9:12 in the morning:{" "}
                  <i>&quot;Hiring our first growth marketer. Here&apos;s the number I need moved, here&apos;s the budget — reply with two campaigns you&apos;re proud of.&quot;</i>{" "}
                  No committee. No maze. No pile. One person, one honest ask. And when you answer it well, you&apos;re not
                  applicant #2,314. You&apos;re <b>the person who replied</b>.
                </p>
                <p>
                  That&apos;s the whole idea behind OpenToWork. The hiring isn&apos;t happening inside boring postings with
                  thousands of applicants — it&apos;s happening in targeted posts from founders, HR teams and recruiters.
                  So skip the pile. Go straight to the source, and talk to the human on the other side.
                </p>
              </div>
              <div className="portal-stack">
                <div className="portal-card" ref={applicantRef}>
                  <div className="pc-head">
                    <b>Growth Marketing Manager</b>
                    <span>POSTED 47 DAYS AGO</span>
                  </div>
                  <div className="applicant-num">{applicantNum.toLocaleString("en-IN")}</div>
                  <p className="pc-note">
                    people applied before you even saw the listing. Your carefully tailored application lands at the very
                    bottom of this pile.
                  </p>
                </div>
                <div className="portal-card">
                  <div className="pc-status">
                    <i />Application viewed
                  </div>
                  <p className="pc-note">
                    Six weeks ago. No reply, no rejection, no name to write to — just a status that never changes, and a
                    dashboard you keep refreshing anyway.
                  </p>
                </div>
                <div className="turn-card">
                  <span className="tc-tag">THE OTHER DOOR · FOUNDER POST · 9:12 AM TODAY</span>
                  <p>
                    &quot;I&apos;m hiring our first growth marketer. Here&apos;s the number I need moved and the budget to
                    do it. Reply with two campaigns you&apos;re proud of — I read every one myself.&quot;
                  </p>
                  <div className="tc-foot">
                    <span className="tc-chip">REPLIED IN 2H 41M</span>
                    <span className="tc-chip">TALKING TO THE FOUNDER, NOT A PORTAL</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="vs-strip">
              <div className="vs-cell">
                <span className="vs-old">One of 2,314 applicants</span>
                <span className="vs-new">
                  One of a handful who <em>answered the post</em>
                </span>
              </div>
              <div className="vs-cell">
                <span className="vs-old">A listing posted 47 days ago</span>
                <span className="vs-new">
                  A hiring post from <em>this morning</em>
                </span>
              </div>
              <div className="vs-cell">
                <span className="vs-old">&quot;Application viewed&quot; — forever</span>
                <span className="vs-new">
                  A real reply, from <em>a real person</em>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ============ FEED ============ */}
        <section id="feed" style={{ paddingTop: 64 }}>
          <div className="wrap">
            <div className="sec-head">
              <div>
                <span className="sec-idx">02 / THE FEED</span>
                <h2>Live opportunities</h2>
                <p>
                  Hiring posts, decoded: who posted each role, where to apply, and what they actually asked for. Select
                  multiple fields to tune the feed to your exact interests.
                </p>
              </div>
            </div>

            <div className="toolbar">
              <div className="tool-row">
                <label className="search">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <circle cx="11" cy="11" r="7" />
                    <path d="M21 21l-4.3-4.3" />
                  </svg>
                  <input
                    type="search"
                    placeholder="Search roles, companies, skills…"
                    autoComplete="off"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </label>
                <select
                  className="sort"
                  aria-label="Sort opportunities"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as "new" | "match" | "az")}
                >
                  <option value="new">Newest first</option>
                  <option value="match">Best match</option>
                  <option value="az">Company A–Z</option>
                </select>
              </div>
              <div className="tool-row" role="group" aria-label="Filter by field">
                <button
                  className={`chip ${selectedFields.length === 0 ? "on" : ""}`}
                  onClick={() => toggleField("All")}
                >
                  All<span className="n">{feed.length}</span>
                </button>
                {FIELDS.map((f) => {
                  const count = feed.filter((o) => fieldOf(o) === f.name).length;
                  const isSelected = selectedFields.includes(f.name);
                  return (
                    <button
                      key={f.name}
                      className={`chip ${isSelected ? "on" : ""}`}
                      onClick={() => toggleField(f.name)}
                    >
                      {f.name}
                      <span className="n">{count}</span>
                    </button>
                  );
                })}
              </div>
              <div className="tool-row" role="group" aria-label="Filter by work mode">
                {(
                  [
                    ["all", "All locations"],
                    ["remote", "Remote"],
                    ["india", "India"],
                    ["form", "Apply by form"],
                    ["email", "Apply by email"]
                  ] as const
                ).map(([m, label]) => (
                  <button
                    key={m}
                    className={`chip ${mode === m ? "on" : ""}`}
                    onClick={() => setMode(m)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="feed-meta">
              <span className="count">
                SHOWING <b>{visibleJobs.length}</b> OF {feed.length} LIVE ROLES ·{" "}
                {selectedFields.length === 0
                  ? "ALL FIELDS"
                  : selectedFields.join(", ").toUpperCase()}
              </span>
              <span className="feed-note">
                Representative listings in the live board&apos;s format — the full, current board is at{" "}
                <Link href="/dashboard" style={{ color: "var(--accent)", fontWeight: 700 }}>
                  opentowork.work/dashboard
                </Link>
              </span>
            </div>

            <div className="grid">
              {visibleJobs.map((o) => {
                const field = fieldOf(o);
                const isOpen = openCards.has(o.id);
                const postedH = hoursAgo(o.date);
                const hasEmail = o.leads.some((l) => l.kind === "email");
                const primaryLead = o.leads.find((l) => l.kind !== "link") ?? o.leads[0];
                return (
                  <article key={o.id} className={`card ${postedH <= 12 ? "fresh" : ""} ${isOpen ? "open" : ""}`}>
                    <div className="card-top">
                      <div className="avatar">{initials(o.company || o.title)}</div>
                      <div>
                        <h3>{o.title}</h3>
                        <div className="co">{o.company || o.poster}</div>
                      </div>
                      <div className="match">
                        <div className="pct" style={{ color: "var(--ink-3)" }}>—</div>
                        <div className="cap">Set skills<br />to score</div>
                      </div>
                    </div>
                    <div className="tags">
                      {field && <span className="tag field">{field}</span>}
                      <span className="tag">{o.loc || "Location not stated"}</span>
                      <span className="tag">{hasEmail ? "Apply: email" : "Apply: form"}</span>
                    </div>
                    <p className="excerpt">{o.text}</p>
                    <div className="card-foot">
                      <span className="src">
                        {o.source.toUpperCase()} · {timeAgo(postedH).toUpperCase()}
                      </span>
                      <button
                        className="expand-btn"
                        aria-expanded={isOpen}
                        onClick={() => toggleCard(o.id)}
                      >
                        {isOpen ? "Hide " : "Details "}
                        {chevSvg}
                      </button>
                    </div>
                    {isOpen && (
                      <div className="detail" style={{ display: "flex" }}>
                        <div style={{ flex: 1 }}>
                          <h4>Full post</h4>
                          <p style={{ whiteSpace: "pre-wrap" }}>{o.text}</p>
                        </div>
                        <div className="apply-row">
                          {primaryLead && (
                            <a
                              className="apply-btn"
                              href={primaryLead.kind === "email" ? `mailto:${primaryLead.value}` : primaryLead.value}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {hasEmail ? "Email to apply" : "Apply now"}
                            </a>
                          )}
                          <Link className="apply-btn alt" href="/dashboard">
                            Full board
                          </Link>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>

            {visibleJobs.length === 0 && (
              <div className="empty" style={{ display: "block" }}>
                <b>No signal on this frequency</b>
                No roles match that combination. Loosen a filter or try a different search.
              </div>
            )}
          </div>
        </section>

        {/* ============ FIELDS ============ */}
        <section id="fields" style={{ background: "var(--bg-2)", borderBlock: "1px solid var(--line)" }}>
          <div className="wrap">
            <div className="sec-head">
              <div>
                <span className="sec-idx">03 / BROWSE BY FIELD</span>
                <h2>Six fields. Zero noise.</h2>
                <p>The board tracks the functions founders hire for first. Pick multiple fields to tune the feed instantly.</p>
              </div>
            </div>
            <div className="fields">
              {FIELDS.map((f) => {
                const count = feed.filter((o) => fieldOf(o) === f.name).length;
                const isSelected = selectedFields.includes(f.name);
                return (
                  <button
                    key={f.name}
                    className={`field-card ${isSelected ? "selected" : ""}`}
                    onClick={() => {
                      toggleField(f.name);
                      document.getElementById("feed")?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    <span className="ic">{f.icon}</span>
                    <h3>{f.name}</h3>
                    <p>{f.subs}</p>
                    <span className="fc-foot">
                      <span className="fc-count">
                        <b>{count}</b> in this sample feed
                      </span>
                      <span className="go">{isSelected ? "Selected ✓" : "Tune the feed →"}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ============ SCANNER ============ */}
        <section id="scanner">
          <div className="wrap">
            <div className="sec-head">
              <div>
                <span className="sec-idx">04 / MATCH SCANNER</span>
                <h2>How well do you fit?</h2>
                <p>Select your skills and experience — the scanner scores every live role against your profile, in real time.</p>
              </div>
            </div>
            <div className="scanner">
              <div className="scan-left">
                <h3>Your signal profile</h3>
                <p>Tap the skills you bring. Match scores across the feed and the ranking on the right update as you go.</p>
                <div className="skill-pool">
                  {SKILL_POOL.map((s) => {
                    const isPressed = selectedSkills.has(s);
                    return (
                      <button
                        key={s}
                        className={`chip ${isPressed ? "on" : ""}`}
                        aria-pressed={isPressed}
                        onClick={() => toggleSkill(s)}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
                <div className="scan-ctl">
                  <label htmlFor="expRange">Experience</label>
                  <input
                    type="range"
                    id="expRange"
                    min="0"
                    max="12"
                    step="1"
                    value={exp}
                    onChange={(e) => setExp(+e.target.value)}
                  />
                  <span className="exp-val">{exp >= 12 ? "12+ yrs" : `${exp} yrs`}</span>
                </div>
              </div>
              <div className="scan-right">
                <h4>Top matches right now</h4>
                {topMatches.length === 0 ? (
                  <div className="scan-empty">
                    No profile yet. Select at least one skill and the scanner will rank every role in the feed against you.
                  </div>
                ) : (
                  topMatches.map(({ j, m }) => (
                    <div key={j.id} className="match-row">
                      <div className="mr-top">
                        <span>{j.title} · {fieldOf(j)}</span>
                        <span>{m}%</span>
                      </div>
                      <div className="bar">
                        <i style={{ width: `${m}%` }} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ============ HOW ============ */}
        <section id="how" style={{ background: "var(--bg-2)", borderBlock: "1px solid var(--line)" }}>
          <div className="wrap">
            <div className="sec-head">
              <div>
                <span className="sec-idx">05 / HOW IT WORKS</span>
                <h2>From scattered posts to one clean feed</h2>
              </div>
            </div>
            <div className="steps">
              <div className="step">
                <span className="no">01</span>
                <h3>Agents sweep the sources</h3>
                <p>Research agents continuously scan the places founders and hiring teams actually post — social feeds, communities, and company pages — instead of waiting for listings to reach job portals.</p>
              </div>
              <div className="step">
                <span className="no">02</span>
                <h3>Every post gets decoded</h3>
                <p>Each post is read end-to-end and stripped down to the actionable core, so you never have to decode a rambling announcement thread again.</p>
                <div className="extract">
                  <span>APPLY FORM</span>
                  <span>EMAIL</span>
                  <span>THE ASK</span>
                </div>
              </div>
              <div className="step">
                <span className="no">03</span>
                <h3>You apply at the source</h3>
                <p>No middleman, no application black hole. You go straight to the founder&apos;s form or inbox with exactly what they asked for — while the post is still fresh.</p>
              </div>
            </div>

            <div className="cta" style={{ marginTop: 56 }}>
              <h2>Your next role was posted,<br />not listed.</h2>
              <p>252 live opportunities on the board right now at opentowork.work, pulled from where hiring actually happens. Go find yours.</p>
              <Link className="btn btn-solid" href="/dashboard">
                Open opentowork.work
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap foot">
          <Link className="brand" href="#top" aria-label="OpenToWork home"><img src="/logo.png" alt="OpenToWork" height={34} /></Link>
          <p>
            A futuristic redesign concept for{" "}
            <Link href="/dashboard" style={{ color: "var(--accent)", fontWeight: 700 }}>
              opentowork.work
            </Link>{" "}
            — hiring posts from founders and hiring teams, with the apply form, the email, and the ask extracted for you.
          </p>
        </div>
      </footer>
    </>
  );
}

const LANDING_CSS = `
:root{
  color-scheme:light;
  --bg:#fcf7ec;
  --bg-2:#f7f0df;
  --panel:#fffdf8;
  --panel-2:#faf4e6;
  --line:rgba(11,13,18,.14);
  --line-strong:rgba(11,13,18,.3);
  --ink:#0b0d12;
  --ink-2:#3d4350;
  --ink-3:#6b7183;
  --accent:#2563eb;
  --accent-ink:#ffffff;
  --accent-soft:rgba(37,99,235,.1);
  --cyan:#0b0d12;
  --cyan-soft:rgba(11,13,18,.06);
  --amber:#a86e00;
  --danger:#c93a2c;
  --glow:rgba(37,99,235,.25);
  --shadow:0 18px 40px rgba(11,13,18,.08);
  --radius:20px;
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{
  margin:0;
  background:var(--bg);
  color:var(--ink);
  font-family:"Figtree",system-ui,sans-serif;
  -webkit-font-smoothing:antialiased;
  overflow-x:hidden;
}
::selection{background:var(--accent);color:var(--accent-ink)}
a{color:inherit}
button{font-family:inherit;cursor:pointer}
.mono{font-family:"Figtree",monospace}
.wrap{max-width:1440px;margin:0 auto;padding:0 28px}

/* ---------- NAV ---------- */
nav{
  position:fixed;inset:0 0 auto 0;z-index:60;
  backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
  background:color-mix(in srgb, var(--bg) 72%, transparent);
  border-bottom:1px solid var(--line);
}
.nav-in{display:flex;align-items:center;gap:26px;height:64px}
.brand{display:flex;align-items:center;gap:11px;text-decoration:none;font-weight:800;letter-spacing:.02em}
.brand .mark{
  width:34px;height:34px;border-radius:10px;display:grid;place-items:center;
  background:var(--accent);color:var(--accent-ink);
  box-shadow:0 0 22px var(--glow);
}
.brand .mark svg{width:19px;height:19px}
.brand img{display:block;height:34px;width:auto}
.brand b span{color:var(--accent)}
.nav-links{display:flex;gap:4px;margin-left:8px}
.nav-links a{
  text-decoration:none;color:var(--ink-2);font-weight:600;font-size:14px;
  padding:8px 13px;border-radius:99px;transition:.2s;
}
.nav-links a:hover{color:var(--ink);background:var(--accent-soft)}
.nav-right{margin-left:auto;display:flex;align-items:center;gap:14px}
.live-dot{display:flex;align-items:center;gap:8px;font-family:"Figtree",monospace;font-size:11.5px;color:var(--ink-2);letter-spacing:.06em}
.live-dot i{width:8px;height:8px;border-radius:50%;background:var(--accent);box-shadow:0 0 0 0 var(--glow);animation:pulse 2s infinite}
@keyframes pulse{0%{box-shadow:0 0 0 0 var(--glow)}70%{box-shadow:0 0 0 9px transparent}100%{box-shadow:0 0 0 0 transparent}}
.nav-cta{
  background:var(--accent);color:var(--accent-ink);border:none;font-weight:800;font-size:14px;
  padding:10px 18px;border-radius:99px;text-decoration:none;transition:.2s;
}
.nav-cta:hover{transform:translateY(-1px);box-shadow:0 8px 24px var(--glow)}
@media (max-width:760px){ .nav-links{display:none} .live-dot span{display:none} .nav-cta{padding:9px 14px;font-size:13px;white-space:nowrap} }

/* ---------- HERO ---------- */
header{position:relative;padding:158px 0 84px;overflow:hidden;background:var(--bg-2)}
#net{position:absolute;inset:0;width:100%;height:100%;opacity:.55;pointer-events:none}
.hero-grid{display:none;
  position:absolute;inset:0;pointer-events:none;
  background-image:linear-gradient(var(--line) 1px,transparent 1px),linear-gradient(90deg,var(--line) 1px,transparent 1px);
  background-size:72px 72px;opacity:.35;
  mask-image:radial-gradient(ellipse 90% 70% at 50% 30%,#000 30%,transparent 75%);
  -webkit-mask-image:radial-gradient(ellipse 90% 70% at 50% 30%,#000 30%,transparent 75%);
}
.hero-in{position:relative;z-index:2}
.hero-tag{
  display:inline-flex;align-items:center;gap:9px;
  border:1px solid var(--line-strong);border-radius:99px;padding:7px 14px;
  font-family:"Figtree",monospace;font-size:12px;letter-spacing:.08em;color:var(--ink-2);
  background:color-mix(in srgb, var(--panel) 65%, transparent);
}
.hero-tag i{width:7px;height:7px;border-radius:50%;background:var(--cyan)}
h1{
  font-family:"Outfit",sans-serif;font-weight:500;
  font-size:clamp(44px,8vw,104px);line-height:.98;letter-spacing:-.035em;
  margin:26px 0 0;max-width:14ch;
}
h1 .hl{color:var(--accent)}
h1 .swap{display:inline-block;min-width:5.2ch;color:var(--cyan)}
.hero-sub{margin:24px 0 0;max-width:56ch;font-size:clamp(16px,2vw,19px);line-height:1.65;color:var(--ink-2);font-weight:500}
.hero-sub b{color:var(--ink)}
.hero-actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:34px}
.btn{
  display:inline-flex;align-items:center;gap:9px;text-decoration:none;
  font-weight:800;font-size:15px;padding:14px 24px;border-radius:14px;transition:.2s;border:1px solid transparent;
}
.btn-solid{background:var(--accent);color:var(--accent-ink)}
.btn-solid:hover{transform:translateY(-2px);box-shadow:0 12px 30px var(--glow)}
.btn-ghost{border-color:var(--line-strong);color:var(--ink);background:color-mix(in srgb, var(--panel) 55%, transparent)}
.btn-ghost:hover{border-color:var(--accent);color:var(--accent)}
.stats{
  display:grid;grid-template-columns:repeat(4,1fr);gap:1px;margin-top:58px;
  background:var(--line);border:1px solid var(--line);border-radius:var(--radius);overflow:hidden;
}
.stat{background:color-mix(in srgb, var(--panel) 88%, transparent);padding:22px 24px}
.stat .num{font-family:"Outfit",sans-serif;font-size:clamp(26px,3.4vw,38px);font-weight:700;line-height:1}
.stat .num em{font-style:normal;color:var(--accent)}
.stat .lbl{margin-top:9px;font-family:"Figtree",monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-3)}
@media (max-width:820px){ .stats{grid-template-columns:1fr 1fr} }

/* ---------- TICKER ---------- */
.ticker{border-block:1px solid var(--line);background:var(--panel);overflow:hidden;position:relative}
.ticker-track{display:flex;gap:0;width:max-content;animation:tick 46s linear infinite;padding:11px 0}
.ticker:hover .ticker-track{animation-play-state:paused}
@keyframes tick{to{transform:translateX(-50%)}}
.tick-item{display:flex;align-items:center;gap:10px;padding:0 26px;font-size:13.5px;font-weight:600;color:var(--ink-2);white-space:nowrap}
.tick-item b{color:var(--ink)}
.tick-item .tag{font-family:"Figtree",monospace;font-size:10.5px;color:var(--accent);border:1px solid var(--line-strong);padding:2px 8px;border-radius:99px}

/* ---------- SECTIONS ---------- */
section{padding:84px 0}
.sec-head{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;flex-wrap:wrap;margin-bottom:34px}
.sec-head h2{font-family:"Outfit",sans-serif;font-size:clamp(26px,3.6vw,40px);font-weight:700;margin:0;line-height:1.15}
.sec-head p{margin:10px 0 0;color:var(--ink-2);font-size:16px;max-width:52ch;line-height:1.6}
.sec-idx{font-family:"Figtree",monospace;font-size:12px;color:var(--accent);letter-spacing:.14em;margin-bottom:12px;display:block}

/* ---------- FEED TOOLBAR ---------- */
.toolbar{
  position:sticky;top:64px;z-index:40;
  background:color-mix(in srgb, var(--bg) 86%, transparent);
  backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
  border:1px solid var(--line);border-radius:var(--radius);padding:14px;
  display:flex;flex-direction:column;gap:12px;box-shadow:var(--shadow);
}
.tool-row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
.search{
  flex:1;min-width:220px;display:flex;align-items:center;gap:10px;
  background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:0 14px;
}
.search svg{width:17px;height:17px;color:var(--ink-3);flex:none}
.search input{
  flex:1;background:none;border:none;outline:none;color:var(--ink);
  font-family:inherit;font-size:15px;font-weight:600;padding:12px 0;min-width:0;
}
.search input::placeholder{color:var(--ink-3)}
.search:focus-within{border-color:var(--accent)}
select.sort{
  background:var(--panel);color:var(--ink);border:1px solid var(--line);border-radius:12px;
  font-family:inherit;font-weight:700;font-size:14px;padding:12px 12px;outline:none;cursor:pointer;
}
.chip{
  border:1px solid var(--line);background:var(--panel);color:var(--ink-2);
  font-weight:700;font-size:13.5px;padding:9px 15px;border-radius:99px;transition:.18s;
}
.chip:hover{border-color:var(--line-strong);color:var(--ink)}
.chip.on{background:var(--accent);border-color:var(--accent);color:var(--accent-ink)}
.chip .n{font-family:"Figtree",monospace;font-size:11px;opacity:.75;margin-left:5px}
.feed-meta{display:flex;justify-content:space-between;align-items:center;margin:22px 2px 16px;flex-wrap:wrap;gap:8px}
.feed-meta .count{font-family:"Figtree",monospace;font-size:12.5px;color:var(--ink-2);letter-spacing:.05em}
.feed-meta .count b{color:var(--accent)}
.feed-note{font-size:12.5px;color:var(--ink-3)}

/* ---------- JOB CARDS ---------- */
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:20px}
@media (max-width:640px){ .grid{grid-template-columns:1fr} }
.card{
  background:var(--panel);border:1px solid var(--line);border-radius:var(--radius);
  padding:24px 26px;display:flex;flex-direction:column;gap:14px;position:relative;
  transition:transform .22s,border-color .22s,box-shadow .22s;
}
.card.open{grid-column: 1 / -1;}
.card:hover{transform:translateY(-4px);border-color:var(--line-strong);box-shadow:var(--shadow)}
.card.fresh::before{
  content:"NEW";position:absolute;top:-9px;right:18px;background:var(--cyan);color:#04231c;
  font-family:"Figtree",monospace;font-size:10px;font-weight:700;letter-spacing:.1em;
  padding:3px 9px;border-radius:99px;
}
.card-top{display:flex;align-items:flex-start;gap:13px}
.avatar{
  width:46px;height:46px;flex:none;border-radius:13px;display:grid;place-items:center;
  font-family:"Outfit",sans-serif;font-weight:700;font-size:15px;
  background:var(--accent-soft);color:var(--accent);border:1px solid var(--line);
}
.card h3{margin:0;font-size:17.5px;line-height:1.3;font-weight:800}
.co{color:var(--ink-2);font-size:13.5px;font-weight:600;margin-top:3px}
.match{margin-left:auto;text-align:right;flex:none}
.match .pct{font-family:"Figtree",monospace;font-weight:700;font-size:16px;color:var(--accent)}
.match .cap{font-size:10px;letter-spacing:.1em;color:var(--ink-3);text-transform:uppercase;font-weight:700}
.tags{display:flex;flex-wrap:wrap;gap:7px}
.tag{
  font-size:12px;font-weight:700;padding:5px 10px;border-radius:99px;
  background:var(--panel-2);border:1px solid var(--line);color:var(--ink-2);
}
.tag.field{color:var(--cyan);background:var(--cyan-soft);border-color:transparent}
.excerpt{color:var(--ink-2);font-size:14px;line-height:1.6;margin:0}
.card-foot{display:flex;align-items:center;gap:10px;margin-top:auto;padding-top:6px;border-top:1px dashed var(--line)}
.src{font-family:"Figtree",monospace;font-size:11px;color:var(--ink-3);letter-spacing:.03em}
.expand-btn{
  margin-left:auto;background:none;border:1px solid var(--line);color:var(--ink);
  font-weight:800;font-size:13px;padding:8px 14px;border-radius:10px;transition:.18s;
  display:inline-flex;align-items:center;gap:7px;
}
.expand-btn:hover{border-color:var(--accent);color:var(--accent)}
.expand-btn svg{width:13px;height:13px;transition:transform .25s}
.card.open .expand-btn svg{transform:rotate(180deg)}
.detail{border-top:1px solid var(--line);padding-top:16px;flex-direction:column;gap:14px}
.detail h4{margin:0 0 8px;font-family:"Figtree",monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-3)}
.detail ul{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:7px}
.detail li{display:flex;gap:9px;font-size:14px;color:var(--ink-2);line-height:1.5}
.detail li svg{width:15px;height:15px;flex:none;margin-top:3px;color:var(--accent)}
.apply-row{display:flex;gap:9px;flex-wrap:wrap}
.apply-btn{
  flex:1;min-width:130px;text-align:center;text-decoration:none;font-weight:800;font-size:13.5px;
  padding:11px 14px;border-radius:11px;background:var(--accent);color:var(--accent-ink);transition:.2s;
}
.apply-btn:hover{box-shadow:0 8px 22px var(--glow)}
.apply-btn.alt{background:transparent;border:1px solid var(--line-strong);color:var(--ink)}
.apply-btn.alt:hover{border-color:var(--cyan);color:var(--cyan);box-shadow:none}
.skills-line{display:flex;flex-wrap:wrap;gap:6px}
.sk{font-family:"Figtree",monospace;font-size:11px;padding:4px 9px;border-radius:7px;background:var(--panel-2);border:1px solid var(--line);color:var(--ink-2)}
.sk.hit{color:var(--accent);border-color:var(--accent)}
.empty{
  display:none;text-align:center;padding:64px 20px;border:1px dashed var(--line-strong);
  border-radius:var(--radius);color:var(--ink-2);
}
.empty b{display:block;font-family:"Outfit",sans-serif;font-size:20px;color:var(--ink);margin-bottom:8px}

/* ---------- STORY ---------- */
.story-grid{display:grid;grid-template-columns:1.12fr .88fr;gap:36px;align-items:start}
@media (max-width:900px){ .story-grid{grid-template-columns:1fr} }
.story-copy p{margin:0 0 18px;font-size:17px;line-height:1.75;color:var(--ink-2)}
.story-copy p b{color:var(--ink)}
.story-copy .pull{
  font-family:"Outfit",sans-serif;font-size:clamp(19px,2.4vw,24px);font-weight:700;
  line-height:1.45;color:var(--ink);margin:28px 0;
}
.story-copy .pull em{font-style:normal;color:var(--accent)}
.portal-stack{display:flex;flex-direction:column;gap:14px}
.portal-card{background:var(--panel);border:1px solid var(--line);border-radius:var(--radius);padding:20px 22px}
.pc-head{display:flex;justify-content:space-between;gap:12px;align-items:baseline;flex-wrap:wrap}
.pc-head b{font-size:15.5px}
.pc-head span{font-family:"Figtree",monospace;font-size:11px;color:var(--ink-3);letter-spacing:.06em}
.applicant-num{font-family:"Outfit",sans-serif;font-size:clamp(36px,4.6vw,48px);font-weight:900;color:var(--danger);line-height:1;margin:14px 0 7px}
.pc-note{font-size:14px;color:var(--ink-2);line-height:1.6;margin:0}
.pc-status{display:flex;align-items:center;gap:9px;font-size:15px;font-weight:800;color:var(--ink);margin-bottom:8px}
.pc-status i{width:8px;height:8px;border-radius:50%;background:var(--amber);flex:none}
.turn-card{background:var(--ink);color:#eef5ec;border-radius:var(--radius);padding:22px}
.turn-card .tc-tag{font-family:"Figtree",monospace;font-size:10.5px;letter-spacing:.13em;color:#a5d96e}
.turn-card p{font-size:16.5px;line-height:1.65;margin:12px 0 0;font-weight:600}
.turn-card .tc-foot{display:flex;gap:8px;flex-wrap:wrap;margin-top:17px}
.turn-card .tc-chip{font-family:"Figtree",monospace;font-size:11px;border:1px solid rgba(238,245,236,.28);padding:5px 11px;border-radius:99px;color:#dcebd4}
.vs-strip{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:34px}
@media (max-width:900px){ .vs-strip{grid-template-columns:1fr} }
.vs-cell{background:var(--panel);border:1px solid var(--line);border-radius:var(--radius);padding:20px 22px}
.vs-cell .vs-old{display:block;color:var(--ink-3);font-size:14.5px;font-weight:600;text-decoration:line-through;text-decoration-color:var(--danger);text-decoration-thickness:1.5px;margin-bottom:9px}
.vs-cell .vs-new{display:block;font-weight:800;font-size:16.5px;color:var(--ink);line-height:1.45}
.vs-cell .vs-new em{font-style:normal;color:var(--accent)}

/* ---------- FIELDS ---------- */
.fields{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
@media (max-width:1020px){ .fields{grid-template-columns:repeat(2,1fr)} }
@media (max-width:640px){ .fields{grid-template-columns:1fr} }
.field-card{
  text-align:left;background:var(--panel);border:1px solid var(--line);border-radius:var(--radius);
  padding:26px;color:var(--ink);transition:.22s;position:relative;overflow:hidden;width:100%;
}
.field-card:hover{transform:translateY(-4px);border-color:var(--accent)}
.field-card.selected{border-color:var(--accent);box-shadow:0 0 0 2px var(--accent-soft)}
.field-card .ic{
  width:48px;height:48px;border-radius:13px;display:grid;place-items:center;margin-bottom:18px;
  background:var(--accent-soft);color:var(--accent);
}
.field-card .ic svg{width:23px;height:23px}
.field-card h3{margin:0 0 7px;font-size:19px;font-weight:800}
.field-card p{margin:0;color:var(--ink-2);font-size:14px;line-height:1.55}
.field-card .fc-foot{display:flex;justify-content:space-between;align-items:center;margin-top:20px}
.field-card .fc-count{font-family:"Figtree",monospace;font-size:12px;color:var(--ink-3)}
.field-card .fc-count b{color:var(--accent);font-size:15px}
.field-card .go{font-weight:800;font-size:13px;color:var(--accent)}

/* ---------- SCANNER ---------- */
.scanner{
  background:var(--panel);border:1px solid var(--line);border-radius:24px;overflow:hidden;
  display:grid;grid-template-columns:1.05fr .95fr;box-shadow:var(--shadow);
}
@media (max-width:900px){ .scanner{grid-template-columns:1fr} }
.scan-left{padding:34px}
.scan-left h3{font-family:"Outfit",sans-serif;font-size:22px;margin:0 0 10px;font-weight:700}
.scan-left p{color:var(--ink-2);line-height:1.6;margin:0 0 22px;font-size:15px}
.skill-pool{display:flex;flex-wrap:wrap;gap:8px}
.skill-pool .chip[aria-pressed="true"]{background:var(--cyan);border-color:var(--cyan);color:#04231c}
.scan-ctl{display:flex;align-items:center;gap:16px;margin-top:26px;flex-wrap:wrap}
.scan-ctl label{font-family:"Figtree",monospace;font-size:11.5px;letter-spacing:.1em;color:var(--ink-3);text-transform:uppercase}
input[type=range]{accent-color:var(--accent);width:170px}
.exp-val{font-family:"Figtree",monospace;font-weight:700;color:var(--accent)}
.scan-right{background:var(--panel-2);border-left:1px solid var(--line);padding:34px;display:flex;flex-direction:column;gap:14px}
@media (max-width:900px){ .scan-right{border-left:none;border-top:1px solid var(--line)} }
.scan-right h4{margin:0;font-family:"Figtree",monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-3)}
.match-row{display:flex;flex-direction:column;gap:7px}
.match-row .mr-top{display:flex;justify-content:space-between;gap:12px;font-size:14px;font-weight:700}
.match-row .mr-top span:last-child{font-family:"Figtree",monospace;color:var(--accent)}
.bar{height:8px;border-radius:99px;background:var(--line);overflow:hidden}
.bar i{display:block;height:100%;width:0;border-radius:99px;background:linear-gradient(90deg,var(--cyan),var(--accent));transition:width .8s cubic-bezier(.2,.8,.2,1)}
.scan-empty{color:var(--ink-3);font-size:14.5px;line-height:1.6;border:1px dashed var(--line-strong);border-radius:14px;padding:20px}

/* ---------- HOW ---------- */
.steps{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
@media (max-width:900px){ .steps{grid-template-columns:1fr} }
.step{background:var(--panel);border:1px solid var(--line);border-radius:var(--radius);padding:28px}
.step .no{font-family:"Outfit",sans-serif;font-size:34px;font-weight:900;color:transparent;-webkit-text-stroke:1.5px var(--accent);display:block;margin-bottom:16px}
.step h3{margin:0 0 9px;font-size:18px;font-weight:800}
.step p{margin:0;color:var(--ink-2);line-height:1.65;font-size:14.5px}
.extract{display:flex;gap:8px;flex-wrap:wrap;margin-top:18px}
.extract span{font-family:"Figtree",monospace;font-size:11.5px;border:1px solid var(--line-strong);color:var(--cyan);padding:5px 11px;border-radius:99px}

/* ---------- CTA / FOOTER ---------- */
.cta{
  border:1px solid var(--line);border-radius:24px;padding:52px 34px;text-align:center;
  background:radial-gradient(ellipse 70% 120% at 50% 0%,var(--accent-soft),transparent),var(--panel);
}
.cta h2{font-family:"Outfit",sans-serif;font-size:clamp(26px,4vw,42px);margin:0 0 14px;font-weight:800}
.cta p{color:var(--ink-2);max-width:48ch;margin:0 auto 28px;line-height:1.65;font-size:16px}
footer{border-top:1px solid var(--line);padding:38px 0 46px;margin-top:20px}
.foot{display:flex;justify-content:space-between;gap:18px;flex-wrap:wrap;align-items:center}
.foot p{color:var(--ink-3);font-size:13px;margin:0;line-height:1.6;max-width:60ch}
.foot a{color:var(--accent);text-decoration:none;font-weight:700}

@media (prefers-reduced-motion: reduce){
  .ticker-track{animation:none}
  html{scroll-behavior:auto}
  .bar i{transition:none}
}
`;
