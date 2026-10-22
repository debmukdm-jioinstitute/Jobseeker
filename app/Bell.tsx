"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import "./bell.css";
import type { Opp } from "@/lib/ingest";
import { ago, sectorOf } from "@/lib/filter";
import { liveAt, newest, unread } from "@/lib/notify";

const KEY = "js_bell_seen";
const get = () => { try { return Number(localStorage.getItem(KEY)) || Date.now() - 864e5; } catch { return Date.now() - 864e5; } }; // first visit: the last 24h count as new
const save = (t: number) => { try { localStorage.setItem(KEY, String(t)); } catch { /* private mode */ } };

// Posts that went live since the visitor last opened the bell. The feed is re-read every 5 minutes while the page is open.
export default function Bell() {
  const [feed, setFeed] = useState<Opp[]>([]);
  const [seen, setSeen] = useState(0);
  const [since, setSince] = useState(0); // highlight cut-off, kept while the list is open
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = get(); setSeen(t); setSince(t);
    const load = () => fetch("/api/feed", { cache: "no-store" }).then((r) => r.json()).then(setFeed).catch(() => {});
    load();
    const iv = setInterval(load, 5 * 60 * 1000);
    const away = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", away);
    return () => { clearInterval(iv); document.removeEventListener("mousedown", away); };
  }, []);

  const n = unread(feed, seen);
  function toggle() {
    if (!open) { setSince(seen); const now = Date.now(); setSeen(now); save(now); }
    setOpen(!open);
  }

  return (
    <div className="bell" ref={box}>
      <button className="bell-btn" onClick={toggle} aria-label={n ? `${n} new job posts` : "Notifications"} aria-expanded={open}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>
        {n > 0 && <span className="bell-badge">{n > 99 ? "99+" : n}</span>}
      </button>
      {open && (
        <div className="bell-pop" role="dialog" aria-label="New job posts">
          <h4>New on OpenToWork</h4>
          {feed.length === 0 && <p className="mut small" style={{ padding: 14 }}>Nothing yet.</p>}
          {newest(feed).map((o) => (
            <Link key={o.id} href={`/dashboard?q=${encodeURIComponent(o.title.slice(0, 60))}`} className={`bell-item ${liveAt(o) > since ? "new" : ""}`} onClick={() => setOpen(false)}>
              <b>{o.title.slice(0, 90)}</b>
              <div className="m">{[o.company, o.loc].filter(Boolean).join(" · ")} · {ago(new Date(liveAt(o)).toISOString())}</div>
              {sectorOf(o).slice(0, 3).map((s) => <span className="t" key={s}>{s}</span>)}
            </Link>
          ))}
          <Link href="/dashboard" className="bell-foot" onClick={() => setOpen(false)}>View all jobs</Link>
        </div>
      )}
    </div>
  );
}
