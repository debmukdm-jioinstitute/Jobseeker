import test from "node:test";
import assert from "node:assert/strict";
import { areaRegex, baseFilter, finish, count, modeOf, cityOf, EMPTY } from "./filter.ts";
import type { Opp } from "./ingest.ts";

const o = (id: string, title: string, loc: string, over: Partial<Opp> = {}): Opp => ({
  id, title, loc, company: "Acme", source: "Remotive", poster: "", date: new Date().toISOString(), text: "", instruction: "", leads: [], ...over,
});
const feed = [
  o("1", "FP&A Manager", "Mumbai, India"),
  o("2", "Software Engineer (Remote)", "Anywhere"),
  o("3", "Flawless Tailor", "Pune", { date: "2020-01-01T00:00:00Z" }),
];

test("areaRegex matches whole words only and expands a category", () => {
  assert.ok(areaRegex(["Finance / FP&A"])!.test("Senior FP&A Manager"));
  assert.ok(!areaRegex(["Legal / Corporate Law"])!.test("Flawless Tailor"));
  assert.ok(areaRegex(["Finance"])!.test("Equity Research Analyst"));
});

test("base + facets + counts", () => {
  assert.deepEqual(baseFilter(feed, { ...EMPTY, areas: ["Finance / FP&A"] }).map((x) => x.id), ["1"]);
  assert.deepEqual(baseFilter(feed, { ...EMPTY, where: "india" }).map((x) => x.id), ["1"]);
  assert.equal(modeOf(feed[1]), "Remote");
  assert.equal(cityOf(feed[0]), "Mumbai");
  assert.deepEqual(finish(feed, { ...EMPTY, days: 7 }, new Set()).map((x) => x.id).sort(), ["1", "2"]);
  assert.deepEqual(finish(feed, { ...EMPTY, saved: true }, new Set(["3"])).map((x) => x.id), ["3"]);
  assert.deepEqual(count(feed, modeOf)[0], ["On-site", 2]);
});
