import test from "node:test";
import assert from "node:assert/strict";
import { toJobs, matchScore, lifeInfo, fieldOf } from "./site.ts";
import feed from "../data/feed.json" with { type: "json" };
import type { Opp } from "./ingest.ts";

test("only finance posts inside 72h survive, each with an area and at least one ask", () => {
  const now = Date.now();
  const jobs = toJobs(feed as Opp[], now);
  assert.ok(jobs.length > 0 && jobs.length < feed.length);
  for (const j of jobs) assert.ok(j.field && j.postedH <= 72 && j.asks.length);
  assert.deepEqual(jobs.map((j) => j.postedH), jobs.map((j) => j.postedH).sort((a, b) => a - b));
});
test("area comes from title first; non-finance posts get none", () => {
  const base = { company: "X", text: "", title: "" } as Opp;
  assert.equal(fieldOf({ ...base, title: "FP&A Analyst" }), "FP&A");
  assert.equal(fieldOf({ ...base, title: "Marketing Intern", text: "social media" }), "");
});
test("match score and life bar", () => {
  const j = toJobs(feed as Opp[], Date.parse("2026-10-23T12:00:00Z"))[0];
  assert.equal(matchScore(j, new Set(), 3), null);
  assert.ok(matchScore(j, new Set(j.skills), j.expMin)! >= 90);
  assert.equal(lifeInfo(60).cls, " late");
  assert.equal(lifeInfo(0).label, "3d left");
});
