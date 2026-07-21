"use strict";

const manifest = require("../package.json");

function validateReleaseTag(tag, version = manifest.version) {
  const expected = `v${version}`;
  if (tag !== expected) {
    throw new Error(`release tag ${tag || "<missing>"} does not match package version ${version}; expected ${expected}`);
  }
  return expected;
}

if (require.main === module) {
  const tag = process.argv[2] || process.env.RELEASE_TAG;
  console.log(`validated release ${validateReleaseTag(tag)}`);
}

module.exports = { validateReleaseTag };
