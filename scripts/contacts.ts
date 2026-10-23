import { readFileSync, writeFileSync } from "node:fs";
import { mergeContacts, type Contact } from "../lib/contacts.ts";

// The Database: people behind the posts (name, email, phone, LinkedIn), kept forever in data/contacts.json.
// Runs after collect.ts; reads data/feed.json, so it can also be run alone to backfill.
const FILE = "data/contacts.json";
let old: Contact[] = [];
try { old = JSON.parse(readFileSync(FILE, "utf8")); } catch { /* first run */ }
const out = mergeContacts(old, JSON.parse(readFileSync("data/feed.json", "utf8")));
writeFileSync(FILE, "[\n" + out.map((c) => JSON.stringify(c)).join(",\n") + "\n]\n");
console.log(`${out.length} contacts (${out.length - old.length} new)`);
