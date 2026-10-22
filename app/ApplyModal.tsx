"use client";
import { useState } from "react";
import Link from "next/link";
import type { Opp } from "@/lib/ingest";
import type { Profile, Template } from "@/lib/profile";
import type { Cv } from "@/lib/cv";
import { compose, leftover } from "@/lib/compose";
import { tailor, cvFilename } from "@/lib/tailor";
import { downloadCv } from "./cvpdf";

export type ApplyMe = { profile: Profile; cv: Cv; template: Template; cvLink: string; hasFile: boolean };
type Draft = { to: string; subject: string; body: string; cv: "tailored" | "original"; missing: string[] };
const enc = encodeURIComponent;
const post = (body: object) => fetch("/api/apply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.ok);

// One modal for a single post or a queue of up to 10: review, then "Send in Gmail" opens a pre-filled compose tab.
export default function ApplyModal({ posts, me, onClose, onStatus }: { posts: Opp[]; me: ApplyMe; onClose: () => void; onStatus: (id: string, s: "opened" | "applied") => void }) {
  const [i, setI] = useState(0);
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() =>
    Object.fromEntries(posts.map((o) => { const c = compose(me.profile, me.cv, me.template, o, location.origin + me.cvLink); return [o.id, { to: c.to, subject: c.subject, body: c.body, cv: "tailored" as const, missing: c.missing }]; })));
  const [sent, setSent] = useState<Record<string, boolean>>({});
  const [note, setNote] = useState("");
  const o = posts[i], d = drafts[o.id];
  const set = (p: Partial<Draft>) => setDrafts({ ...drafts, [o.id]: { ...d, ...p } });
  const left = [...leftover(d.subject + d.body), ...d.missing];
  const gmail = `https://mail.google.com/mail/?view=cm&fs=1&to=${enc(d.to)}&su=${enc(d.subject)}&body=${enc(d.body)}`;
  const entry = { postId: o.id, title: o.title, company: o.company, to: d.to, subject: d.subject, body: d.body, cv: d.cv };

  async function send() {
    window.open(gmail, "_blank", "noopener"); // must run before any await, or popup blockers stop it
    setSent({ ...sent, [o.id]: true });
    setNote("");
    if (await post({ ...entry, status: "opened" })) onStatus(o.id, "opened");
    try {
      if (d.cv === "original") Object.assign(document.createElement("a"), { href: "/api/cv/file", download: "" }).click();
      else await downloadCv(tailor(me.cv, o, me.profile.headline), me.profile, cvFilename(me.profile.full_name.split(/\s+/)[0], o.company, o.title));
    } catch { setNote("Could not build the CV PDF. The email still has a link to your CV."); }
  }
  async function applied() { if (await post({ ...entry, status: "applied" })) { onStatus(o.id, "applied"); setSent({ ...sent, [o.id]: false }); if (i < posts.length - 1) setI(i + 1); else onClose(); } }
  const copy = () => navigator.clipboard.writeText(`To: ${d.to}\nSubject: ${d.subject}\n\n${d.body}`).then(() => setNote("Copied."), () => setNote("Copy blocked by the browser."));

  return (
    <div className="modal-bg" role="dialog" aria-modal="true" aria-label="Apply" onClick={onClose}>
      <div className="card modal" onClick={(e) => e.stopPropagation()}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <b>Apply: {o.title.slice(0, 60)}{o.company && ` · ${o.company}`}{posts.length > 1 && ` (${i + 1}/${posts.length})`}</b>
          <button className="alt" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <label className="small mut">To</label>
        <input value={d.to} onChange={(e) => set({ to: e.target.value })} />
        <label className="small mut">Subject{o.subject_template && " (format set by the post)"}</label>
        <input value={d.subject} onChange={(e) => set({ subject: e.target.value })} />
        <label className="small mut">Body</label>
        <textarea rows={14} value={d.body} onChange={(e) => set({ body: e.target.value })} />
        <div className="row small" style={{ margin: "10px 0" }}>
          <b>CV:</b>
          <label><input type="radio" style={{ width: "auto", margin: "0 4px" }} checked={d.cv === "tailored"} onChange={() => set({ cv: "tailored" })} />Tailored for this role</label>
          {me.hasFile && <label><input type="radio" style={{ width: "auto", margin: "0 4px" }} checked={d.cv === "original"} onChange={() => set({ cv: "original" })} />Original file</label>}
        </div>
        <p className="mut small">The CV downloads when you press Send; attach it in Gmail. {d.cv === "tailored" && "We reordered your real CV, nothing was added."}</p>
        {left.length > 0 && <p role="alert" style={{ color: "#c0392b" }}>Fix before sending: {left.join(", ")}. <Link href="/profile">Edit profile</Link></p>}
        {gmail.length > 7500 && <p role="alert" style={{ color: "#c0392b" }}>Too long for a Gmail link. Shorten the body or use Copy email.</p>}
        <div className="row">
          <button className="alt" onClick={copy}>Copy email</button>
          <a className="btn alt" href={`mailto:${d.to}?subject=${enc(d.subject)}&body=${enc(d.body)}`}>Open in mail app</a>
          <button disabled={left.length > 0 || gmail.length > 7500} onClick={send}>Send in Gmail →</button>
        </div>
        {sent[o.id] && <p className="row" style={{ marginTop: 12 }}><span>Sent it?</span><button onClick={applied}>Mark as Applied ✓</button></p>}
        {note && <p role="status" className="small">{note}</p>}
        {posts.length > 1 && <div className="row" style={{ marginTop: 8 }}>
          <button className="alt" disabled={i === 0} onClick={() => setI(i - 1)}>← Previous</button>
          <button className="alt" disabled={i === posts.length - 1} onClick={() => setI(i + 1)}>Next →</button>
        </div>}
      </div>
    </div>
  );
}
