import test from "node:test";
import assert from "node:assert/strict";
import { stageOf, labelOf, norm, ALL } from "./journey.ts";

test("stage follows the journey; old names still work", () => {
  assert.equal(stageOf("opened"), 0);
  assert.equal(stageOf("applied"), 1);
  assert.equal(stageOf("hr_call"), 3);
  assert.equal(stageOf("replied"), 2); // legacy
  assert.equal(norm("offer"), "selected");
  assert.equal(labelOf("interview"), "Interview scheduled");
});
test("not selected keeps the furthest step reached", () => {
  assert.equal(stageOf("rejected", [{ status: "applied", at: "" }, { status: "interview", at: "" }, { status: "rejected", at: "" }]), 4);
  assert.equal(stageOf("rejected"), 1);
  assert.ok(ALL.includes("rejected") && ALL.includes("selected"));
});
