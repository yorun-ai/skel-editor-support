"use strict";

const childProcess = require("child_process");

const defaultCommand = "skelc";

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
    execFile(executable, ["lsp", "--help"], { timeout: 5000 }, (error) => {
      if (error) {
        const reason = error.code === "ENOENT"
          ? "the executable was not found"
          : error.message;
        reject(new Error(`Cannot run ${executable} lsp: ${reason}`));
        return;
      }
      resolve(executable);
    });
  });
}

module.exports = { defaultCommand, normalizeCommand, serverOptions, verifyServer };
