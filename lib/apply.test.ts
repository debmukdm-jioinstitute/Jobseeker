import test from "node:test";
import assert from "node:assert/strict";
import { normalize } from "./ingest.ts";
import { parseCv } from "./cv.ts";
import { compose, leftover } from "./compose.ts";
import { tailor, cvFilename } from "./tailor.ts";
import { DEFAULT_TEMPLATE, EMPTY_PROFILE, missingProfile, cleanProfile } from "./profile.ts";

const post = normalize({
  id: "1", title: "Founder's Office Intern (BBA/MBA); also Marketing Intern", company: "forensi", poster: "Amlan Sarkar, CEO, forensi",
  text: "forensi is entering a new phase. Marketing and Excel needed. Email your CV to amlan@forensi.in with subject 'Internship Application - [Role]'.",
}, "LinkedIn")!;
const me = { ...EMPTY_PROFILE, full_name: "Asha Rao", phone: "99999 11111", city: "Mumbai", headline: "BBA Marketing student", status: "student", availability: "immediately", degree: "BBA", college: "NMIMS", graduation_year: "2027", skills: "marketing, excel" };
const CV = "Asha Rao\nSUMMARY\nMarketing student.\nEXPERIENCE\nMarketing Intern, Acme\nJan 2025 – Mar 2025\n• Ran SEO campaign\n• Built Excel dashboard for sales\nEDUCATION\nBBA, NMIMS\nSKILLS\nExcel, Canva, SEO";

test("enrich reads email, verbatim subject, poster, skills, highlight", () => {
  assert.equal(post.apply_type, "email");
  assert.equal(post.apply_email, "amlan@forensi.in");
  assert.equal(post.subject_template, "Internship Application - [Role]");
  assert.equal(post.poster_name, "Amlan Sarkar");
  assert.equal(post.poster_title, "CEO");
  assert.ok(post.required_skills!.includes("excel"));
  assert.equal(post.post_highlight, "entering a new phase");
});

test("parseCv groups sections and bullets without inventing", () => {
  const cv = parseCv(CV);
  assert.equal(cv.summary, "Marketing student.");
  assert.equal(cv.experience[0].title, "Marketing Intern, Acme · Jan 2025 – Mar 2025");
  assert.deepEqual(cv.experience[0].bullets, ["Ran SEO campaign", "Built Excel dashboard for sales"]);
  assert.ok(cv.skills.includes("canva") && cv.skills.includes("excel"));
});

test("compose: post subject wins, no leftover placeholders, empty optional lines dropped", () => {
  const c = compose(me, parseCv(CV), DEFAULT_TEMPLATE, post, "https://x.test/cv");
  assert.equal(c.to, "amlan@forensi.in");
  assert.equal(c.subject, "Internship Application - Founder's Office Intern (BBA/MBA); also Marketing Intern");
  assert.deepEqual(c.missing, []);
  assert.deepEqual(leftover(c.body), []);
  assert.match(c.body, /^Dear Amlan,/);
  assert.match(c.body, /I am a BBA student at NMIMS, graduating in 2027\./);
  assert.match(c.body, /Your post mentions .*excel/i);
  assert.ok(!c.body.includes("LinkedIn:") && !c.body.includes("Portfolio:"));
});

test("compose: required field empty is reported, never faked", () => {
  const c = compose({ ...me, phone: "" }, null, DEFAULT_TEMPLATE, post);
  assert.deepEqual(c.missing, ["phone"]);
  assert.ok(!compose(me, null, DEFAULT_TEMPLATE, { ...post, required_skills: ["sap"] }).body.includes("Your post mentions"));
});

test("tailor reorders only; same facts", () => {
  const cv = parseCv(CV);
  const t = tailor({ ...cv, skills: ["canva", "excel", "seo"] }, post, me.headline);
  assert.equal(t.skills[0], "excel");
  assert.deepEqual([...t.skills].sort(), ["canva", "excel", "seo"]);
  assert.deepEqual(t.experience[0].bullets.sort(), cv.experience[0].bullets.sort());
  assert.match(t.summary, /Strengths for this role: excel/);
  assert.equal(cvFilename("Asha", "forensi", "Marketing Intern"), "Asha-CV-forensi-Marketing-Intern.pdf");
});

test("profile completeness and url cleaning", () => {
  assert.deepEqual(missingProfile(me), []);
  assert.ok(missingProfile(EMPTY_PROFILE).includes("full_name"));
  assert.equal(cleanProfile({ linkedin_url: "javascript:alert(1)" }).linkedin_url, "");
  assert.equal(cleanProfile({ linkedin_url: "linkedin.com/in/asha" }).linkedin_url, "https://linkedin.com/in/asha");
});

test("enrich keeps apostrophes inside a quoted subject", () => {
  const o = normalize({ id: "2", title: "FO", text: 'Email us with the subject line "Founder\'s Office".' }, "x")!;
  assert.equal(o.subject_template, "Founder's Office");
});
