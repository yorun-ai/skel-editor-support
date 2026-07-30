"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const configuration = require("../../language-configuration.json");

test("folding covers every top-level Skel declaration", async () => {
  const { entryKeywords } = await import("../../../../packages/highlight/src/language.js");
  const start = new RegExp(configuration.folding.markers.start);
  for (const keyword of entryKeywords) {
    assert.match(`${keyword} Example {`, start);
    assert.match(`pub ${keyword} Example {`, start);
  }
});
