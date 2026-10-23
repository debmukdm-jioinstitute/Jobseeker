import { get } from "@vercel/blob";
import { emailFromToken, readUser, sessionEmail } from "@/lib/auth";

export const dynamic = "force-dynamic";

const PDF = "application/pdf", DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const send = (stream: ReadableStream, pdf: boolean, name: string) => new Response(stream, {
  headers: { "Content-Type": pdf ? PDF : DOCX, "Content-Disposition": `${pdf ? "inline" : "attachment"}; filename="${name}"`, "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex" },
});

// ?id= is the permanent public link (opaque, never expires). ?t= is the old 90-day link, still honoured. No param = the signed-in owner.
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const id = q.get("id");
  if (id) {
    if (!/^[0-9a-f]{32}$/.test(id)) return new Response("Not found", { status: 404 });
    for (const ext of ["pdf", "docx"]) {
      const r = await get(`cvs/${id}.${ext}`, { access: "private", useCache: false }).catch(() => null);
      if (r?.statusCode === 200) return send(r.stream, ext === "pdf", `CV.${ext}`);
    }
    return new Response("Not found", { status: 404 });
  }
  const t = q.get("t");
  const email = (t && emailFromToken(t)) || sessionEmail();
  const u = email ? await readUser(email) : null;
  const r = u?.cvFile ? await get(u.cvFile.key, { access: "private", useCache: false }) : null;
  if (!u?.cvFile || !r || r.statusCode !== 200) return new Response("Not found", { status: 404 });
  return send(r.stream, u.cvFile.key.endsWith(".pdf"), u.cvFile.name);
}
