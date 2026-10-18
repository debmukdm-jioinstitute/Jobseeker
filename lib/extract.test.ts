import test from "node:test";
import assert from "node:assert/strict";
import { extract } from "./extract.ts";

test("extracts form, email, job link and company", () => {
  const r = extract("We're hiring at Acme Capital for FP&A. Fill the form: https://forms.gle/abc123. Or send your CV to jobs@acmecap.com. Details https://acmecap.com/careers/fpa");
  assert.deepEqual(r.leads.map((l) => l.kind), ["form", "jobpage", "email"]);
  assert.equal(r.company, "Acme Capital");
  assert.match(r.instruction, /Fill the form/);
  assert.equal(r.leads[0].value, "https://forms.gle/abc123");
});

test("falls back to domain, ignores free mail", () => {
  const r = extract("DM me or mail hr@foo.io / me@gmail.com");
  assert.equal(r.company, "foo");
});
