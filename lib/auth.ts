import { BlobPreconditionFailedError, get, put } from "@vercel/blob";
import { cookies } from "next/headers";
import { hashPassword, makeToken, readToken, userKey, verifyPassword } from "./crypto.ts";

export type User = { email: string; salt: string; hash: string; prefs: string[]; saved: string[]; keywords?: string[] };

const secret = () => {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET is not set");
  return s;
};

export async function readUser(email: string): Promise<User | null> {
  const r = await get(userKey(email), { access: "private", useCache: false });
  return r && r.statusCode === 200 ? await new Response(r.stream).json() : null;
}

export const saveUser = (u: User) =>
  put(userKey(u.email), JSON.stringify(u), { access: "private", contentType: "application/json", allowOverwrite: true, addRandomSuffix: false });

// Atomic create: a second signup for the same email fails instead of overwriting the account.
export async function createUser(email: string, pw: string): Promise<User | null> {
  const u: User = { email, ...(await hashPassword(pw)), prefs: [], saved: [] };
  try {
    await put(userKey(email), JSON.stringify(u), { access: "private", contentType: "application/json", allowOverwrite: false, addRandomSuffix: false });
    return u;
  } catch (e) {
    if (e instanceof BlobPreconditionFailedError || /already exists/i.test(String(e))) return null;
    throw e;
  }
}

export const checkPassword = (u: User | null, pw: string) =>
  // Unknown email still does the same hashing work, so timing does not reveal which emails exist.
  u ? verifyPassword(pw, u.salt, u.hash) : hashPassword(pw).then(() => false);

export const startSession = (email: string) =>
  cookies().set("js_session", makeToken(email, secret()), { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 30 * 86400 });
export const endSession = () => cookies().delete("js_session");
export const sessionEmail = () => readToken(cookies().get("js_session")?.value ?? "", secret());
