import test from "node:test";
import assert from "node:assert/strict";
import { normalize } from "./ingest.ts";

test("fills leads and company from post text, tolerant field names", () => {
  const o = normalize({ role: "FP&A Lead", description: "We're hiring at Acme Capital. Fill https://forms.gle/x1 or mail jobs@acmecap.com", location: "Mumbai", url: "https://www.linkedin.com/posts/abc" }, "grok")!;
  assert.deepEqual(o.leads.map((l) => l.kind), ["link", "form", "email"]);
  assert.equal(o.company, "Acme Capital");
  assert.equal(o.source, "grok");
  assert.equal(o.loc, "Mumbai");
  assert.match(o.id, /^grok-/);
});

test("drops unsafe links, keeps given id prefix, rejects junk", () => {
  const o = normalize({ id: "LinkedIn-123", source: "LinkedIn", title: "Analyst", leads: [{ kind: "link", value: "javascript:alert(1)" }, { kind: "email", value: "not an email" }] })!;
  assert.equal(o.id, "LinkedIn-123");
  assert.equal(o.leads.length, 0);
  assert.equal(normalize(null), null);
  assert.equal(normalize({ company: "x" }), null);
});
