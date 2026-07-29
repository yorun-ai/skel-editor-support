"use strict";

const assert = require("node:assert/strict");
const vscode = require("vscode");

async function run() {
  await vscode.workspace.getConfiguration("skelc").update(
    "path",
    process.env.SKELC_PATH,
    vscode.ConfigurationTarget.Global
  );

  const extension = vscode.extensions.getExtension("yorun.skeleton");
  assert.ok(extension, "Skel extension is installed in the test host");
  await extension.activate();
  assert.equal(extension.isActive, true);

  const commands = await vscode.commands.getCommands(true);
  assert.ok(commands.includes("skel.restartLanguageServer"));
  assert.ok(commands.includes("skel.showLanguageServerOutput"));
  await vscode.commands.executeCommand("skel.restartLanguageServer");

  await vscode.workspace.getConfiguration("skelc").update(
    "path",
    `${process.env.SKELC_PATH} `,
    vscode.ConfigurationTarget.Global
  );
  await vscode.commands.executeCommand("skel.restartLanguageServer");
}

module.exports = { run };
