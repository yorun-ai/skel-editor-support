"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const compatibility = require("../../src/compatibility");

test("settings reads schema compatibility defaults", () => {
  const configuration = { get: (_name, fallback) => fallback };
  assert.deepEqual(compatibility.settings(configuration), {
    diagnostics: true,
    includeCompatible: false,
    codeLens: true,
    baseline: ""
  });
});

test("reportContent formats stable readable JSON", () => {
  const report = { compatible: false, summary: { breaking: 1, dangerous: 2, compatible: 3 } };
  assert.equal(JSON.parse(compatibility.reportContent(report)).compatible, false);
  assert.equal(compatibility.summary(report), "1 breaking, 2 dangerous, 3 compatible");
});

test("reportDocument identifies one reusable JSON preview", () => {
  assert.deepEqual(compatibility.reportDocument, {
    scheme: "skel-schema-compatibility",
    path: "/schema-diff.json"
  });
});
