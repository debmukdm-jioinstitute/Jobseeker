import { createHash, createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

export const normEmail = (e: unknown) =>
  typeof e === "string" && e.length <= 200 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim()) ? e.trim().toLowerCase() : "";

// Permanent, unguessable public id for a user's CV link (HMAC, so knowing the email is not enough).
export const cvId = (email: string, secret: string) => createHmac("sha256", secret).update("cv:" + email).digest("hex").slice(0, 32);

export const userKey = (email: string) => `users/${createHash("sha256").update(email).digest("hex")}.json`;

// Passwords: scrypt with a random per-user salt. Never stored or logged in plain form.
export async function hashPassword(pw: string, saltHex = randomBytes(16).toString("hex")) {
  return { salt: saltHex, hash: (await scryptAsync(pw, Buffer.from(saltHex, "hex"), 64)).toString("hex") };
}
export async function verifyPassword(pw: string, salt: string, hash: string) {
  const a = Buffer.from((await hashPassword(pw, salt)).hash, "hex");
  const b = Buffer.from(hash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

// Session token: base64url("email|expiry").HMAC. Tampering or expiry => empty email.
const sign = (p: string, secret: string) => createHmac("sha256", secret).update(p).digest("base64url");
export function makeToken(email: string, secret: string, now = Date.now(), ttlMs = 30 * 864e5) {
  const p = Buffer.from(`${email}|${now + ttlMs}`).toString("base64url");
  return `${p}.${sign(p, secret)}`;
}
export function readToken(token: string, secret: string, now = Date.now()) {
  const [p, sig] = token.split(".");
  if (!p || !sig) return "";
  const a = Buffer.from(sig), b = Buffer.from(sign(p, secret));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return "";
  const [email, exp] = Buffer.from(p, "base64url").toString().split("|");
  return now < Number(exp) ? email : "";
}
