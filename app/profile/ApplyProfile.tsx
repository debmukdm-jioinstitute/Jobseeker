"use client";
import { useEffect, useState } from "react";
import { PROFILE_KEYS, EMPTY_PROFILE, DEFAULT_TEMPLATE, REQUIRED, STATUSES, missingProfile, type Profile, type Template } from "@/lib/profile";
import { parseCv, entriesToText, textToEntries, type Cv } from "@/lib/cv";
import { compose } from "@/lib/compose";
import type { Opp } from "@/lib/ingest";
import { readResume } from "./parse";

const LABEL: Record<keyof Profile, string> = {
  full_name: "Full name", phone: "Phone", city: "City", linkedin_url: "LinkedIn URL", portfolio_url: "Portfolio URL", headline: "Headline (e.g. BBA Marketing student)",
  status: "Current status", current_role: "Current role", college: "College", degree: "Degree", graduation_year: "Graduation year", experience_years: "Years of experience",
  skills: "Skills (comma separated)", preferred_roles: "Preferred roles", availability: "Availability (e.g. immediately, from June 2027)",
};
const SAMPLE = { id: "s", title: "Marketing Intern", company: "Acme", poster: "Priya Shah, Founder", poster_name: "Priya Shah", apply_email: "priya@acme.com", required_skills: ["marketing", "excel"], leads: [], instruction: "", text: "", source: "", date: "", loc: "" } as Opp;
const put = (body: object) => fetch("/api/me", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.ok);

// Signed-in only: the data that powers one-click apply (about you, CV, email template).
export default function ApplyProfile({ name }: { name: string }) {
  const [p, setP] = useState<Profile>({ ...EMPTY_PROFILE, full_name: "" });
  const [cv, setCv] = useState<Cv | null>(null);
  const [tpl, setTpl] = useState<Template>(DEFAULT_TEMPLATE);
  const [file, setFile] = useState<{ name: string; size: number } | null>(null);
  const [msg, setMsg] = useState("");
  const [link, setLink] = useState("");

  useEffect(() => {
    fetch("/api/me").then((r) => r.json()).then((m) => {
      if (m.profile) setP(m.profile);
      if (m.cv) setCv(m.cv);
      if (m.template) setTpl(m.template);
      setFile(m.cvFile); setLink(m.cvLink ?? "");
    });
  }, []);

  const missing = missingProfile(p);
  const ready = !missing.length && !!cv && !!file;
  const saveAbout = async () => setMsg(missing.length ? `Still needed: ${missing.map((k) => LABEL[k].split(" (")[0]).join(", ")}.` : (await put({ profile: p })) ? "Profile saved." : "Could not save.");

  async function upload(f?: File) {
    if (!f) return;
    setMsg(`Reading ${f.name}…`);
    try {
      const parsed = parseCv(await readResume(f));
      const fd = new FormData(); fd.append("file", f);
      const r = await fetch("/api/cv", { method: "POST", body: fd });
      if (!r.ok) return setMsg((await r.json().catch(() => ({}))).error ?? "Upload failed.");
      await put({ cv: parsed });
      setCv(parsed); setFile({ name: f.name, size: f.size });
      setMsg("CV stored privately and read. Check what we found below and fix anything wrong.");
    } catch (e) { setMsg((e as Error).message); }
  }

  const prev = compose(p, cv, tpl, SAMPLE, link ? location.origin + link : "https://example.com/your-cv");
  const upd = (patch: Partial<Cv>) => cv && setCv({ ...cv, ...patch });

  return (
    <div id="apply" style={{ marginTop: 32 }}>
      <h2>One-click apply</h2>
      <p className="mut">Fill this once. Then every Apply button opens Gmail with a ready, personalised email{ready ? "." : ". Apply stays locked until you finish all three cards."}</p>

      <div className="card">
        <h3>A. About you {!missing.length && "✓"}</h3>
        <div style={{ display: "grid", gap: "0 12px", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))" }}>
          {PROFILE_KEYS.map((k) => (
            <label key={k} className="small">{LABEL[k]}{REQUIRED.includes(k) && " *"}
              {k === "status" ? (
                <select value={p.status} onChange={(e) => setP({ ...p, status: e.target.value })}><option value="">Select…</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
              ) : <input value={p[k] || (k === "full_name" && !p.full_name ? "" : "")} placeholder={k === "full_name" ? name : ""} onChange={(e) => setP({ ...p, [k]: e.target.value })} />}
            </label>
          ))}
        </div>
        <button onClick={saveAbout}>Save profile</button>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>B. Your CV {file && "✓"}</h3>
        <input type="file" accept=".pdf,.docx" onChange={(e) => upload(e.target.files?.[0])} aria-label="Upload CV for applying" />
        <p className="mut small">PDF or DOCX, up to 4 MB. <b>This one is stored</b> in a private folder so applications can carry a CV link. Unlike the keyword scan above, it is uploaded. {file && `Current: ${file.name}.`}</p>
        {cv && (
          <>
            <h4>What we read from your CV. Fix anything wrong.</h4>
            <label className="small">Summary<textarea rows={3} value={cv.summary} onChange={(e) => upd({ summary: e.target.value })} /></label>
            <label className="small">Skills (comma separated)<input value={cv.skills.join(", ")} onChange={(e) => upd({ skills: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} /></label>
            <label className="small">Experience (title line, then “- bullet” lines; blank line between roles)<textarea rows={8} value={entriesToText(cv.experience)} onChange={(e) => upd({ experience: textToEntries(e.target.value) })} /></label>
            <label className="small">Projects (same format)<textarea rows={5} value={entriesToText(cv.projects)} onChange={(e) => upd({ projects: textToEntries(e.target.value) })} /></label>
            <label className="small">Education (one per line)<textarea rows={3} value={cv.education.join("\n")} onChange={(e) => upd({ education: e.target.value.split("\n").map((x) => x.trim()).filter(Boolean) })} /></label>
            <button onClick={async () => setMsg((await put({ cv })) ? "CV details saved." : "Could not save.")}>Save CV details</button>
          </>
        )}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>C. Email template</h3>
        <label className="small">Subject<input value={tpl.subject} onChange={(e) => setTpl({ ...tpl, subject: e.target.value })} /></label>
        <label className="small">Body<textarea rows={14} value={tpl.body} onChange={(e) => setTpl({ ...tpl, body: e.target.value })} /></label>
        <p className="mut small">Placeholders: {"{{full_name}} {{first_name}} {{phone}} {{city}} {{linkedin_url}} {{portfolio_url}} {{headline}} {{college}} {{degree}} {{graduation_year}} {{experience_years}} {{skills}} {{availability}} {{role}} {{company}} {{poster_first_name}} {{post_hook}} {{matched_skills_line}} {{profile_sentence}} {{availability_sentence}} {{cv_link}}"}. A subject the post asks for always replaces yours.</p>
        <div className="row"><button onClick={async () => setMsg((await put({ template: tpl })) ? "Template saved." : "Could not save.")}>Save template</button><button className="alt" onClick={() => setTpl(DEFAULT_TEMPLATE)}>Reset</button></div>
        <h4>Live preview (sample post)</h4>
        {prev.missing.length > 0 && <p className="small" style={{ color: "#c0392b" }}>Unfilled: {prev.missing.join(", ")}</p>}
        <pre className="small" style={{ whiteSpace: "pre-wrap", background: "var(--acc2)", padding: 12, borderRadius: 10 }}><b>{prev.subject}</b>{"\n\n"}{prev.body}</pre>
      </div>
      {msg && <p role="status">{msg}</p>}
    </div>
  );
}
