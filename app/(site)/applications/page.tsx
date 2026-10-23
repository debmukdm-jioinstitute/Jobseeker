"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ALL, JOURNEY, ORDER, labelOf, norm, stageOf, type Entry } from "@/lib/journey";
import { due, ics, relative, upcoming as upcomingOf, type Event } from "@/lib/reminders";
import SiteNav from "../SiteNav";
import { useSite, type Me } from "../SiteProvider";

type A = NonNullable<Me["apps"]>[number];
const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
const day = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const local = () => { const d = new Date(Date.now() + 864e5); d.setMinutes(0, 0, 0); return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 16); }; // tomorrow, on the hour, for the date picker

function Card({ a, onSaved }: { a: A; onSaved: (status: string) => void }) {
  const { toast } = useSite();
  const stage = stageOf(a.status, a.history), rejected = a.status === "rejected";
  const next = ORDER[stage + 1];
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(next ?? "selected");
  const [date, setDate] = useState(local());
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const needsDate = JOURNEY.find((j) => j.key === status)?.date;
  const hist: Entry[] = a.history?.length ? a.history : [{ status: a.status, at: a.at }];

  async function save(s: string) {
    setBusy(true);
    const r = await fetch("/api/apply", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ postId: a.postId, status: s, note, when: JOURNEY.find((j) => j.key === s)?.date ? date : "" }) }).catch(() => null);
    setBusy(false);
    if (!r?.ok) { toast("Could not save that update. Try again."); return; }
    setNote(""); setOpen(false); onSaved(s);
  }

  return (
    <article className="card jr-card" style={{ animation: "none" }}>
      <div className="card-top">
        <div style={{ minWidth: 0 }}><h3>{a.title}</h3><div className="co">{a.company || "Company not stated"}{a.to && ` · ${a.to}`}</div></div>
        <span className={`stage-pill ${rejected ? "sx" : `s${stage}`}`} style={{ marginLeft: "auto" }}>{labelOf(a.status).toUpperCase()}</span>
      </div>

      <ol className="jr-steps" aria-label="Progress">
        {ORDER.map((k, i) => (
          <li key={k} className={rejected && i > stage ? "x" : i < stage ? "done" : i === stage ? (rejected ? "done" : "now") : ""}>
            <i>{i < stage || (rejected && i === stage) ? "✓" : i + 1}</i><span>{labelOf(k)}</span>
          </li>
        ))}
        {rejected && <li className="x now"><i>✕</i><span>Not selected</span></li>}
      </ol>

      <div className="jr-actions">
        {!rejected && next && <button disabled={busy} onClick={() => (JOURNEY.find((j) => j.key === next)?.date ? (setStatus(next), setOpen(true)) : save(next))}>Mark: {labelOf(next)}</button>}
        <button className="alt" onClick={() => setOpen(!open)} aria-expanded={open}>{open ? "Close" : "Update status"}</button>
      </div>

      {open && (
        <form className="jr-form" onSubmit={(e) => { e.preventDefault(); save(status); }}>
          <label>Status
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {ALL.filter((k) => k !== "opened").map((k) => <option key={k} value={k}>{labelOf(k)}</option>)}
            </select>
          </label>
          {needsDate && <label>When is it?<input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} required /></label>}
          <label>Note (optional)<input value={note} maxLength={400} placeholder="Who called, what they said, what to prepare" onChange={(e) => setNote(e.target.value)} /></label>
          <button type="submit" disabled={busy}>{busy ? "Saving…" : "Save update"}</button>
        </form>
      )}

      <ul className="jr-log">
        {[...hist].reverse().map((h, i) => (
          <li key={i}>
            <b>{labelOf(h.status)}</b><span>{when(h.at)}</span>
            {h.when && <em>Scheduled for {when(h.when)}</em>}
            {h.note && <p>{h.note}</p>}
          </li>
        ))}
      </ul>
      {a.to && <a className="jr-link" href={`https://mail.google.com/mail/u/0/#search/${encodeURIComponent(`to:${a.to}`)}`} target="_blank" rel="noopener noreferrer">Open the conversation in Gmail ↗</a>}
    </article>
  );
}

