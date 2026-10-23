"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SECTOR_NAMES, type Contact } from "@/lib/contacts";
import SiteNav from "../SiteNav";
import Avatar from "../Avatar";
import { useSite } from "../SiteProvider";

const PAGE = 36;

export default function Database() {
  const { toast } = useSite();
  const [rows, setRows] = useState<Contact[] | null>(null);
  const [locked, setLocked] = useState(false);
  const [sector, setSector] = useState("All");
  const [q, setQ] = useState("");
  const [shown, setShown] = useState(PAGE);
  useEffect(() => {
    fetch("/api/contacts").then(async (r) => { if (r.status === 401) setLocked(true); else setRows(await r.json()); }).catch(() => setRows([]));
  }, []);
  useEffect(() => setShown(PAGE), [sector, q]);

  const all = rows ?? [];
  const count = (s: string) => (s === "All" ? all.length : all.filter((c) => c.sector === s).length);
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return all.filter((c) => (sector === "All" || c.sector === sector) && (!t || `${c.name} ${c.title} ${c.company} ${c.sector}`.toLowerCase().includes(t)));
  }, [all, sector, q]);
  const copy = (v: string) => navigator.clipboard.writeText(v).then(() => toast(`Copied ${v}`), () => toast("Copy blocked by the browser."));

  return (
    <>
      <SiteNav dash />
      <main className="wrap dashwrap">
        <div className="dash-hero">
          <div>
            <h2 className="greet">The <em>Database.</em></h2>
            <p className="sub">The people behind the posts: a name, an email, a phone number and a LinkedIn profile, sorted by the kind of firm. Every contact is <b>kept</b> even after their post is deleted, so you can reach out later.</p>
          </div>
        </div>

        {locked && (
          <div className="cta" style={{ marginTop: 32 }}>
            <h2>Sign in to open the <em>Database.</em></h2>
            <p>It holds real people's contact details, so it is only for signed-in members. It takes a minute and it is free.</p>
            <div className="cta-row"><Link className="btn btn-solid" href="/login">Sign in or create an account</Link></div>
          </div>
        )}

        {!locked && (
          <>
            <div className="toolbar" style={{ position: "static", marginTop: 24 }}>
              <div className="tool-row">
                <label className="search">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
                  <input type="search" placeholder="Search name, firm, role…" autoComplete="off" value={q} onChange={(e) => setQ(e.target.value)} />
                </label>
              </div>
              <div className="tool-row chip-scroll" role="group" aria-label="Filter by sector">
                {["All", ...SECTOR_NAMES].filter((s) => s === "All" || count(s) > 0).map((s) => <button key={s} className={`chip${sector === s ? " on" : ""}`} onClick={() => setSector(s)}>{s}<span className="n">{count(s)}</span></button>)}
              </div>
            </div>

            <div className="feed-meta"><span className="count">{rows ? <>SHOWING <b>{list.length}</b> OF {all.length} CONTACTS</> : "LOADING THE DATABASE…"}</span></div>

            <div className="grid db-grid">
              {list.slice(0, shown).map((c) => (
                <article className="card" key={c.id} style={{ animation: "none" }}>
                  <div className="card-top">
                    <Avatar name={c.name} />
                    <div style={{ minWidth: 0 }}><h3>{c.name}</h3><div className="co">{[c.title, c.company].filter(Boolean).join(" · ") || "Company not stated"}</div></div>
                  </div>
                  <div className="tags"><span className="tag field">{c.sector}</span></div>
                  <div className="db-lines">
                    <div><span>Email</span>{c.email ? <><a href={`mailto:${c.email}`}>{c.email}</a><button className="save-btn" onClick={() => copy(c.email)}>Copy</button></> : <i>-</i>}</div>
                    <div><span>Phone</span>{c.phone ? <><a href={`tel:${c.phone.replace(/[^\d+]/g, "")}`}>{c.phone}</a><button className="save-btn" onClick={() => copy(c.phone)}>Copy</button></> : <i>-</i>}</div>
                    <div><span>LinkedIn</span>{c.linkedin ? <a href={c.linkedin} target="_blank" rel="noopener noreferrer">View profile ↗</a> : <i>-</i>}</div>
                  </div>
                </article>
              ))}
            </div>
            {rows && list.length === 0 && <div className="empty show"><b>No contacts here</b>Try another sector or a different search.</div>}
            {list.length > shown && <div className="more-row"><button className="chip" onClick={() => setShown(shown + PAGE)}>Show more contacts</button></div>}
          </>
        )}
      </main>
    </>
  );
}
