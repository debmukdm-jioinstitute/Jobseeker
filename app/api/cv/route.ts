import { del, put } from "@vercel/blob";
import { cvKeyBase, readUser, saveUser, sessionEmail } from "@/lib/auth";

export const dynamic = "force-dynamic";
const MAX = 4 * 1024 * 1024; // Vercel functions reject request bodies over ~4.5 MB

// Stores the user's original CV (PDF or DOCX) privately. The parsed text is saved separately through PUT /api/me.
export async function POST(req: Request) {
  const email = sessionEmail();
  const u = email ? await readUser(email) : null;
  if (!u) return Response.json({ error: "Sign in first." }, { status: 401 });
  const file = (await req.formData().catch(() => null))?.get("file");
  if (!(file instanceof File)) return Response.json({ error: "No file." }, { status: 400 });
  if (file.size > MAX) return Response.json({ error: "CV must be 4 MB or smaller." }, { status: 413 });
  const buf = Buffer.from(await file.arrayBuffer());
  const ext = buf.subarray(0, 4).toString() === "%PDF" ? "pdf" : buf[0] === 0x50 && buf[1] === 0x4b ? "docx" : "";
  if (!ext) return Response.json({ error: "Upload a PDF or DOCX file." }, { status: 415 });
  const key = `${cvKeyBase(u.email)}.${ext}`;
  await put(key, buf, { access: "private", contentType: ext === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document", allowOverwrite: true, addRandomSuffix: false });
  if (u.cvFile && u.cvFile.key !== key) await del(u.cvFile.key).catch(() => {});
  await saveUser({ ...u, cvFile: { key, name: file.name.replace(/[^\w. -]+/g, "_").slice(0, 100) || `cv.${ext}`, size: file.size } });
  return Response.json({ ok: true });
}
