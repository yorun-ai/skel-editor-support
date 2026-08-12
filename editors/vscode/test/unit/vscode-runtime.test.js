"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { resolveVSCodeRuntime } = require("../vscode-runtime");

test("uses an explicit local VS Code executable without a managed version", () => {
  const runtime = resolveVSCodeRuntime({
    env: { VSCODE_EXECUTABLE_PATH: "/opt/code" },
    existsSync: (candidate) => candidate === "/opt/code",
    homeDir: "/home/test",
    platform: "linux"
  });
  assert.deepEqual(runtime.options, { vscodeExecutablePath: "/opt/code" });
});

test("uses a managed version only when it is explicitly requested", () => {
  const runtime = resolveVSCodeRuntime({
    env: { VSCODE_VERSION: "1.91.0" },
    existsSync: () => true,
    homeDir: "/home/test",
    platform: "linux"
  });
  assert.deepEqual(runtime.options, { version: "1.91.0" });
});

test("discovers the installed macOS VS Code executable by default", () => {
  const expected = "/Applications/Visual Studio Code.app/Contents/MacOS/Code";
  const runtime = resolveVSCodeRuntime({
    env: {},
    existsSync: (candidate) => candidate === expected,
    homeDir: "/Users/test",
    platform: "darwin"
  });
  assert.deepEqual(runtime.options, { vscodeExecutablePath: expected });
});

test("does not download implicitly when VS Code is not installed", () => {
  assert.throws(
    () => resolveVSCodeRuntime({
      env: {},
      existsSync: () => false,
      homeDir: "/home/test",
      platform: "linux"
    }),
    /No installed VS Code executable was found/
  );
});
