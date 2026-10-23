import contacts from "@/data/contacts.json";
import { sessionEmail } from "@/lib/auth";

export const dynamic = "force-dynamic";

// The Database holds real people's contact details: signed-in users only, never sent anonymously.
export function GET() {
  let email: string | null = null;
  try { email = sessionEmail(); } catch { /* no session secret configured: treated as signed out */ }
  if (!email) return Response.json({ error: "Sign in to open the Database." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  return Response.json(contacts, { headers: { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex" } });
}
