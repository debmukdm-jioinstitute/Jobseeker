import test from "node:test";
import assert from "node:assert/strict";
import { upcoming, due, relative, ics, HOUR } from "./reminders.ts";

const now = Date.parse("2026-10-24T10:00:00Z");
const at = (h: number) => new Date(now + h * HOUR).toISOString();
const apps = [
  { postId: "a", title: "FP&A, Analyst", company: "X", status: "interview", history: [{ status: "interview", at: "", when: at(3), note: "Bring ID; CFO round" }] },
  { postId: "b", title: "T", company: "", status: "hr_call", history: [{ status: "hr_call", at: "", when: at(40) }] },
  { postId: "c", title: "Old", company: "", status: "interview", history: [{ status: "interview", at: "", when: at(-5) }] },
  { postId: "d", title: "Moved on", company: "", status: "selected", history: [{ status: "interview", at: "", when: at(2) }] },
];
test("only future events of applications still at that step; soonest first", () => {
  assert.deepEqual(upcoming(apps, now).map((e) => e.a.postId), ["a", "b"]);
  assert.deepEqual(due(apps, 24 * HOUR, now).map((e) => e.a.postId), ["a"]);
});
test("relative wording", () => {
  assert.equal(relative(now + 20 * 6e4, now), "in 20 min");
  assert.equal(relative(now + 3 * HOUR, now), "in 3 h");
  assert.equal(relative(now + 30 * HOUR, now), "tomorrow");
});
test("calendar file escapes text and carries two alarms", () => {
  const f = ics(upcoming(apps, now)[0]);
  assert.match(f, /SUMMARY:Interview scheduled: FP&A\\, Analyst \(X\)/);
  assert.match(f, /DTSTART:20261024T130000Z/);
  assert.equal((f.match(/BEGIN:VALARM/g) ?? []).length, 2);
});
