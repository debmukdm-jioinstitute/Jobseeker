import { checkPassword, createUser, endSession, readUser, startSession } from "@/lib/auth";
import { normEmail } from "@/lib/crypto";

const fail = (error: string, status = 400) => Response.json({ error }, { status });

export async function POST(req: Request, { params }: { params: { action: string } }) {
  if (params.action === "logout") {
    endSession();
    return Response.json({ ok: true });
  }
  const b = await req.json().catch(() => ({}));
  const email = normEmail(b.email);
  const pw = typeof b.password === "string" ? b.password : "";
  if (!email) return fail("Enter a valid email.");

  if (params.action === "signup") {
    if (pw.length < 8 || pw.length > 200) return fail("Password must be 8 to 200 characters.");
    if (!(await createUser(email, pw))) return fail("That email is already registered. Sign in instead.", 409);
    startSession(email);
    return Response.json({ email });
  }
  if (params.action === "login") {
    if (pw.length > 200 || !(await checkPassword(await readUser(email), pw))) return fail("Wrong email or password.", 401);
    startSession(email);
    return Response.json({ email });
  }
  return fail("Not found", 404);
}
