"use strict";

const path = require("node:path");
const { runTests } = require("@vscode/test-electron");

async function main() {
  if (!process.env.SKELC_PATH) {
    throw new Error("SKELC_PATH must point to a skelc executable with LSP support");
  }
  const extensionDevelopmentPath = path.resolve(__dirname, "..");
  const extensionTestsPath = path.resolve(__dirname, "suite", "index.js");
  await runTests({
    extensionDevelopmentPath,
    extensionTestsPath,
    launchArgs: ["--disable-extensions"],
    extensionTestsEnv: { SKELC_PATH: process.env.SKELC_PATH }
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
