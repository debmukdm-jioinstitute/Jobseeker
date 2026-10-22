"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import ThemeToggle from "../ThemeToggle";
import Logo from "../Logo";
import BackButton from "../BackButton";
import Bell from "../Bell";

type A = { postId: string; title: string; company: string; to: string; subject: string; cv: string; status: string; at: string };

export default function Applications() {
  const [apps, setApps] = useState<A[] | null>(null);
  const [who, setWho] = useState("");
  useEffect(() => { fetch("/api/me").then((r) => r.json()).then((m) => { setWho(m.email ?? ""); setApps(m.apps ?? []); }); }, []);
  const done = apps?.filter((a) => a.status === "applied").length ?? 0;
  return (
    <main style={{ maxWidth: 860 }}>
      <nav><Logo /><span className="row"><Bell /><BackButton fallback="/dashboard" /><ThemeToggle /><Link href="/dashboard" className="btn alt">Browse jobs</Link></span></nav>
      <h1 style={{ fontSize: "2rem" }}>My applications</h1>
      {apps && <p className="mut">{done} applied, {apps.length - done} opened but not confirmed. Quality beats quantity: founders reply to personalised applications.</p>}
      {!who && apps && <p><Link href="/login">Sign in</Link> to see your applications.</p>}
      {apps?.map((a) => (
        <div className="card" key={a.postId} style={{ marginTop: 12 }}>
          <b>{a.title}</b> <span className="mut">· {a.company || "company not stated"}</span>
          <div className="small mut">{new Date(a.at).toLocaleDateString()} · to {a.to} · CV: {a.cv} · {a.status === "applied" ? <span className="applied-tag">Applied ✓</span> : "Opened, not confirmed"}</div>
          <a className="small" href={`https://mail.google.com/mail/u/0/#search/${encodeURIComponent(`to:${a.to}`)}`} target="_blank" rel="noopener noreferrer">Open in Gmail</a>
        </div>
      ))}
      {apps?.length === 0 && who && <p className="mut">None yet. Press Apply on a post with an email address.</p>}
    </main>
  );
}
