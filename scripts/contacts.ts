import { readFileSync } from "node:fs";
import { mergeContacts } from "../lib/contacts.ts";
import { readContacts, writeContacts } from "../lib/contactsStore.ts";

// The Database: people behind the posts (name, email, phone, LinkedIn), kept forever in private Vercel Blob.
// Runs after collect.ts (needs BLOB_READ_WRITE_TOKEN); reads data/feed.json, so it can also be run alone to backfill.
if (!process.env.BLOB_READ_WRITE_TOKEN) { console.error("BLOB_READ_WRITE_TOKEN is not set"); process.exit(1); }
const old = await readContacts();
const out = mergeContacts(old, JSON.parse(readFileSync("data/feed.json", "utf8")));
await writeContacts(out);
console.log(`${out.length} contacts (${out.length - old.length} new)`);
