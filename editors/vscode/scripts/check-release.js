"use strict";

const fs = require("node:fs");
const path = require("node:path");
const manifest = require("../package.json");

function validateReleaseTag(
  tag,
  version = manifest.version,
  changelog = fs.readFileSync(path.resolve(__dirname, "..", "CHANGELOG.md"), "utf8")
) {
  const expected = `v${version}`;
  if (tag !== expected) {
    throw new Error(`release tag ${tag || "<missing>"} does not match package version ${version}; expected ${expected}`);
  }
  const escapedVersion = version.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const releaseHeading = new RegExp(`^## \\[${escapedVersion}\\] - \\d{4}-\\d{2}-\\d{2}$`, "m");
  if (!releaseHeading.test(changelog)) {
    throw new Error(`CHANGELOG.md does not contain a dated release heading for ${version}`);
  }
  return expected;
}

if (require.main === module) {
  const tag = process.argv[2] || process.env.RELEASE_TAG;
  console.log(`validated release ${validateReleaseTag(tag)}`);
}

module.exports = { validateReleaseTag };
