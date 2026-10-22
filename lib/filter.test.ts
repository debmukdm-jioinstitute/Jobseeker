import test from "node:test";
import assert from "node:assert/strict";
import { areaRegex, baseFilter, finish, count, modeOf, citiesOf, labelOf, EMPTY } from "./filter.ts";
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
  assert.ok(areaRegex(["Finance", "Marketing"])!.test("Brand Marketing Manager"));
  assert.ok(areaRegex(["Finance", "Marketing"])!.test("Senior FP&A Manager"));
});

test("base + facets + counts", () => {
  assert.deepEqual(baseFilter(feed, { ...EMPTY, areas: ["Finance / FP&A"] }).map((x) => x.id), ["1"]);
  assert.deepEqual(baseFilter(feed, { ...EMPTY, where: "india" }).map((x) => x.id), ["1", "3"]) // Pune is an Indian city;
  assert.equal(modeOf(feed[1]), "Remote");
  assert.deepEqual(citiesOf(feed[0]), ["Mumbai"]);
  assert.deepEqual(finish(feed, { ...EMPTY, days: 7 }, new Set()).map((x) => x.id).sort(), ["1", "2"]);
  assert.deepEqual(finish(feed, { ...EMPTY, saved: true }, new Set(["3"])).map((x) => x.id), ["3"]);
  assert.deepEqual(count(feed, modeOf)[0], ["On-site", 2]);
});

test("locations resolve to real cities, many allowed", () => {
  const c = (loc: string) => citiesOf(o("x", "t", loc));
  assert.deepEqual(c("Koramangala, Bangalore"), ["Bengaluru"]);
  assert.deepEqual(c("Delhi, Noida, Mumbai").sort(), ["Delhi NCR", "Mumbai", "Noida"]);
  assert.ok(c("Gurgaon (Hybrid)").includes("Gurugram"));
  assert.deepEqual(c("Not stated in post"), ["Not specified"]);
  assert.deepEqual(c("Singapore"), ["Singapore"]);
});

test("area words match job-title variants", () => {
  assert.ok(areaRegex(["Finance / Accounting & Audit"])!.test("Accounts Executive"));
  assert.ok(areaRegex(["Finance / Taxation"])!.test("Tax Manager"));
  assert.ok(areaRegex(["Technology / Software Engineering"])!.test("Senior Software Engineer"));
  assert.ok(!areaRegex(["Finance / Treasury"])!.test("Treasurer-General Office Dog"));
});

test("labels: linkedin post link is named, not just Link", () => {
  assert.equal(labelOf({ kind: "link", value: "https://linkedin.com/posts/x", domain: "linkedin.com" }), "LinkedIn post");
  assert.equal(labelOf({ kind: "form", value: "https://forms.gle/a", domain: "forms.gle" }), "Apply form");
});

test('"India" also finds posts that only name an Indian city', () => {
  assert.deepEqual(baseFilter([o("1", "Analyst", "Koramangala, Bangalore"), o("2", "Analyst", "London")], { ...EMPTY, where: "India" }).map((x) => x.id), ["1"]);
});

test("freshness sort: last collected comes first, even with an older post date", () => {
  const f = [
    o("a", "A", "x", { date: "2026-10-22T00:00:00Z", firstSeen: "2026-10-22T06:00:00Z" }),
    o("b", "B", "x", { date: "2026-10-21T00:00:00Z", firstSeen: "2026-10-22T12:00:00Z" }),
    o("c", "C", "x", { date: "2026-10-22T00:00:00Z" }),
  ];
  assert.deepEqual(finish(f, { ...EMPTY, sort: "fresh" }, new Set()).map((x) => x.id), ["b", "a", "c"]);
});
