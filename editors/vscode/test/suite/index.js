"use strict";

const assert = require("node:assert/strict");
const vscode = require("vscode");

async function waitFor(predicate, timeout = 5000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const value = predicate();
    if (value) {
      return value;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error("Timed out waiting for the extension result");
}

async function run() {
  await vscode.workspace.getConfiguration("skelc").update(
    "path",
    process.env.SKELC_PATH,
    vscode.ConfigurationTarget.Global
  );

  const extension = vscode.extensions.getExtension("yorun.vscode-skel");
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
  await new Promise((resolve) => setTimeout(resolve, 250));

  const document = await vscode.workspace.openTextDocument({
    language: "skel",
    content: "domain demo\ndata User {"
  });
  await vscode.window.showTextDocument(document);
  const diagnostics = await waitFor(() => {
    const current = vscode.languages.getDiagnostics(document.uri);
    return current.length > 0 ? current : undefined;
  });
  assert.equal(diagnostics[0].source, "skelc");
}

module.exports = { run };
