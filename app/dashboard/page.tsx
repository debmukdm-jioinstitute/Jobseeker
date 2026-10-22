"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { TAXONOMY } from "@/lib/taxonomy";
import { lookups } from "@/lib/extract";
import type { Opp } from "@/lib/ingest";
import { match } from "@/lib/resume";
import { loadProfile } from "@/lib/profile-client";
import { EMPTY, ago, baseFilter, citiesOf, count, finish, labelOf, modeOf, SECTOR_NAMES, sectorOf, srcOf, viaOf, type Filters } from "@/lib/filter";
import { DEFAULT_TEMPLATE, missingProfile } from "@/lib/profile";
import ApplyModal, { type ApplyMe } from "../ApplyModal";
import "../apply.css";
import SearchBar from "../SearchBar";
import ThemeToggle from "../ThemeToggle";
import Logo from "../Logo";
import BackButton from "../BackButton";
import Bell from "../Bell";

const read = <T,>(k: string, d: T): T => { try { return JSON.parse(localStorage.getItem(k) ?? "") as T; } catch { return d; } };
const toggle = (a: string[], v: string) => (a.includes(v) ? a.filter((x) => x !== v) : [...a, v]);
const PAGE = 20;

const posterInitials = (p?: string) =>
  p?.replace(/[^A-Za-z ]/g, "").split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "HR";

const IconBriefcase = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);
const IconPin = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" /><circle cx="12" cy="10" r="3" />
  </svg>
);
const IconLink = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);
const IconClock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);
const IconBookmark = ({ on }: { on: boolean }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);
const IconEmail = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
  </svg>
);
const IconForm = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);
const IconChevron = ({ open }: { open: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
    <polyline points={open ? "18 15 12 9 6 15" : "6 9 12 15 18 9"} />
  </svg>
);
const IconLinkedIn = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
  </svg>
);

function Facet({ title, items, sel, onToggle, max = 6 }: { title: string; items: [string, number][]; sel: string[]; onToggle: (v: string) => void; max?: number }) {
  const [all, setAll] = useState(false);
  if (!items.length) return null;
  return (
    <div className="facet">
      <h4>{title}</h4>
      {(all ? items : items.slice(0, max)).map(([v, n]) => (
        <label className="opt" key={v}><input type="checkbox" checked={sel.includes(v)} onChange={() => onToggle(v)} /><span>{v}</span><span className="n">{n}</span></label>
      ))}
      {items.length > max && <button className="plain small" onClick={() => setAll(!all)}>{all ? "Show less" : "View more"}</button>}
    </div>
  );
}

