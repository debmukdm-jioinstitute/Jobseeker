"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Opp } from "@/lib/ingest";
import { toJobs, type Job } from "@/lib/site";
import { DEFAULT_TEMPLATE, missingProfile, type Profile } from "@/lib/profile";
import ApplyModal, { type ApplyMe } from "../ApplyModal";

export type Me = { email: string | null; profile?: Profile | null; cv?: any; cvFile?: { name: string; size: number } | null; cvLink?: string; template?: any; prefs?: string[]; saved?: string[]; apps?: { postId: string; title: string; company: string; to: string; status: string; at: string }[] };
type Ctx = {
  jobs: Job[] | null; me: Me; saved: Set<string>; toggleSave: (j: Job) => void;
  skills: Set<string>; toggleSkill: (s: string) => void; exp: number; setExp: (n: number) => void;
  areas: Set<string>; toggleArea: (a: string) => void;
  toast: (m: string) => void; confetti: () => void; apply: (j: Job) => void; refreshMe: () => Promise<void>;
};
const C = createContext<Ctx>(null as never);
export const useSite = () => useContext(C);

const read = <T,>(k: string, d: T): T => { try { return JSON.parse(localStorage.getItem(k) ?? "") as T; } catch { return d; } };
const write = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } };
const put = (body: object) => fetch("/api/me", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => {});
const flip = <T,>(s: Set<T>, v: T) => { const n = new Set(s); if (n.has(v)) n.delete(v); else n.add(v); return n; };

export function SiteProvider({ children }: { children: React.ReactNode }) {
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [me, setMe] = useState<Me>({ email: null });
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [skills, setSkills] = useState<Set<string>>(new Set());
  const [exp, setExp] = useState(3);
  const [areas, setAreas] = useState<Set<string>>(new Set());
  const [msg, setMsg] = useState("");
  const [modal, setModal] = useState<Opp[] | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const cv = useRef<HTMLCanvasElement>(null);

  const refreshMe = useCallback(async () => { setMe(await fetch("/api/me", { cache: "no-store" }).then((r) => r.json()).catch(() => ({ email: null }))); }, []);
  useEffect(() => {
    (async () => {
      const m: Me = await fetch("/api/me").then((r) => r.json()).catch(() => ({ email: null }));
      setMe(m);
      // Signed in: the account's saved data wins; a guest's choices stay on this device.
      setSaved(new Set(m.email && m.saved?.length ? m.saved : read<string[]>("js_saved", [])));
      setAreas(new Set(m.email && m.prefs?.length ? m.prefs : read<string[]>("otw_areas", ["FP&A", "Equity Research"])));
      setSkills(new Set(read<string[]>("otw_skills", [])));
      setExp(read("otw_exp", 3));
      setReady(true);
    })();
    fetch("/api/feed").then((r) => r.json()).then((f: Opp[]) => setJobs(toJobs(f))).catch(() => setJobs([]));
  }, []);

  const toast = useCallback((m: string) => { setMsg(m); clearTimeout(timer.current); timer.current = setTimeout(() => setMsg(""), 3400); }, []);
  const toggleSave = (j: Job) => {
    const n = flip(saved, j.id); setSaved(n); write("js_saved", [...n]); if (me.email) put({ saved: [...n] });
    toast(n.has(j.id) ? `Saved! You will find “${j.title}” under Jobs you are tracking in your dashboard.` : `Removed “${j.title}” from your saved jobs.`);
  };
  const toggleSkill = (s: string) => setSkills((p) => { const n = flip(p, s); write("otw_skills", [...n]); return n; });
  const changeExp = (n: number) => { setExp(n); write("otw_exp", n); };
  const toggleArea = (a: string) => { const n = flip(areas, a); setAreas(n); write("otw_areas", [...n]); if (me.email) put({ prefs: [...n] }); };

  const am: ApplyMe | null = me.profile && me.cv && me.cvFile && !missingProfile(me.profile).length
    ? { profile: me.profile, cv: me.cv, hasFile: true, cvLink: me.cvLink ?? "", template: me.template ?? DEFAULT_TEMPLATE } : null;
  // Email posts open the pre-filled apply window; everything else goes to the post's own link.
  const apply = (j: Job) => {
    if (j.apply === "email") {
      if (!me.email) { location.href = "/login"; return; }
      if (!am) { toast("Finish your profile and upload your CV to apply by email."); setTimeout(() => (location.href = "/profile"), 1400); return; }
      setModal([j.o]); return;
    }
    const l = j.o.leads.find((x) => x.kind !== "email");
    if (l) window.open(l.value, "_blank", "noopener"); else toast("This post has no link. Read the original post for how to apply.");
  };

  const confetti = useCallback(() => {
    const c = cv.current;
    if (!c || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = c.getContext("2d")!;
    c.width = innerWidth; c.height = innerHeight;
    const colors = ["#5b8def", "#2f5cc4", "#e39a2d", "#3f74d6", "#8fb4f5"];
    const parts = Array.from({ length: 110 }, (_, i) => ({ x: c.width / 2 + (Math.random() - 0.5) * c.width * 0.5, y: c.height * 0.32 + (Math.random() - 0.5) * 30, vx: (Math.random() - 0.5) * 11, vy: -(4 + Math.random() * 8), s: 5 + Math.random() * 6, r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3, c: colors[i % colors.length] }));
    let start = 0;
    const frame = (ts: number) => {
      if (!start) start = ts;
      const t = (ts - start) / 1000;
      ctx.clearRect(0, 0, c.width, c.height);
      if (t >= 1.5) return;
      for (const p of parts) {
        p.vy += 13 * 0.016; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.globalAlpha = Math.max(0, 1 - t / 1.5); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.62); ctx.restore();
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, []);

  const value = useMemo(() => ({ jobs, me, saved, toggleSave, skills, toggleSkill, exp, setExp: changeExp, areas, toggleArea, toast, confetti, apply, refreshMe }), [jobs, me, saved, skills, exp, areas]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <C.Provider value={value}>
      <div className="grain" aria-hidden="true" />
      <div id="toast" className={msg ? "show" : ""} role="status" aria-live="polite">{msg}</div>
      <canvas id="confetti" ref={cv} aria-hidden="true" />
      {ready && children}
      {modal && am && <ApplyModal posts={modal} me={am} onClose={() => setModal(null)} onStatus={() => { refreshMe(); }} />}
    </C.Provider>
  );
}
