import test from "node:test";
import assert from "node:assert/strict";
import { toContact, mergeContacts, phoneIn, sectorOf } from "./contacts.ts";
import type { Opp } from "./ingest.ts";

const base = { id: "a", source: "x", title: "Analyst", text: "", instruction: "", date: "", loc: "", company: "Daylight Capital", required_skills: [], leads: [], poster: "Keshav Agarwal, Founder, Daylight Capital", firstSeen: "2026-10-01T00:00:00Z" } as unknown as Opp;

test("contact needs a channel; name is cleaned; LinkedIn comes from the post URL vanity", () => {
  assert.equal(toContact(base), null);
  const c = toContact({ ...base, leads: [{ kind: "link", value: "https://www.linkedin.com/posts/keshavmagarwal_hiring-share-1-x/", domain: "linkedin.com" }] })!;
  assert.equal(c.name, "Keshav Agarwal");
  assert.equal(c.linkedin, "https://www.linkedin.com/in/keshavmagarwal");
});
test("a company poster gets no invented profile link", () => {
  const c = toContact({ ...base, poster: "HYBE INDIA", company: "HYBE INDIA", leads: [{ kind: "link", value: "https://www.linkedin.com/posts/hybe-india_x-1/", domain: "linkedin.com" }, { kind: "email", value: "hr@hybe.com", domain: "hybe.com" }] })!;
  assert.equal(c.linkedin, "");
});
test("phone and sector", () => {
  assert.equal(phoneIn("call +91 98765 43210 now"), "+91 98765 43210");
  assert.equal(sectorOf({ company: "Avendus Capital", title: "Analyst", text: "" }), "Investment Banks");
  assert.equal(sectorOf({ company: "eClerx", title: "Analyst", text: "" }), "Outsourcing");
});
test("contacts outlive their posts", () => {
  const first = mergeContacts([], [{ ...base, leads: [{ kind: "email", value: "k@d.com", domain: "d.com" }] }]);
  const later = mergeContacts(first, []);
  assert.equal(later.length, 1);
});
