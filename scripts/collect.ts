import { existsSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { normalize, type Opp } from "../lib/ingest.ts";

// Agents (Grok, Muse, ...) drop JSON files in data/inbox; this merges them into data/feed.json and clears the inbox.
const INBOX = "data/inbox";
const FILE = "data/feed.json";
const KEEP_MS = 30 * 864e5; // keep ~30 days
type Stored = Opp & { firstSeen: string };

let old: Stored[] = [];
try { old = JSON.parse(readFileSync(FILE, "utf8")); } catch { /* first run */ }
const now = new Date().toISOString();
const byId = new Map(old.map((o) => [o.id, o]));

let added = 0;
for (const f of existsSync(INBOX) ? readdirSync(INBOX).filter((n) => n.endsWith(".json")) : []) {
  try {
    const j = JSON.parse(readFileSync(`${INBOX}/${f}`, "utf8"));
    const rows: unknown[] = Array.isArray(j) ? j : j.items ?? j.jobs ?? j.opportunities ?? [];
    const stem = f.replace(/\.json$/, "").split(/[-_.\d]/)[0] || "agent"; // "muse-2026-10-19.json" -> "muse"
    for (const r of rows) {
      const o = normalize(r, stem);
      if (o) { byId.set(o.id, { ...o, firstSeen: byId.get(o.id)?.firstSeen ?? now }); added++; }
    }
    unlinkSync(`${INBOX}/${f}`);
  } catch (e) {
    console.error(`skipped ${f}: ${(e as Error).message}`); // left in place so you can see and fix it
  }
}

const cutoff = Date.now() - KEEP_MS;
const out = [...byId.values()].filter((o) => Date.parse(o.firstSeen) >= cutoff).sort((a, b) => b.date.localeCompare(a.date));
writeFileSync(FILE, "[\n" + out.map((o) => JSON.stringify(o)).join(",\n") + "\n]\n"); // one item per line = small git diffs
console.log(`${added} ingested, ${out.length} stored`);