export default function Dashboard() {
  const [ready, setReady] = useState(false);
  const [who, setWho] = useState("");
  const [f, setF] = useState<Filters>(EMPTY);
  const [feed, setFeed] = useState<Opp[] | null>(null);
  const [err, setErr] = useState("");
  const [saved, setSaved] = useState<string[]>([]);
  const [shown, setShown] = useState(PAGE);
  const [open, setOpen] = useState("");
  const [fOpen, setFOpen] = useState(false);
  const [kws, setKws] = useState<string[]>([]);
  const [am, setAm] = useState<ApplyMe | null>(null);
  const [apps, setApps] = useState<Record<string, string>>({});
  const [sel, setSel] = useState<string[]>([]);
  const [modal, setModal] = useState<Opp[] | null>(null);

  useEffect(() => {
    (async () => {
      const me = await fetch("/api/me").then((r) => r.json()).catch(() => ({ email: null }));
      if (me.email) setWho(me.email);
      if (me.profile && me.cv && me.cvFile && !missingProfile(me.profile).length) setAm({ profile: me.profile, cv: me.cv, hasFile: !!me.cvFile, cvLink: me.cvLink, template: me.template ?? DEFAULT_TEMPLATE });
      setApps(Object.fromEntries((me.apps ?? []).map((a: { postId: string; status: string }) => [a.postId, a.status])));
      const p = new URLSearchParams(location.search);
      // Signed in: the account's saved data wins; first login after guest use adopts the device's data.
      const prefs: string[] = me.email && me.prefs?.length ? me.prefs : read("js_prefs", []);
      const urlAreas = p.getAll("area").flatMap((x) => x.split(",")).filter(Boolean);
      setF({ ...EMPTY, q: p.get("q") ?? "", where: p.get("where") ?? "", areas: urlAreas.length ? urlAreas : prefs, src: p.get("src") ? [p.get("src")!] : [], forYou: p.get("foryou") === "1" });
      setSaved(me.email && me.saved?.length ? me.saved : read("js_saved", []));
      loadProfile().then((pr) => setKws(pr.keywords));
      setReady(true);
      fetch("/api/feed").then((r) => r.json()).then(setFeed).catch(() => setErr("Could not load the feed. Try again in a minute."));
    })();
  }, []);

  const sync = (body: object) => who && fetch("/api/me", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => {});
  useEffect(() => { if (ready) { localStorage.setItem("js_saved", JSON.stringify(saved)); sync({ saved }); } }, [saved, ready, who]);
  useEffect(() => setShown(PAGE), [f]);

  const set = (p: Partial<Filters>) => setF((x) => ({ ...x, ...p }));
  // Only the user's own area picks are remembered; an ?area= link from the landing page is just a view.
  function setAreas(areas: string[]) {
    set({ areas });
    localStorage.setItem("js_prefs", JSON.stringify(areas));
    sync({ prefs: areas });
  }
  async function out() { await fetch("/api/auth/logout", { method: "POST" }); location.href = "/"; }

  const base = useMemo(() => baseFilter(feed ?? [], f), [feed, f.q, f.where, f.areas]);
  const sectors = useMemo(() => { const c = new Map(count(base, sectorOf)); return SECTOR_NAMES.map((n) => [n, c.get(n) ?? 0] as [string, number]).filter(([n, k]) => k || f.sector.includes(n)); }, [base, f.sector]);
  const filtered = useMemo(() => finish(base, f, new Set(saved)), [base, f, saved]);
  // ATS-style matches against the keywords scanned from the user's resume
  const scored = useMemo(() => new Map(filtered.map((o) => [o.id, match(o, kws)])), [filtered, kws]);
  const list = useMemo(
    () => (f.forYou && kws.length ? filtered.filter((o) => scored.get(o.id)!.score > 0).sort((a, b) => scored.get(b.id)!.score - scored.get(a.id)!.score || b.date.localeCompare(a.date)) : filtered),
    [filtered, scored, f.forYou, kws],
  );

  const active = [
    ...f.areas.map((v) => [v, () => setAreas(toggle(f.areas, v))] as const),
    ...f.sector.map((v) => [v, () => set({ sector: toggle(f.sector, v) })] as const),
    ...f.mode.map((v) => [v, () => set({ mode: toggle(f.mode, v) })] as const),
    ...f.city.map((v) => [v, () => set({ city: toggle(f.city, v) })] as const),
    ...f.src.map((v) => [v, () => set({ src: toggle(f.src, v) })] as const),
    ...f.via.map((v) => ["Apply: " + v, () => set({ via: toggle(f.via, v) })] as const),
    ...(f.days ? [[`Last ${f.days} days`, () => set({ days: 0 })] as const] : []),
    ...(f.saved ? [["Saved only", () => set({ saved: false })] as const] : []),
    ...(f.forYou ? [["For you", () => set({ forYou: false })] as const] : []),
  ];

  if (!ready) return null;
  return (
    <main>
      <nav>
        <div className="nav-left">
          <Logo />
          <ThemeToggle />
          <Link href="/applications" className="nav-apps-link">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
            <span>My applications</span>
          </Link>
        </div>
        <div className="nav-right">
          <BackButton />
          <Bell />
          {who ? (
            <>
              <span className="nav-email">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2"/>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
                <span>{who}</span>
              </span>
              <span className="nav-vdiv">|</span>
              <button className="nav-signout-btn" onClick={out}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                <span>Sign out</span>
              </button>
              <Link href="/profile" className="nav-profile-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <span>Profile</span>
              </Link>
            </>
          ) : (
            <Link href="/login" className="nav-profile-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <span>Sign in</span>
            </Link>
          )}
        </div>
      </nav>
      <SearchBar q={f.q} where={f.where} onSearch={(q, where) => set({ q, where })} />

      <div className="layout">
        <aside className={`filters ${fOpen ? "open" : ""}`}>
          <div className="facet">
            <h4>Posted</h4>
            {[[0, "Any time"], [1, "Last 24 hours"], [7, "Last 7 days"], [30, "Last 30 days"]].map(([d, l]) => (
              <label className="opt" key={d}><input type="radio" name="days" checked={f.days === d} onChange={() => set({ days: d as number })} /><span>{l}</span></label>
            ))}
          </div>
          <Facet title="Work mode" items={count(base, modeOf)} sel={f.mode} onToggle={(v) => set({ mode: toggle(f.mode, v) })} />
          <Facet title="Source" items={count(base, srcOf)} sel={f.src} onToggle={(v) => set({ src: toggle(f.src, v) })} />
          <Facet title="Apply via" items={count(base, viaOf)} sel={f.via} onToggle={(v) => set({ via: toggle(f.via, v) })} />
          <Facet title="Location" items={count(base, citiesOf)} sel={f.city} onToggle={(v) => set({ city: toggle(f.city, v) })} />
          <Facet title="Sector" items={sectors} sel={f.sector} onToggle={(v) => set({ sector: toggle(f.sector, v) })} max={8} />
        </aside>

        <section style={{ margin: 0 }}>
          <div className="areas">
            <div className="areas-head">
              <h2>Choose your areas</h2>
              <p>Select a primary area and the specific areas you&apos;re interested in.</p>
              <button className="clear" disabled={f.areas.length === 0} onClick={() => setAreas([])}>Clear all</button>
            </div>
            <div className="areas-primary">
              {Object.keys(TAXONOMY).map((c) => {
                const on = f.areas.includes(c);
                return (
                  <label className={`area-card ${on ? "on" : ""}`} key={c}>
                    <input type="checkbox" checked={on} onChange={() => setAreas(toggle(f.areas, c))} />
                    <span>{c}</span>
                  </label>
                );
              })}
            </div>
            {Object.keys(TAXONOMY).map((c) => (
              <div className="area-group" key={c}>
                <div className="area-cat">{c}</div>
                <div className="area-subs">
                  {TAXONOMY[c].map((s) => {
                    const p = `${c} / ${s}`;
                    const on = f.areas.includes(p);
                    return (
                      <label className={`area-chip ${on ? "on" : ""}`} key={p}>
                        <input type="checkbox" checked={on} onChange={() => setAreas(toggle(f.areas, p))} />
                        <span>{s}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
            {!who && <p className="mut small" style={{ margin: "16px 0 0" }}>Guest: areas are saved on this device. <Link href="/login">Sign in</Link> to keep them everywhere.</p>}
          </div>

          {/* Toolbar (Image 3) */}
          <div className="tb-bar">
            <span className="tb-stat-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
              <span>{feed ? `${Math.min(shown, list.length)} of ${list.length} jobs` : "Loading jobs…"}</span>
            </span>

            <span className="tb-divider">|</span>

            <button
              className={`tb-tab-btn ${f.forYou ? "active" : ""}`}
              onClick={() => set({ forYou: !f.forYou })}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M19 8v6m-3-3h6"/>
              </svg>
              <span>For you</span>
            </button>

            <button
              className={`tb-tab-btn ${f.saved ? "active" : ""}`}
              onClick={() => set({ saved: !f.saved })}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill={f.saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
              <span>Saved ({feed ? saved.filter((id) => feed.some((o) => o.id === id)).length : saved.length})</span>
            </button>

            <button className="alt fbtn" style={{ marginLeft: "auto" }} onClick={() => setFOpen(!fOpen)}>Filters</button>

            <span className="tb-divider">|</span>

            <div className="tb-sort-select">
              <span className="tb-sort-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" y1="6" x2="20" y2="6"/>
                  <line x1="4" y1="12" x2="16" y2="12"/>
                  <line x1="4" y1="18" x2="12" y2="18"/>
                </svg>
              </span>
              <select
                aria-label="Sort"
                value={f.sort}
                onChange={(e) => set({ sort: e.target.value as Filters["sort"] })}
              >
                <option value="new">Newest</option>
                <option value="fresh">Freshness</option>
                <option value="rel">Relevance</option>
              </select>
              <span className="tb-sort-chevron">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </span>
            </div>
          </div>

          {/* Active Filter Chips (Image 3) */}
          {active.length > 0 && (
            <div className="active-filters-row">
              {active.map(([l, rm]) => (
                <button key={l} className="active-pill" onClick={rm}>
                  <span>{l}</span>
                  <span className="x-icon">✕</span>
                </button>
              ))}
              <span className="tb-divider">|</span>
              <button className="active-clear-all" onClick={() => setF({ ...EMPTY, q: f.q, where: f.where })}>
                Clear all
              </button>
            </div>
          )}
          {f.forYou && !kws.length && <div className="card" style={{ marginBottom: 12 }}><b>Upload your resume to see jobs for you</b><p className="mut">We scan it for keywords in your browser and match them to the jobs here.</p><Link href="/profile" className="btn">Upload resume</Link></div>}
          {err && <p className="mut">{err}</p>}
          {feed && feed.length === 0 && <div className="card"><b>No opportunities yet.</b><p className="mut">New posts appear here as soon as our agents deliver their next feed.</p></div>}
          {feed && feed.length > 0 && list.length === 0 && <div className="card"><b>No jobs match.</b><p className="mut">Remove a filter or try a broader search.</p></div>}

          {list.slice(0, shown).map((o) => {
            const isSaved = saved.includes(o.id);
            const isOpen = open === o.id;
            const primaryLead = o.leads.find((x) => x.kind !== "link") ?? o.leads[0];
            const originalLink = o.leads.find((l) => l.kind === "link");
            const otherLeads = o.leads.filter((l) => l !== primaryLead);
            const isEmail = primaryLead?.kind === "email";
            const researchItems = lookups(o.company);

            return (
              <article className="card job" key={o.id}>
                {/* Top Section */}
                <div className="top">
                  <div className="company-badge">
                    <span style={{ fontSize: o.company && o.company.length > 9 ? 11 : 13, lineHeight: 1.15 }}>
                      {o.company || (o.title ? o.title.slice(0, 8) : "Role")}
                    </span>
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h3 onClick={() => setOpen(isOpen ? "" : o.id)}>{o.title}</h3>
                    <div className="co-name">{o.company || o.poster}</div>
                    <div className="meta-row">
                      <span className="meta-item"><IconBriefcase /> {o.loc || "Not stated in post"}</span>
                      <span className="meta-div">|</span>
                      <span className="meta-item"><IconPin /> {modeOf(o)}</span>
                      <span className="meta-div">|</span>
                      <span className="meta-item"><IconLink /> {srcOf(o)}</span>
                      <span className="meta-div">|</span>
                      <span className="meta-item"><IconClock /> {ago(o.date)}</span>
                    </div>
                  </div>
                  <button className={`save-btn ${isSaved ? "on" : ""}`} onClick={() => setSaved(isSaved ? saved.filter((x) => x !== o.id) : [...saved, o.id])}>
                    <IconBookmark on={isSaved} />
                    <span>{isSaved ? "Saved" : "Save"}</span>
                  </button>
                </div>

                {/* HOW TO APPLY Banner */}
                <div className="apply-banner">
                  <div className="ab-left">
                    <div className="ab-icon">
                      {isEmail ? <IconEmail /> : <IconForm />}
                    </div>
                    <div>
                      <div className="ab-tag">HOW TO APPLY</div>
                      <div className="ab-text">
                        {o.instruction || (primaryLead ? `Send your application to ${primaryLead.value}` : "See post details to apply")}
                      </div>
                    </div>
                  </div>
                  <div className="ab-actions">
                    {o.apply_email && (apps[o.id] === "applied" ? <span className="applied-tag">Applied ✓</span> : !who ? <Link className="action-btn" href="/login"><span>Sign in to apply</span></Link> : !am ? <Link className="action-btn" href="/profile#apply"><span>Complete profile to apply</span></Link> : (
                      <>
                        <label className="small"><input type="checkbox" style={{ width: "auto", margin: "0 4px 0 0" }} checked={sel.includes(o.id)} disabled={!sel.includes(o.id) && sel.length >= 10} onChange={() => setSel(toggle(sel, o.id))} />Queue</label>
                        <button className="action-btn" onClick={() => setModal([o])}><IconEmail /><span>{apps[o.id] === "opened" ? "Continue applying" : "Apply"}</span></button>
                      </>
                    ))}
                    {primaryLead && (
                      <a
                        className="action-btn"
                        href={primaryLead.kind === "email" ? `mailto:${primaryLead.value}` : primaryLead.value}
                        onClick={(e) => { if (isEmail && o.apply_email && am && apps[o.id] !== "applied") { e.preventDefault(); setModal([o]); } }} // opens the filled-in template, not a blank mail
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {isEmail ? <IconEmail /> : <IconForm />}
                        <span>{isEmail ? "Email" : labelOf(primaryLead)}</span>
                      </a>
                    )}
                    <button className="toggle-btn" onClick={() => setOpen(isOpen ? "" : o.id)}>
                      <span>{isOpen ? "Hide details" : "Details"}</span>
                      <IconChevron open={isOpen} />
                    </button>
                  </div>
                </div>

                {/* Match score from resume if available */}
                {(scored.get(o.id)?.score ?? 0) > 0 && kws.length > 0 && (
                  <div className="small" style={{ margin: "4px 0 10px" }}>
                    <span className="tag" style={{ background: "#ede9fe", color: "#5b46db", fontWeight: 700 }}>
                      Match {scored.get(o.id)!.pct}%
                    </span>{" "}
                    <span className="mut">{scored.get(o.id)!.hits.slice(0, 5).join(" · ")}</span>
                  </div>
                )}

                {/* Expanded Details */}
                {isOpen && (
                  <div className="expanded-detail">
                    <h4 className="detail-heading">Job description</h4>
                    <p className="detail-text">{o.text}</p>

                    {/* Additional leads if any */}
                    {otherLeads.length > 0 && (
                      <div style={{ marginBottom: 18 }}>
                        <span className="col-label">OTHER APPLICATION LINKS</span>
                        <div className="row">
                          {otherLeads.map((l) => (
                            <a key={l.value} className="btn alt" style={{ fontSize: "0.85rem", padding: "6px 12px", wordBreak: "break-all" }} href={l.kind === "email" ? `mailto:${l.value}` : l.value} target="_blank" rel="noopener noreferrer">
                              {labelOf(l)}: {l.value}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bottom 3-column Footer: SOURCE | POSTED BY | RESEARCH */}
                    <div className="card-footer">
                      <div>
                        <span className="col-label">SOURCE</span>
                        <a
                          className="source-link"
                          href={originalLink?.value || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <IconLinkedIn />
                          <span>{srcOf(o)}</span>
                        </a>
                        {originalLink && (
                          <a
                            className="source-url"
                            href={originalLink.value}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={originalLink.value}
                          >
                            {originalLink.value}
                          </a>
                        )}
                      </div>

                      <div>
                        <span className="col-label">POSTED BY</span>
                        <div className="poster-row">
                          <div className="poster-ava">{posterInitials(o.poster)}</div>
                          <div className="poster-text">
                            Posted by {o.poster || "Hiring team"} via {o.source}
                          </div>
                        </div>
                      </div>

                      <div>
                        <span className="col-label">RESEARCH</span>
                        {researchItems.length > 0 ? (
                          <div className="research-grid">
                            {researchItems.map(([n, u]) => (
                              <a
                                key={n}
                                className="research-pill"
                                href={u}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {n.includes("LinkedIn") ? "🏢" : n.includes("Founders") ? "👥" : n.includes("Funding") ? "📊" : "⭐"}{" "}
                                <span>{n}</span>
                              </a>
                            ))}
                          </div>
                        ) : (
                          <span className="mut small">Company not specified</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
          {sel.length > 0 && <div className="queue-bar"><b>{sel.length} selected (max 10)</b><span className="row"><button className="alt" onClick={() => setSel([])}>Clear</button><button onClick={() => setModal(sel.map((id) => feed!.find((x) => x.id === id)!).filter(Boolean))}>Apply to selected →</button></span></div>}
          {shown < list.length && <button className="alt" style={{ width: "100%" }} onClick={() => setShown(shown + PAGE)}>Show more</button>}
          <p className="mut small" style={{ marginTop: 32 }}>Posts are gathered by our research agents and added as new feeds arrive. Always verify a company before sharing personal details.</p>
        </section>
      </div>
      {modal && am && <ApplyModal posts={modal} me={am} onClose={() => setModal(null)} onStatus={(id, st) => { setApps((a) => ({ ...a, [id]: st })); if (st === "applied") setSel((x) => x.filter((y) => y !== id)); }} />}
    </main>
  );
}
