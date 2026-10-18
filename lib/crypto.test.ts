import test from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword, makeToken, readToken, normEmail, userKey } from "./crypto.ts";

test("password hash verifies only the right password", async () => {
  const { salt, hash } = await hashPassword("correct horse");
  assert.ok(await verifyPassword("correct horse", salt, hash));
  assert.ok(!(await verifyPassword("wrong", salt, hash)));
  assert.notEqual((await hashPassword("correct horse")).hash, hash); // fresh salt each time
});

test("token roundtrip, tamper and expiry", () => {
  const t = makeToken("a@b.co", "s3cret", 1000, 5000);
  assert.equal(readToken(t, "s3cret", 2000), "a@b.co");
  assert.equal(readToken(t, "other", 2000), "");
  assert.equal(readToken(t, "s3cret", 7000), "");
  assert.equal(readToken(t.replace(/^./, "x"), "s3cret", 2000), "");
  assert.equal(readToken("", "s3cret"), "");
});

test("email normalisation and storage key", () => {
  assert.equal(normEmail("  Jane@Example.COM "), "jane@example.com");
  assert.equal(normEmail("nope"), "");
  assert.equal(normEmail(42), "");
  assert.match(userKey("a@b.co"), /^users\/[0-9a-f]{64}\.json$/);
});
