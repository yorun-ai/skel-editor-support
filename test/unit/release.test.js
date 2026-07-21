"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { validateReleaseTag } = require("../../scripts/check-release");

test("release tag matches the package version", () => {
  assert.equal(validateReleaseTag("v0.9.0", "0.9.0"), "v0.9.0");
});

test("release tag rejects a different package version", () => {
  assert.throws(
    () => validateReleaseTag("v0.9.1", "0.9.0"),
    /expected v0\.9\.0/
  );
});
