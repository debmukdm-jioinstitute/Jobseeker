"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { TAXONOMY } from "@/lib/taxonomy";
import { lookups } from "@/lib/extract";
import type { Opp } from "@/lib/sources";

const read = <T,>(k: string, d: T): T => { try { return JSON.parse(localStorage.getItem(k) ?? "") as T; } catch { return d; } };
const GENERIC = new Set(["and", "the", "management", "analysis", "services", "operations"]);
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// "Sales / SDR / BDR" -> /\b(sdr|bdr)\b/i ; whole words only, so "law" never matches "flaw"
const matcher = (p: string) => {
  const words = p.slice(p.indexOf(" / ") + 3).toLowerCase().split(/[\s/,()-]+/).filter((w) => w.length >= 3 && !GENERIC.has(w));
  return words.length ? new RegExp(`(^|[^\\w])(${words.map(esc).join("|")})($|[^\\w])`, "i") : null;
};

export default function Dashboard() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [who, setWho] = useState("Guest");
  const [prefs, setPrefs] = useState<string[]>([]); // "Category / Sub"
  const [cat, setCat] = useState(Object.keys(TAXONOMY)[0]);
  const [feed, setFeed] = useState<Opp[] | null>(null);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [all, setAll] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = (await supabase?.auth.getSession()) ?? { data: { session: null } };
      const user = data.session?.user;
      if (!user && !localStorage.getItem("js_guest")) return router.replace("/login");
      if (user) setWho(user.email ?? "You");
      setPrefs(user?.user_metadata?.prefs ?? read("js_prefs", []));
      setReady(true);
      fetch("/api/feed").then((r) => r.json()).then(setFeed).catch(() => setErr("Could not load the feed. Try again in a minute."));
    })();
  }, [router]);

  useEffect(() => { if (ready) localStorage.setItem("js_prefs", JSON.stringify(prefs)); }, [prefs, ready]);

  async function togglePref(p: string) {
    const next = prefs.includes(p) ? prefs.filter((x) => x !== p) : [...prefs, p];
    setPrefs(next);
    await supabase?.auth.updateUser({ data: { prefs: next } }); // no-op error for guests
  }

  async function out() {
    await supabase?.auth.signOut();
    localStorage.removeItem("js_guest");
    router.push("/");
  }

  const shown = useMemo(() => {
    const ms = prefs.map(matcher).filter((m): m is RegExp => !!m);
    const needle = q.toLowerCase();
    return (feed ?? []).filter((o) => {
      const hay = `${o.title} ${o.company} ${o.text}`;
      return (all || !ms.length || ms.some((m) => m.test(o.title))) && (!needle || hay.toLowerCase().includes(needle));
    }).slice(0, 100);
  }, [feed, prefs, q, all]);

  if (!ready) return null;
  const label = { form: "Apply form", email: "Email", jobpage: "Job page", link: "Link" } as const;

  return (
    <main>
      <nav><Link href="/"><b>Jobseeker</b></Link><span className="row"><span className="mut">{who}</span><button className="alt" onClick={out}>Sign out</button></span></nav>

      <div className="card">
        <h2>What are you looking for?</h2>
        <div className="row">
          {Object.keys(TAXONOMY).map((c) => <button key={c} className={`chip ${c === cat ? "on" : ""}`} onClick={() => setCat(c)}>{c}</button>)}
        </div>
        <p className="mut">{cat} → pick sub-areas. Your feed filters automatically.</p>
        <div className="row">
          {TAXONOMY[cat].map((s) => { const p = `${cat} / ${s}`; return <button key={p} className={`chip ${prefs.includes(p) ? "on" : ""}`} onClick={() => togglePref(p)}>{s}</button>; })}
        </div>
      </div>

      <h2>Live opportunities</h2>
      <div className="row">
        <input style={{ flex: 1 }} placeholder="Search company, role, keyword…" value={q} onChange={(e) => setQ(e.target.value)} />
        {prefs.length > 0 && <button className="alt" onClick={() => setAll(!all)}>{all ? "Show my areas only" : "Show everything"}</button>}
      </div>
      {!feed && !err && <p className="mut">Loading latest posts…</p>}
      {err && <p className="mut">{err}</p>}
      {feed && shown.length === 0 && <p className="mut">No match. Pick other areas or tap “Show everything”.</p>}
      <div className="grid">
        {shown.map((o) => (
          <div className="card" key={o.id}>
            <b>{o.company || o.title}</b> <span className="tag">{o.source}</span>
            {o.company && <div>{o.title}</div>}
            {o.poster && <div className="mut">posted by {o.poster}</div>}
            {o.instruction && <p>{o.instruction}</p>}
            {o.leads.slice(0, 4).map((l) => (
              <div key={l.value} style={{ overflowWrap: "anywhere" }}>
                <span className="tag">{label[l.kind]}</span>{" "}
                <a href={l.kind === "email" ? `mailto:${l.value}` : l.value} target="_blank" rel="noopener noreferrer">{l.value}</a>
              </div>
            ))}
            {o.company && (
              <div className="row" style={{ marginTop: 10 }}>
                {lookups(o.company).map(([n, u]) => <a key={n} className="tag" href={u} target="_blank" rel="noopener noreferrer">{n}</a>)}
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="mut" style={{ marginTop: 32 }}>
        Sources: <a href="https://news.ycombinator.com/submitted?id=whoishiring">Hacker News “Who is hiring”</a>,{" "}
        <a href="https://remotive.com">Remotive</a>, <a href="https://www.arbeitnow.com">Arbeitnow</a>. Refreshed every 6 hours.
      </p>
    </main>
  );
}
