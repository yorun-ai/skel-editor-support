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
  assert.ok(commands.includes("skel.showSchemaCompatibility"));
  await vscode.commands.executeCommand("skel.restartLanguageServer");

  await vscode.workspace.getConfiguration("skelc").update(
    "path",
    `${process.env.SKELC_PATH} `,
    vscode.ConfigurationTarget.Global
  );
  await vscode.commands.executeCommand("skel.restartLanguageServer");

  const source = await vscode.workspace.openTextDocument(vscode.Uri.file(process.env.SKEL_SOURCE_PATH));
  assert.equal(source.languageId, "skel");
  await vscode.window.showTextDocument(source);
  await replaceDocument(source, "domain demo\ndata User { id: string }\n");
  assert.equal(await source.save(), true);
  await new Promise((resolve) => setTimeout(resolve, 300));
  const firstPreview = await vscode.commands.executeCommand("skel.showSchemaCompatibility", source.uri);
  assert.ok(firstPreview);
  await waitForCompatibilityPreview(
    firstPreview,
    (report) => report.changes?.some((change) => change.message.includes("string"))
  );
  assert.equal(firstPreview.uri.toString(), "skel-schema-compatibility:/schema-diff.json");
  assert.equal(firstPreview.languageId, "json");

  await replaceDocument(source, "domain demo\ndata User { id: bool }\n");
  assert.equal(await source.save(), true);
  await new Promise((resolve) => setTimeout(resolve, 300));
  const secondPreview = await vscode.commands.executeCommand("skel.showSchemaCompatibility", source.uri);
  assert.ok(secondPreview);
  await waitForCompatibilityPreview(
    secondPreview,
    (report) => report.changes?.some((change) => change.message.includes("bool"))
  );
  assert.equal(secondPreview, firstPreview);
  assert.equal(secondPreview.uri.toString(), firstPreview.uri.toString());
}

async function replaceDocument(document, content) {
  const edit = new vscode.WorkspaceEdit();
  edit.replace(document.uri, new vscode.Range(document.positionAt(0), document.positionAt(document.getText().length)), content);
  assert.equal(await vscode.workspace.applyEdit(edit), true);
}

async function waitForCompatibilityPreview(document, accept) {
  const deadline = Date.now() + 3000;
  while (Date.now() < deadline) {
    const report = JSON.parse(document.getText());
    if (accept(report)) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error(`timed out waiting for the schema compatibility preview: ${document.getText()}`);
}

module.exports = { run };
