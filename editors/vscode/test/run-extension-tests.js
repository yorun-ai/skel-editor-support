"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const childProcess = require("node:child_process");
const { runTests } = require("@vscode/test-electron");
const { resolveVSCodeRuntime } = require("./vscode-runtime");

async function main() {
  if (!process.env.SKELC_PATH) {
    throw new Error("SKELC_PATH must point to a skelc executable with LSP support");
  }
  const extensionDevelopmentPath = path.resolve(__dirname, "..");
  const extensionTestsPath = path.resolve(__dirname, "suite", "index.js");
  const cachePath = path.resolve(__dirname, "..", "..", "..", ".vscode-test");
  const runtime = resolveVSCodeRuntime();
  console.log(`Using ${runtime.description}`);
  const profilePath = fs.mkdtempSync(path.join(os.tmpdir(), "skel-vscode-test-"));
  try {
    const workspacePath = path.join(profilePath, "workspace");
    const sourcePath = path.join(workspacePath, "contract.skel");
    fs.mkdirSync(workspacePath, { recursive: true });
    fs.writeFileSync(sourcePath, "domain demo\ndata User { id: int }\n");
    childProcess.execFileSync("git", ["-C", workspacePath, "init", "--quiet"]);
    childProcess.execFileSync("git", ["-C", workspacePath, "add", "contract.skel"]);
    childProcess.execFileSync("git", [
      "-C", workspacePath,
      "-c", "user.name=Skel Test",
      "-c", "user.email=skel@example.com",
      "-c", "commit.gpgsign=false",
      "commit", "--quiet", "-m", "baseline"
    ]);
    await runTests({
      ...runtime.options,
      cachePath,
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: [
        "--disable-extensions",
        "--disable-workspace-trust",
        `--extensions-dir=${path.join(profilePath, "extensions")}`,
        `--user-data-dir=${path.join(profilePath, "user-data")}`,
        workspacePath
      ],
      extensionTestsEnv: { SKELC_PATH: process.env.SKELC_PATH, SKEL_SOURCE_PATH: sourcePath }
    });
  } finally {
    fs.rmSync(profilePath, { force: true, recursive: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
