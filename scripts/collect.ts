import { existsSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { normalize, type Opp } from "../lib/ingest.ts";

// Agents (Grok, Muse, ...) deliver JSON in two ways, both merged into data/feed.json:
//  - data/inbox/*.json: one-off drops, deleted after merging
//  - jobseeker-*.json (repo root or data/): standing files an agent keeps updating, left in place
const INBOX = "data/inbox";
const standing = [".", "data"].flatMap((d) => readdirSync(d).filter((n) => /^jobseeker-.*\.json$/.test(n)).map((n) => `${d}/${n}`));
const FILE = "data/feed.json";
const KEEP_MS = 30 * 864e5; // keep ~30 days
type Stored = Opp & { firstSeen: string };

let old: Stored[] = [];
try { old = JSON.parse(readFileSync(FILE, "utf8")); } catch { /* first run */ }
const now = new Date().toISOString();
const byId = new Map(old.map((o) => [o.id, o]));

let added = 0;
const files = [...(existsSync(INBOX) ? readdirSync(INBOX).filter((n) => n.endsWith(".json")).map((n) => `${INBOX}/${n}`) : []), ...standing];
for (const path of files) {
  const f = path.split("/").pop()!;
  try {
    const j = JSON.parse(readFileSync(path, "utf8"));
    const rows: unknown[] = Array.isArray(j) ? j : j.items ?? j.jobs ?? j.opportunities ?? [];
    const stem = f.replace(/^jobseeker-/, "").replace(/\.json$/, "").split(/[-_.\d]/)[0] || "agent"; // "muse-2026-10-19.json" -> "muse"
    for (const r of rows) {
      const o = normalize(r, stem);
      if (o) { byId.set(o.id, { ...o, firstSeen: byId.get(o.id)?.firstSeen ?? now }); added++; }
    }
    if (path.startsWith(INBOX)) unlinkSync(path);
  } catch (e) {
    console.error(`skipped ${path}: ${(e as Error).message}`); // left in place so you can see and fix it
  }
}

const cutoff = Date.now() - KEEP_MS; // age = the post's own date, so re-delivered old posts expire too
const out = [...byId.values()].filter((o) => Date.parse(o.date) >= cutoff).sort((a, b) => b.date.localeCompare(a.date));
writeFileSync(FILE, "[\n" + out.map((o) => JSON.stringify(o)).join(",\n") + "\n]\n"); // one item per line = small git diffs
console.log(`${added} ingested, ${out.length} stored`);
