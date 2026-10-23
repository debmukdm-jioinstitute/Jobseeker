import { get, put } from "@vercel/blob";
import type { Contact } from "./contacts.ts";

// The Database lives in private Vercel Blob, never in the (public) repo.
const KEY = "private/contacts.json";

export async function readContacts(): Promise<Contact[]> {
  const r = await get(KEY, { access: "private", useCache: false }).catch(() => null);
  return r && r.statusCode === 200 ? await new Response(r.stream).json() : [];
}

export const writeContacts = (c: Contact[]) =>
  put(KEY, JSON.stringify(c), { access: "private", contentType: "application/json", allowOverwrite: true, addRandomSuffix: false });
