import { get } from "@vercel/blob";
import { emailFromToken, readUser, sessionEmail } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Served by signed link (?t=, put in application emails; 90 days) or by the owner's session.
export async function GET(req: Request) {
  const t = new URL(req.url).searchParams.get("t");
  const email = (t && emailFromToken(t)) || sessionEmail();
  const u = email ? await readUser(email) : null;
  const r = u?.cvFile ? await get(u.cvFile.key, { access: "private", useCache: false }) : null;
  if (!u?.cvFile || !r || r.statusCode !== 200) return new Response("Not found", { status: 404 });
  return new Response(r.stream, {
    headers: {
      "Content-Type": u.cvFile.key.endsWith(".pdf") ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${u.cvFile.name}"`, "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex",
    },
  });
}
