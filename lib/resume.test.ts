import test from "node:test";
import assert from "node:assert/strict";
import { extractKeywords, match } from "./resume.ts";

const RESUME = `Priya Sharma | CA, MBA (Finance)
Senior Manager FP&A at Acme. Built financial models in Excel and Power BI, owned budgeting, forecasting and variance analysis.
Led month-end close, IFRS reporting, SQL dashboards. Excel, Excel, Excel.`;

test("extracts and ranks keywords from a resume", () => {
  const k = extractKeywords(RESUME);
  for (const w of ["fp&a", "financial modelling", "excel", "power bi", "budgeting", "forecasting", "variance analysis", "ifrs", "sql", "chartered accountant", "mba"]) assert.ok(k.includes(w), w);
  assert.equal(k[0], "excel"); // most frequent first
  assert.ok(!k.includes("python"));
});

test("match counts aliases, weighs title above body", () => {
  const kws = ["fp&a", "excel", "python"];
  const m = match({ title: "Financial Planning Manager", company: "Zeta", text: "Strong Excel skills required" }, kws);
  assert.deepEqual(m.hits, ["fp&a", "excel"]); // "financial planning" is an alias of fp&a
  assert.equal(m.score, 3 + 1);
  assert.ok(m.pct > 0 && m.pct <= 100);
  assert.equal(match({ title: "Barista", company: "", text: "coffee" }, kws).hits.length, 0);
  assert.deepEqual(match({ title: "x", company: "", text: "Custom Tool" }, ["custom tool"]).hits, ["custom tool"]); // user-added keyword
});
