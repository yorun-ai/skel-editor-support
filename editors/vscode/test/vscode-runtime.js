"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

function installedVSCodeCandidates(platform, env, homeDir) {
  if (platform === "darwin") {
    return [
      "/Applications/Visual Studio Code.app/Contents/MacOS/Code",
      "/Applications/Visual Studio Code.app/Contents/MacOS/Electron",
      path.join(homeDir, "Applications", "Visual Studio Code.app", "Contents", "MacOS", "Code"),
      path.join(homeDir, "Applications", "Visual Studio Code.app", "Contents", "MacOS", "Electron")
    ];
  }
  if (platform === "win32") {
    return [
      env.LOCALAPPDATA && path.join(env.LOCALAPPDATA, "Programs", "Microsoft VS Code", "Code.exe"),
      env.ProgramFiles && path.join(env.ProgramFiles, "Microsoft VS Code", "Code.exe")
    ].filter(Boolean);
  }
  return [
    "/usr/share/code/code",
    "/usr/lib/code/code",
    "/snap/code/current/usr/share/code/code"
  ];
}

function resolveVSCodeRuntime({
  env = process.env,
  platform = process.platform,
  existsSync = fs.existsSync,
  homeDir = os.homedir()
} = {}) {
  const explicitPath = env.VSCODE_EXECUTABLE_PATH?.trim();
  if (explicitPath) {
    const executablePath = path.resolve(explicitPath);
    if (!existsSync(executablePath)) {
      throw new Error(`VSCODE_EXECUTABLE_PATH does not exist: ${executablePath}`);
    }
    return {
      description: `local VS Code at ${executablePath}`,
      options: { vscodeExecutablePath: executablePath }
    };
  }

  const managedVersion = env.VSCODE_VERSION?.trim();
  if (managedVersion) {
    return {
      description: `managed VS Code ${managedVersion}`,
      options: { version: managedVersion }
    };
  }

  const executablePath = installedVSCodeCandidates(platform, env, homeDir)
    .find((candidate) => existsSync(candidate));
  if (!executablePath) {
    throw new Error(
      "No installed VS Code executable was found. Set VSCODE_EXECUTABLE_PATH to a local executable; set VSCODE_VERSION only when a managed download is intended."
    );
  }
  return {
    description: `installed VS Code at ${executablePath}`,
    options: { vscodeExecutablePath: executablePath }
  };
}

module.exports = { installedVSCodeCandidates, resolveVSCodeRuntime };
