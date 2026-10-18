import test from "node:test";
import assert from "node:assert/strict";
import { htmlToText, getFeed } from "./sources.ts";

test("htmlToText keeps full href, decodes entities", () => {
  const t = htmlToText('Acme | FP&amp;A<p>Apply <a href="https:&#x2F;&#x2F;acme.com&#x2F;jobs&#x2F;1" rel="nofollow">https:&#x2F;&#x2F;acme.com&#x2F;jo...</a> or jobs@acme.com');
  assert.equal(t, "Acme | FP&A\nApply https://acme.com/jobs/1 or jobs@acme.com");
});

test("live feed returns extracted opportunities", async () => {
  const f = await getFeed();
  assert.ok(f.length > 20);
  assert.ok(f.some((o) => o.leads.some((l) => l.kind === "email")));
  assert.ok(f.every((o) => o.leads.length > 0 || o.text));
});
