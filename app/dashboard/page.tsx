"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { TAXONOMY } from "@/lib/taxonomy";
import { lookups } from "@/lib/extract";
import type { Opp } from "@/lib/ingest";
import { EMPTY, ago, baseFilter, citiesOf, count, finish, labelOf, modeOf, srcOf, viaOf, type Filters } from "@/lib/filter";
import SearchBar from "../SearchBar";
import ThemeToggle from "../ThemeToggle";

const read = <T,>(k: string, d: T): T => { try { return JSON.parse(localStorage.getItem(k) ?? "") as T; } catch { return d; } };
const toggle = (a: string[], v: string) => (a.includes(v) ? a.filter((x) => x !== v) : [...a, v]);
const PAGE = 20;

function Facet({ title, items, sel, onToggle, max = 6 }: { title: string; items: [string, number][]; sel: string[]; onToggle: (v: string) => void; max?: number }) {
  const [all, setAll] = useState(false);
  if (!items.length) return null;
  return (
    <>
      <h4>{title}</h4>
      {(all ? items : items.slice(0, max)).map(([v, n]) => (
        <label className="opt" key={v}><input type="checkbox" checked={sel.includes(v)} onChange={() => onToggle(v)} /><span>{v}</span><span className="n">{n}</span></label>
      ))}
      {items.length > max && <button className="plain small" onClick={() => setAll(!all)}>{all ? "Show less" : "View more"}</button>}
    </>
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
  const [cat, setCat] = useState(Object.keys(TAXONOMY)[0]);
  const [fOpen, setFOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const me = await fetch("/api/me").then((r) => r.json()).catch(() => ({ email: null }));
      if (me.email) setWho(me.email);
      const p = new URLSearchParams(location.search);
      // Signed in: the account's saved data wins; first login after guest use adopts the device's data.
      const prefs: string[] = me.email && me.prefs?.length ? me.prefs : read("js_prefs", []);
      setF({ ...EMPTY, q: p.get("q") ?? "", where: p.get("where") ?? "", areas: p.get("area") ? [p.get("area")!] : prefs, src: p.get("src") ? [p.get("src")!] : [] });
      setSaved(me.email && me.saved?.length ? me.saved : read("js_saved", []));
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
  const list = useMemo(() => finish(base, f, new Set(saved)), [base, f, saved]);

  const active = [
    ...f.areas.map((v) => [v, () => setAreas(toggle(f.areas, v))] as const),
    ...f.mode.map((v) => [v, () => set({ mode: toggle(f.mode, v) })] as const),
    ...f.city.map((v) => [v, () => set({ city: toggle(f.city, v) })] as const),
    ...f.src.map((v) => [v, () => set({ src: toggle(f.src, v) })] as const),
    ...f.via.map((v) => ["Apply: " + v, () => set({ via: toggle(f.via, v) })] as const),
    ...(f.days ? [[`Last ${f.days} days`, () => set({ days: 0 })] as const] : []),
    ...(f.saved ? [["Saved only", () => set({ saved: false })] as const] : []),
  ];

  if (!ready) return null;
  return (
    <main>
      <nav>
        <Link href="/" className="logo"><i />Jobseeker</Link>
        <span className="row">
          <ThemeToggle />
          {who ? <><span className="mut small">{who}</span><button className="alt" onClick={out}>Sign out</button></> : <Link href="/login" className="btn">Sign in</Link>}
        </span>
      </nav>
      <SearchBar q={f.q} where={f.where} onSearch={(q, where) => set({ q, where })} />

      <details className="card" style={{ margin: "16px 0" }}>
        <summary>Choose your areas {f.areas.length > 0 && `(${f.areas.length})`}</summary>
        <div className="row" style={{ margin: "12px 0" }}>
          {Object.keys(TAXONOMY).map((c) => <button key={c} className={`chip ${c === cat ? "on" : ""}`} onClick={() => setCat(c)}>{c}</button>)}
        </div>
        <div className="row">
          {TAXONOMY[cat].map((s) => { const p = `${cat} / ${s}`; return <button key={p} className={`chip ${f.areas.includes(p) ? "on" : ""}`} onClick={() => setAreas(toggle(f.areas, p))}>{s}</button>; })}
        </div>
        {!who && <p className="mut small">Guest: areas are saved on this device. <Link href="/login">Sign in</Link> to keep them everywhere.</p>}
      </details>

      <div className="layout">
        <aside className={`card filters ${fOpen ? "open" : ""}`}>
          <h4>Posted</h4>
          {[[0, "Any time"], [1, "Last 24 hours"], [7, "Last 7 days"], [30, "Last 30 days"]].map(([d, l]) => (
            <label className="opt" key={d}><input type="radio" name="days" checked={f.days === d} onChange={() => set({ days: d as number })} /><span>{l}</span></label>
          ))}
          <Facet title="Work mode" items={count(base, modeOf)} sel={f.mode} onToggle={(v) => set({ mode: toggle(f.mode, v) })} />
          <Facet title="Source" items={count(base, srcOf)} sel={f.src} onToggle={(v) => set({ src: toggle(f.src, v) })} />
          <Facet title="Apply via" items={count(base, viaOf)} sel={f.via} onToggle={(v) => set({ via: toggle(f.via, v) })} />
          <Facet title="Location" items={count(base, citiesOf)} sel={f.city} onToggle={(v) => set({ city: toggle(f.city, v) })} />
        </aside>

        <section style={{ margin: 0 }}>
          <div className="toolbar">
            <b>{feed ? `${Math.min(shown, list.length)} of ${list.length} jobs` : "Loading latest posts…"}</b>
            <span className="row">
              <button className="alt fbtn" onClick={() => setFOpen(!fOpen)}>Filters</button>
              <button className={`chip ${f.saved ? "on" : ""}`} onClick={() => set({ saved: !f.saved })}>Saved ({feed ? saved.filter((id) => feed.some((o) => o.id === id)).length : saved.length})</button>
              <select aria-label="Sort" value={f.sort} onChange={(e) => set({ sort: e.target.value as Filters["sort"] })}>
                <option value="new">Newest</option><option value="rel">Relevance</option>
              </select>
            </span>
          </div>
          {active.length > 0 && (
            <div className="active">
              {active.map(([l, rm]) => <button key={l} className="chip on x" onClick={rm}>{l}</button>)}
              <button className="plain small" onClick={() => setF({ ...EMPTY, q: f.q, where: f.where })}>Clear all</button>
            </div>
          )}
          {err && <p className="mut">{err}</p>}
          {feed && feed.length === 0 && <div className="card"><b>No opportunities yet.</b><p className="mut">New posts appear here as soon as our agents deliver their next feed.</p></div>}
          {feed && feed.length > 0 && list.length === 0 && <div className="card"><b>No jobs match.</b><p className="mut">Remove a filter or try a broader search.</p></div>}

          {list.slice(0, shown).map((o) => {
            const isSaved = saved.includes(o.id);
            return (
              <article className="card job" key={o.id}>
                <div className="top">
                  <div className="ava">{(o.company || o.title)[0]?.toUpperCase()}</div>
                  <div style={{ minWidth: 0 }}>
                    <h3 onClick={() => setOpen(open === o.id ? "" : o.id)}>{o.company ? o.title : o.title.slice(0, 80)}</h3>
                    <div className="mut">{o.company || o.poster}</div>
                  </div>
                  <button className={`save ${isSaved ? "on" : ""}`} onClick={() => setSaved(isSaved ? saved.filter((x) => x !== o.id) : [...saved, o.id])}>{isSaved ? "Saved" : "Save"}</button>
                </div>
                <div className="meta">
                  {o.loc && <span>📍 {o.loc.slice(0, 40)}</span>}<span>{modeOf(o)}</span><span>{srcOf(o)}</span><span>{ago(o.date)}</span>
                  {o.leads.find((l) => l.kind === "link") && <a href={o.leads.find((l) => l.kind === "link")!.value} target="_blank" rel="noopener noreferrer">View original post ↗</a>}
                </div>
                {o.instruction && <div className="clamp">{o.instruction}</div>}
                <div className="leads">
                  {(o.leads.some((x) => x.kind !== "link") ? o.leads.filter((x) => x.kind !== "link") : o.leads).slice(0, 3).map((l, i) => (
                    <a key={l.value} className={`btn ${i ? "alt" : ""}`} href={l.kind === "email" ? `mailto:${l.value}` : l.value} target="_blank" rel="noopener noreferrer">{labelOf(l)}</a>
                  ))}
                  <button className="alt" onClick={() => setOpen(open === o.id ? "" : o.id)}>{open === o.id ? "Hide details" : "Details"}</button>
                </div>
                {open === o.id && (
                  <div className="detail">
                    {o.poster && <p className="mut small">Posted by {o.poster} via {o.source}</p>}
                    <p>{o.text}</p>
                    {o.leads.map((l) => <div key={l.value}><span className="tag">{labelOf(l)}</span> <a href={l.kind === "email" ? `mailto:${l.value}` : l.value} target="_blank" rel="noopener noreferrer">{l.value}</a></div>)}
                    {lookups(o.company).length > 0 && <div className="row" style={{ marginTop: 10 }}><span className="mut small">Research:</span>{lookups(o.company).map(([n, u]) => <a key={n} className="tag" href={u} target="_blank" rel="noopener noreferrer">{n}</a>)}</div>}
                  </div>
                )}
              </article>
            );
          })}
          {shown < list.length && <button className="alt" style={{ width: "100%" }} onClick={() => setShown(shown + PAGE)}>Show more</button>}
          <p className="mut small" style={{ marginTop: 32 }}>Posts are gathered by our research agents and added as new feeds arrive. Always verify a company before sharing personal details.</p>
        </section>
      </div>
    </main>
  );
}
