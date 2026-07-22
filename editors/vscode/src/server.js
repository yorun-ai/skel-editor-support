"use strict";

const childProcess = require("child_process");

const defaultCommand = "skelc";
const minimumVersion = "v0.9.4";

function normalizeCommand(value) {
  if (typeof value !== "string" || value.trim() === "") {
    return defaultCommand;
  }
  return value.trim();
}

function serverOptions(command) {
  return {
    command: normalizeCommand(command),
    args: ["lsp"]
  };
}

function verifyServer(command, execFile = childProcess.execFile) {
  const executable = normalizeCommand(command);
  return new Promise((resolve, reject) => {
    execFile(executable, ["version", "--output-format", "json"], { timeout: 5000 }, (error, stdout) => {
      if (error) {
        const reason = error.code === "ENOENT"
          ? "the executable was not found"
          : error.message;
        reject(new Error(`Cannot run ${executable}: ${reason}`));
        return;
      }

      let version;
      try {
        version = JSON.parse(stdout).version;
      } catch (parseError) {
        reject(new Error(`Cannot read ${executable} version: ${parseError.message}`));
        return;
      }
      if (version !== "v0.0.0-dev" && !isVersionAtLeast(version, minimumVersion)) {
        reject(new Error(`skelc ${version || "version unknown"} is unsupported; ${minimumVersion} or newer is required`));
        return;
      }
      resolve(executable);
    });
  });
}

function isVersionAtLeast(version, minimum) {
  const pattern = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/;
  const actual = pattern.exec(version || "");
  const required = pattern.exec(minimum);
  if (!actual || !required) {
    return false;
  }
  for (let index = 1; index <= 3; index++) {
    const difference = Number(actual[index]) - Number(required[index]);
    if (difference !== 0) {
      return difference > 0;
    }
  }
  return !actual[4] || Boolean(required[4]);
}

module.exports = { defaultCommand, minimumVersion, normalizeCommand, serverOptions, verifyServer };
