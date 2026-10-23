import { readUser, saveUser, sessionEmail, type App } from "@/lib/auth";
import { leftover } from "@/lib/compose";
import { ALL, norm } from "@/lib/journey";

export const dynamic = "force-dynamic";
const s = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
const iso = (v: unknown) => { const d = new Date(s(v, 40)); return isNaN(+d) ? undefined : d.toISOString(); };

// POST logs one application per (user, post). "opened" = Gmail compose was opened; "applied" = the user confirmed they sent it.
export async function POST(req: Request) {
  const email = sessionEmail();
  const u = email ? await readUser(email) : null;
  if (!u) return Response.json({ error: "Sign in first." }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const now = new Date().toISOString();
  const status = b.status === "applied" ? "applied" : "opened";
  const a: App = {
    postId: s(b.postId, 160), title: s(b.title, 200), company: s(b.company, 100), to: s(b.to, 200), subject: s(b.subject, 300), body: s(b.body, 6000),
    cv: b.cv === "original" ? "original" : "tailored", status, at: now, history: [{ status, at: now }],
  };
  if (!a.postId || (a.to && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.to))) // `to` may be empty for posts that apply by form or link
    return Response.json({ error: "Bad application." }, { status: 400 });
  if (leftover(a.subject + a.body).length) return Response.json({ error: "Email still has unfilled placeholders." }, { status: 422 });
  const apps = u.apps ?? [];
  const i = apps.findIndex((x) => x.postId === a.postId);
  if (i >= 0 && apps[i].status !== "opened") return Response.json({ ok: true, duplicate: true }); // already applied or further along
  if (i >= 0) apps[i] = { ...a, history: [...(apps[i].history ?? []), ...(status === "applied" ? a.history! : [])] };
  else apps.unshift(a);
  await saveUser({ ...u, apps: apps.slice(0, 1000) });
  return Response.json({ ok: true });
}

// PATCH moves an application to any step of its journey (forward, back, or "rejected") and records a dated entry with an optional note and schedule.
export async function PATCH(req: Request) {
  const email = sessionEmail();
  const u = email ? await readUser(email) : null;
  if (!u) return Response.json({ error: "Sign in first." }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const status = norm(s(b.status, 20));
  const apps = u.apps ?? [];
  const i = apps.findIndex((x) => x.postId === s(b.postId, 160));
  if (i < 0) return Response.json({ error: "Application not found." }, { status: 404 });
  if (!ALL.includes(status)) return Response.json({ error: "Unknown status." }, { status: 400 });
  const now = new Date().toISOString();
  const cur = apps[i];
  const entry = { status, at: now, ...(s(b.note, 400).trim() && { note: s(b.note, 400).trim() }), ...(iso(b.when) && { when: iso(b.when) }) };
  const seed = cur.history?.length ? cur.history : [{ status: norm(cur.status), at: cur.at }];
  apps[i] = { ...cur, status, at: now, history: [...seed, entry].slice(-100) };
  await saveUser({ ...u, apps });
  return Response.json({ ok: true, app: { ...apps[i], body: undefined } });
}
