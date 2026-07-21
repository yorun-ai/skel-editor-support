"use strict";

const vscode = require("vscode");
const { LanguageClient } = require("vscode-languageclient/node");

let client;

function serverOptions() {
  const configuration = vscode.workspace.getConfiguration("skelc");
  return {
    command: configuration.get("path", "skelc"),
    args: ["lsp"]
  };
}

async function activate(context) {
  client = new LanguageClient(
    "skelc",
    "Skel Language Server",
    serverOptions(),
    {
      documentSelector: [{ language: "skel", scheme: "file" }],
      synchronize: {
        fileEvents: vscode.workspace.createFileSystemWatcher("**/*.skel")
      }
    }
  );
  context.subscriptions.push(client);
  await client.start();
}

async function deactivate() {
  if (client) {
    await client.stop();
    client = undefined;
  }
}

module.exports = { activate, deactivate, serverOptions };
