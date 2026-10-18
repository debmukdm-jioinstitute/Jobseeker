"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { TAXONOMY } from "@/lib/taxonomy";
import { extract, lookups, type Extracted } from "@/lib/extract";

type Opp = Extracted & { id: number; area: string; text: string; poster: string };
const read = <T,>(k: string, d: T): T => { try { return JSON.parse(localStorage.getItem(k) ?? "") as T; } catch { return d; } };

export default function Dashboard() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [who, setWho] = useState("Guest");
  const [prefs, setPrefs] = useState<string[]>([]); // "Category / Sub"
  const [cat, setCat] = useState(Object.keys(TAXONOMY)[0]);
  const [opps, setOpps] = useState<Opp[]>([]);
  const [text, setText] = useState("");
  const [poster, setPoster] = useState("");
  const [area, setArea] = useState("");
  const [filter, setFilter] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = (await supabase?.auth.getSession()) ?? { data: { session: null } };
      const user = data.session?.user;
      if (!user && !localStorage.getItem("js_guest")) return router.replace("/login");
      if (user) { setWho(user.email ?? "You"); setPrefs(user.user_metadata?.prefs ?? read("js_prefs", [])); }
      else setPrefs(read("js_prefs", []));
      setOpps(read("js_opps", []));
      setReady(true);
    })();
  }, [router]);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem("js_prefs", JSON.stringify(prefs));
    localStorage.setItem("js_opps", JSON.stringify(opps));
  }, [prefs, opps, ready]);

  async function togglePref(p: string) {
    const next = prefs.includes(p) ? prefs.filter((x) => x !== p) : [...prefs, p];
    setPrefs(next);
    await supabase?.auth.updateUser({ data: { prefs: next } }); // no-op error for guests
  }

  function add() {
    if (!text.trim()) return;
    setOpps([{ ...extract(text), id: Date.now(), area, text, poster }, ...opps]);
    setText(""); setPoster("");
  }

  async function out() {
    await supabase?.auth.signOut();
    localStorage.removeItem("js_guest");
    router.push("/");
  }

  if (!ready) return null;
  const shown = filter ? opps.filter((o) => o.area === filter) : opps;
  const label = { form: "Apply form", email: "Email", jobpage: "Job page", link: "Link" } as const;

  return (
    <main>
      <nav><Link href="/"><b>Jobseeker</b></Link><span className="row"><span className="mut">{who}</span><button className="alt" onClick={out}>Sign out</button></span></nav>

      <div className="card">
        <h2>1. What are you looking for?</h2>
        <div className="row">
          {Object.keys(TAXONOMY).map((c) => <button key={c} className={`chip ${c === cat ? "on" : ""}`} onClick={() => setCat(c)}>{c}</button>)}
        </div>
        <p className="mut">{cat} → pick sub-areas</p>
        <div className="row">
          {TAXONOMY[cat].map((s) => { const p = `${cat} / ${s}`; return <button key={p} className={`chip ${prefs.includes(p) ? "on" : ""}`} onClick={() => togglePref(p)}>{s}</button>; })}
        </div>
      </div>

      <div className="card">
        <h2>2. Add a hiring post</h2>
        <p className="mut">Paste the post text (copy from LinkedIn). Links, emails and instructions are extracted.</p>
        <textarea rows={5} placeholder="Paste post text…" value={text} onChange={(e) => setText(e.target.value)} />
        <div className="row">
          <input style={{ flex: 1 }} placeholder="Posted by (optional)" value={poster} onChange={(e) => setPoster(e.target.value)} />
          <select style={{ flex: 1 }} value={area} onChange={(e) => setArea(e.target.value)}>
            <option value="">Area (optional)</option>
            {prefs.map((p) => <option key={p}>{p}</option>)}
          </select>
          <button onClick={add}>Extract</button>
        </div>
      </div>

      <h2>3. Opportunities</h2>
      {prefs.length > 0 && (
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All areas</option>
          {prefs.map((p) => <option key={p}>{p}</option>)}
        </select>
      )}
      {shown.length === 0 && <p className="mut">Nothing yet. Add a post above.</p>}
      <div className="grid">
        {shown.map((o) => (
          <div className="card" key={o.id}>
            <b>{o.company || "Unknown company"}</b> {o.area && <span className="tag">{o.area}</span>}
            {o.poster && <div className="mut">by {o.poster}</div>}
            {o.instruction && <p>{o.instruction}</p>}
            {o.leads.map((l) => (
              <div key={l.value}>
                <span className="tag">{label[l.kind]}</span>{" "}
                <a href={l.kind === "email" ? `mailto:${l.value}` : l.value} target="_blank" rel="noopener noreferrer">{l.value}</a>
              </div>
            ))}
            {o.company && (
              <div className="row" style={{ marginTop: 10 }}>
                {lookups(o.company).map(([n, u]) => <a key={n} className="tag" href={u} target="_blank" rel="noopener noreferrer">{n}</a>)}
              </div>
            )}
            <button className="alt" style={{ marginTop: 10 }} onClick={() => setOpps(opps.filter((x) => x.id !== o.id))}>Remove</button>
          </div>
        ))}
      </div>
    </main>
  );
}
