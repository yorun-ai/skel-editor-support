"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { runTests } = require("@vscode/test-electron");

async function main() {
  if (!process.env.SKELC_PATH) {
    throw new Error("SKELC_PATH must point to a skelc executable with LSP support");
  }
  const extensionDevelopmentPath = path.resolve(__dirname, "..");
  const extensionTestsPath = path.resolve(__dirname, "suite", "index.js");
  const cachePath = path.resolve(__dirname, "..", "..", "..", ".vscode-test");
  const profilePath = fs.mkdtempSync(path.join(os.tmpdir(), "skel-vscode-test-"));
  try {
    await runTests({
      cachePath,
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: [
        "--disable-extensions",
        `--extensions-dir=${path.join(profilePath, "extensions")}`,
        `--user-data-dir=${path.join(profilePath, "user-data")}`
      ],
      extensionTestsEnv: { SKELC_PATH: process.env.SKELC_PATH }
    });
  } finally {
    fs.rmSync(profilePath, { force: true, recursive: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
