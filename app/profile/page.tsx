"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { extractKeywords, match } from "@/lib/resume";
import { loadProfile, saveKeywords } from "@/lib/profile-client";
import type { Opp } from "@/lib/ingest";
import ThemeToggle from "../ThemeToggle";
import Logo from "../Logo";
import BackButton from "../BackButton";
import { readResume } from "./parse";
import ApplyProfile from "./ApplyProfile";

export default function Profile() {
  const [who, setWho] = useState("");
  const [kws, setKws] = useState<string[]>([]);
  const [feed, setFeed] = useState<Opp[]>([]);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [add, setAdd] = useState("");

  useEffect(() => {
    loadProfile().then((p) => { setWho(p.who); setKws(p.keywords); });
    fetch("/api/feed").then((r) => r.json()).then(setFeed).catch(() => {});
  }, []);

  const update = (next: string[]) => { setKws(next); saveKeywords(next, !!who); };

  async function onFile(file?: File) {
    if (!file) return;
    setBusy(true);
    setStatus(`Scanning ${file.name}…`);
    try {
      const found = extractKeywords(await readResume(file));
      if (!found.length) return setStatus("Read the file but found none of our known skills. Add keywords by hand below.");
      update(found);
      setStatus(`Found ${found.length} keywords. Review them below.`);
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const matches = kws.length ? feed.filter((o) => match(o, kws).score > 0).length : 0;
  const addKw = () => { const k = add.trim().toLowerCase().slice(0, 60); if (k && !kws.includes(k)) update([...kws, k]); setAdd(""); };

  return (
    <main style={{ maxWidth: 760 }}>
      <nav>
        <Logo />
        <span className="row">
          <BackButton fallback="/dashboard" />
          <ThemeToggle />
          <Link href="/dashboard" className="btn alt">Browse jobs</Link>
          {who && <Link href="/applications" className="btn alt">My applications</Link>}
          {!who && <Link href="/login" className="btn">Sign in</Link>}
        </span>
      </nav>

      <h1 style={{ fontSize: "2rem" }}>Your profile</h1>
      <p className="mut">{who ? `Signed in as ${who}.` : "Guest: your keywords stay on this device."} Upload your resume and we match it against every job we have.</p>

      <div className="card">
        <h2>1. Upload your resume</h2>
        <input type="file" accept=".pdf,.docx,.txt,.md" disabled={busy} onChange={(e) => onFile(e.target.files?.[0])} aria-label="Upload resume" />
        <p className="mut small">PDF, DOCX or TXT, up to 5 MB. Your resume is read inside your browser and is <b>never uploaded or stored</b>. Only the keywords we find are saved.</p>
        {status && <p role="status">{status}</p>}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2>2. Your keywords {kws.length > 0 && `(${kws.length})`}</h2>
        {kws.length === 0 ? <p className="mut">None yet. Upload a resume above, or add keywords by hand.</p> : (
          <div className="row">{kws.map((k) => <button key={k} className="chip on x" onClick={() => update(kws.filter((x) => x !== k))} aria-label={`Remove ${k}`}>{k}</button>)}</div>
        )}
        <form className="row" style={{ marginTop: 12 }} onSubmit={(e) => { e.preventDefault(); addKw(); }}>
          <input style={{ flex: 1, margin: 0 }} placeholder="Add a keyword (e.g. bloomberg)" value={add} onChange={(e) => setAdd(e.target.value)} />
          <button type="submit" className="alt">Add</button>
        </form>
        <p className="mut small">Remove anything that is not you. Matching is a keyword check, like an ATS: a title match counts more than a mention in the description.</p>
      </div>

      {kws.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <h2>3. Your matches</h2>
          <p>{feed.length ? <><b>{matches}</b> of {feed.length} jobs match your keywords.</> : "Loading jobs…"}</p>
          <Link href="/dashboard?foryou=1" className="btn">See jobs for you</Link>
        </div>
      )}
      {who ? <ApplyProfile name={who.split("@")[0]} /> : <p className="mut" style={{ marginTop: 24 }}><Link href="/login">Sign in</Link> to set up one-click apply.</p>}
    </main>
  );
}
