import { readUser, saveUser, sessionEmail } from "@/lib/auth";

export const dynamic = "force-dynamic";

const strs = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").map((x) => x.slice(0, 200)).slice(0, 300) : undefined);

export async function GET() {
  const email = sessionEmail();
  const u = email ? await readUser(email) : null;
  return Response.json(u ? { email: u.email, prefs: u.prefs, saved: u.saved } : { email: null });
}

export async function PUT(req: Request) {
  const email = sessionEmail();
  const u = email ? await readUser(email) : null;
  if (!u) return Response.json({ error: "Sign in first." }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  await saveUser({ ...u, prefs: strs(b.prefs) ?? u.prefs, saved: strs(b.saved) ?? u.saved });
  return Response.json({ ok: true });
}
