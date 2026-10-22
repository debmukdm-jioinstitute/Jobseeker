"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { extractKeywords, match } from "@/lib/resume";
import { loadProfile, saveKeywords } from "@/lib/profile-client";
import type { Opp } from "@/lib/ingest";
import ThemeToggle from "../ThemeToggle";
import Logo from "../Logo";
import BackButton from "../BackButton";
import Bell from "../Bell";
import { readResume } from "./parse";
import ApplyProfile from "./ApplyProfile";

export default function Profile() {
  const [who, setWho] = useState("");
  const [kws, setKws] = useState<string[]>([]);
  const [feed, setFeed] = useState<Opp[]>([]);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [add, setAdd] = useState("");

  const [fileName, setFileName] = useState("");

  useEffect(() => {
    loadProfile().then((p) => { setWho(p.who); setKws(p.keywords); });
    fetch("/api/feed").then((r) => r.json()).then(setFeed).catch(() => {});
  }, []);

  const update = (next: string[]) => { setKws(next); saveKeywords(next, !!who); };

  async function onFile(file?: File) {
    if (!file) return;
    setFileName(file.name);
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
    <main style={{ maxWidth: 840 }}>
      <nav>
        <div className="nav-left">
          <Logo />
          <ThemeToggle />
          {who && (
            <Link href="/applications" className="nav-apps-link">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
              <span>My applications</span>
            </Link>
          )}
        </div>
        <div className="nav-right">
          <BackButton fallback="/dashboard" />
          <Bell />
          <Link href="/dashboard" className="nav-profile-btn">
            Browse jobs
          </Link>
          {!who && (
            <Link href="/login" className="nav-profile-btn">
              Sign in
            </Link>
          )}
        </div>
      </nav>

      {/* Profile Header (Image 2) */}
      <div className="profile-head-row">
        <div className="profile-avatar-badge" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </div>
        <div className="profile-head-info">
          <h1>Your profile</h1>
          <p>{who ? `Signed in as ${who}.` : "Guest."} Upload your resume and we match it against every job we have.</p>
        </div>
      </div>

      {/* Upload resume section (Image 2) */}
      <div className="upload-section-title">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <line x1="10" y1="9" x2="8" y2="9"/>
        </svg>
        <span>1. Upload your resume</span>
      </div>

      <div className="upload-card-dashed">
        <div className="upload-illus" aria-hidden="true">
          <svg width="180" height="110" viewBox="0 0 180 110" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M45 78C34 78 25 69 25 58C25 48 32 40 42 39C45 25 58 15 73 15C85 15 96 22 101 32C104 30 108 29 112 29C122 29 130 37 130 47C138 49 144 56 144 64C144 73 137 80 128 80H45" fill="#f0f6ff"/>
            <path d="M120 68C115 68 111 64 111 59C111 55 114 51 119 50C120 44 126 39 133 39C138 39 143 42 145 47C147 46 149 45 151 45C155 45 159 49 159 53C163 54 165 57 165 61C165 65 162 68 158 68H120" fill="#f0f6ff"/>
            
            <g filter="drop-shadow(0 4px 12px rgba(26,115,232,0.10))">
              <path d="M72 30C72 26.6863 74.6863 24 78 24H102L116 38V82C116 85.3137 113.314 88 110 88H78C74.6863 88 72 85.3137 72 82V30Z" fill="white" stroke="#93c5fd" strokeWidth="2.5"/>
              <path d="M102 24V36C102 37.1046 102.895 38 104 38H116" stroke="#93c5fd" strokeWidth="2.5" strokeLinejoin="round"/>
              <line x1="82" y1="46" x2="102" y2="46" stroke="#93c5fd" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="82" y1="56" x2="108" y2="56" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="82" y1="66" x2="98" y2="66" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="82" y1="76" x2="104" y2="76" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round"/>
            </g>

            <line x1="114" y1="23" x2="114" y2="18" stroke="#1a73e8" strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="122" y1="26" x2="127" y2="21" stroke="#1a73e8" strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="126" y1="35" x2="131" y2="35" stroke="#1a73e8" strokeWidth="2.5" strokeLinecap="round"/>

            <circle cx="114" cy="62" r="14" fill="#1a73e8" />
            <path d="M114 68V56M114 56L109 61M114 56L119 61" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <div className="upload-action-row">
          <input
            id="resume-file-input"
            type="file"
            accept=".pdf,.docx,.txt,.md"
            disabled={busy}
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              onFile(f);
            }}
            aria-label="Upload resume"
          />
          <label htmlFor="resume-file-input" className="btn-choose-file">
            Choose file
          </label>
          <span className="no-file-text">{fileName || "No file chosen"}</span>
        </div>

        <div className="upload-legal-note">
          PDF, DOCX or TXT, up to 5 MB. Your resume is read inside your browser and is{" "}
          <span className="shield-lock">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="#1a73e8" stroke="#1a73e8" strokeWidth="1">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="M10 10v-1a2 2 0 1 1 4 0v1h1v4h-6v-4h1zm1-1a1 1 0 1 1 2 0v1h-2v-1z" fill="#fff"/>
            </svg>
            never uploaded or stored.
          </span>{" "}
          Only the keywords we find are saved.
        </div>
        {status && <p role="status" style={{ marginTop: 14, fontWeight: 600 }}>{status}</p>}
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
