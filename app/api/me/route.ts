import { cvKeyBase, cvLinkFor, readUser, saveUser, sessionEmail } from "@/lib/auth";
import { del, get, put } from "@vercel/blob";
import { cleanProfile, cleanTemplate } from "@/lib/profile";
import { cleanCv } from "@/lib/cv";

export const dynamic = "force-dynamic";

const strs = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").map((x) => x.slice(0, 200)).slice(0, 300) : undefined);

export async function GET() {
  const email = sessionEmail();
  const u = email ? await readUser(email) : null;
  if (!u) return Response.json({ email: null });
  if (u.cvFile && !u.cvFile.key.startsWith(cvKeyBase(u.email))) { // one-time move of an older upload onto its permanent link
    const old = await get(u.cvFile.key, { access: "private", useCache: false });
    if (old?.statusCode === 200) {
      const key = `${cvKeyBase(u.email)}.${u.cvFile.key.split(".").pop()}`;
      await put(key, old.stream, { access: "private", contentType: old.blob.contentType, allowOverwrite: true, addRandomSuffix: false });
      await del(u.cvFile.key).catch(() => {});
      await saveUser({ ...u, cvFile: { ...u.cvFile, key } });
    }
  }
  return Response.json({
    email: u.email, prefs: u.prefs, saved: u.saved, keywords: u.keywords ?? [],
    profile: u.profile ?? null, cv: u.cv ?? null, template: u.template ?? null, cvFile: u.cvFile ? { name: u.cvFile.name, size: u.cvFile.size } : null,
    cvLink: u.cvFile ? cvLinkFor(u.email) : "", apps: (u.apps ?? []).map(({ body, ...a }) => a),
  });
}

export async function PUT(req: Request) {
  const email = sessionEmail();
  const u = email ? await readUser(email) : null;
  if (!u) return Response.json({ error: "Sign in first." }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  await saveUser({
    ...u, prefs: strs(b.prefs) ?? u.prefs, saved: strs(b.saved) ?? u.saved, keywords: strs(b.keywords)?.slice(0, 60) ?? u.keywords,
    profile: b.profile ? cleanProfile(b.profile) : u.profile, cv: b.cv ? cleanCv(b.cv) : u.cv, template: b.template ? cleanTemplate(b.template) : u.template,
  });
  return Response.json({ ok: true });
}
