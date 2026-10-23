import { readUser, saveUser, sessionEmail, type App } from "@/lib/auth";
import { leftover } from "@/lib/compose";

export const dynamic = "force-dynamic";
const s = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");

// Logs one application per (user, post). "opened" = Gmail compose was opened; "applied" = the user confirmed they sent it;
// "replied" / "interview" / "offer" are moved forward by the user from the dashboard tracker.
const RANK = ["opened", "applied", "replied", "interview", "offer"];
export async function POST(req: Request) {
  const email = sessionEmail();
  const u = email ? await readUser(email) : null;
  if (!u) return Response.json({ error: "Sign in first." }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const a: App = {
    postId: s(b.postId, 160), title: s(b.title, 200), company: s(b.company, 100), to: s(b.to, 200), subject: s(b.subject, 300), body: s(b.body, 6000),
    cv: b.cv === "original" ? "original" : "tailored", status: (RANK.includes(b.status) ? b.status : "opened") as App["status"], at: new Date().toISOString(),
  };
  if (!a.postId || (a.to && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.to))) // `to` may be empty for posts that apply by form or link
    return Response.json({ error: "Bad application." }, { status: 400 });
  if (leftover(a.subject + a.body).length) return Response.json({ error: "Email still has unfilled placeholders." }, { status: 422 });
  const apps = u.apps ?? [];
  const i = apps.findIndex((x) => x.postId === a.postId);
  if (i >= 0 && RANK.indexOf(apps[i].status) >= RANK.indexOf(a.status) && apps[i].status !== "opened") return Response.json({ ok: true, duplicate: true });
  if (i >= 0 && !a.body) apps[i] = { ...apps[i], status: a.status, at: a.at }; // stage moves keep the saved email
  else if (i >= 0) apps[i] = a; else apps.unshift(a);
  await saveUser({ ...u, apps: apps.slice(0, 1000) });
  return Response.json({ ok: true });
}
