import { readFileSync, writeFileSync } from "node:fs";
import { getFeed, type Opp } from "../lib/sources.ts";

const FILE = "data/feed.json";
const KEEP_MS = 30 * 864e5; // keep ~30 days
type Stored = Opp & { firstSeen: string };

let old: Stored[] = [];
try { old = JSON.parse(readFileSync(FILE, "utf8")); } catch { /* first run */ }

const fresh = await getFeed();
if (!fresh.length) throw new Error("no items fetched; keeping old data");

const now = new Date().toISOString();
const byId = new Map(old.map((o) => [o.id, o]));
for (const o of fresh) byId.set(o.id, { ...o, firstSeen: byId.get(o.id)?.firstSeen ?? now });

const cutoff = Date.now() - KEEP_MS;
const out = [...byId.values()].filter((o) => Date.parse(o.firstSeen) >= cutoff).sort((a, b) => b.date.localeCompare(a.date));
writeFileSync(FILE, "[\n" + out.map((o) => JSON.stringify(o)).join(",\n") + "\n]\n"); // one item per line = small git diffs
console.log(`${fresh.length} fetched, ${out.length} stored`);
