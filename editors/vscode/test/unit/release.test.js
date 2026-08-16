"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { validateReleaseTag } = require("../../scripts/check-release");

test("release tag matches the package version", () => {
  assert.equal(
    validateReleaseTag("v0.9.0", "0.9.0", "## [0.9.0] - 2026-07-21\n"),
    "v0.9.0"
  );
});

test("release tag rejects a different package version", () => {
  assert.throws(
    () => validateReleaseTag("v0.9.1", "0.9.0", "## [0.9.0] - 2026-07-21\n"),
    /expected v0\.9\.0/
  );
});

test("release tag requires a dated changelog heading", () => {
  assert.throws(
    () => validateReleaseTag("v0.9.0", "0.9.0", "## [Unreleased]\n"),
    /dated release heading for 0\.9\.0/
  );
});