export default function Applications() {
  const { me, refreshMe, toast, confetti } = useSite();
  const [filter, setFilter] = useState("all");
  const apps = me.apps ?? [];
  const stat = (a: A) => (a.status === "rejected" ? "rejected" : ORDER[stageOf(a.status, a.history)]);
  const count = (k: string) => (k === "all" ? apps.length : apps.filter((a) => stat(a) === k).length);
  const list = useMemo(() => apps.filter((a) => filter === "all" || stat(a) === filter), [apps, filter]); // eslint-disable-line react-hooks/exhaustive-deps
  const upcoming = useMemo(() => upcomingOf(apps), [apps]);
  const soon = useMemo(() => due(apps).length, [apps]);
  const toCalendar = (e: Event) => {
    const url = URL.createObjectURL(new Blob([ics(e)], { type: "text/calendar" }));
    Object.assign(document.createElement("a"), { href: url, download: `${labelOf(e.h.status)}-${e.a.title}.ics`.replace(/[^\w.-]+/g, "-") }).click();
    setTimeout(() => URL.revokeObjectURL(url), 1e4);
    toast("Calendar file ready. Open it to add the reminder to your calendar.");
  };
  const live = apps.filter((a) => ["received", "hr_call", "interview"].includes(norm(a.status))).length;

  async function saved(a: A, s: string) {
    await refreshMe();
    if (s === "selected") { confetti(); toast(`Selected for “${a.title}”: congratulations!`); } else toast(`Updated: ${labelOf(s)}.`);
  }

  return (
    <>
      <SiteNav dash />
      <main className="wrap dashwrap">
        <div className="dash-hero">
          <div>
            <h2 className="greet">Your <em>journey.</em></h2>
            <p className="sub">Every job you applied to, from the first email to the offer. Move each one along as things happen: an update arrives, an HR call gets booked, an interview is set, or you get selected. Add a date and a note at any step.</p>
          </div>
        </div>

        {!me.email && (
          <div className="cta" style={{ marginTop: 32 }}>
            <h2>Sign in to see your <em>journey.</em></h2>
            <p>Your applications are saved to your account, so you can follow them from any phone or computer.</p>
            <div className="cta-row"><Link className="btn btn-solid" href="/login">Sign in or create an account</Link></div>
          </div>
        )}

        {me.email && (
          <>
            <div className="kpis">
              <div className="kpi"><div className="k-num">{apps.length}</div><div className="k-lbl">Applications</div><div className="k-sub">Everything you have opened or sent</div></div>
              <div className="kpi"><div className="k-num">{live}</div><div className="k-lbl">In progress</div><div className="k-sub">Heard back, call or interview on the way</div></div>
              <div className="kpi"><div className="k-num">{upcoming.length}</div><div className="k-lbl">Coming up</div><div className="k-sub">{soon ? `${soon} within the next day` : "Calls and interviews still ahead"}</div></div>
              <div className="kpi"><div className="k-num">{count("selected")}</div><div className="k-lbl">Selected</div><div className="k-sub">Offers you won</div></div>
            </div>

            {upcoming.length > 0 && (
              <section className="dash-card" style={{ marginTop: 18 }} aria-label="Coming up">
                <div className="dc-head"><div><h3>Coming up</h3><p className="dc-sub">Your next calls and interviews, soonest first. Add one to your calendar and your phone rings a day and an hour before.</p></div></div>
                {upcoming.map((e) => (
                  <div className={`mini-row${e.at - Date.now() <= 24 * 36e5 ? " soon" : ""}`} key={e.a.postId + e.h.at}>
                    <div className="mr-main"><b>{labelOf(e.h.status)} <span className="rel">{relative(e.at)}</span></b><span className="mr-sub">{e.a.title}{e.a.company && ` · ${e.a.company}`} · {when(e.h.when!)}</span></div>
                    <button className="alt cal" onClick={() => toCalendar(e)}>Add to calendar</button>
                  </div>
                ))}
              </section>
            )}

            <div className="toolbar" style={{ position: "static", marginTop: 24 }}>
              <div className="tool-row chip-scroll" role="group" aria-label="Filter by status">
                {["all", ...ORDER, "rejected"].filter((k) => k === "all" || count(k) > 0).map((k) => <button key={k} className={`chip${filter === k ? " on" : ""}`} onClick={() => setFilter(k)}>{k === "all" ? "All" : labelOf(k)}<span className="n">{count(k)}</span></button>)}
              </div>
            </div>

            {apps.length === 0 && <div className="empty show"><b>No applications yet</b>Press Apply on a job in your <Link href="/dashboard" style={{ color: "var(--accent-deep)", fontWeight: 800 }}>dashboard</Link> and it shows up here, ready to track.</div>}
            <div className="jr-grid">{list.map((a) => <Card key={a.postId} a={a} onSaved={(s) => saved(a, s)} />)}</div>
            {apps.length > 0 && <p className="feed-note dash-foot-note">Applied since {day(apps[apps.length - 1].at)}. Only you can see this page.</p>}
          </>
        )}
      </main>
    </>
  );
}
