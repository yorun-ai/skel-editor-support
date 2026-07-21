"use strict";

const vscode = require("vscode");
const { LanguageClient } = require("vscode-languageclient/node");
const server = require("./server");

const restartCommand = "skel.restartLanguageServer";
const showOutputCommand = "skel.showLanguageServerOutput";
const installURL = "https://github.com/yorun-ai/skelc#install";

let client;
let lifecycle = Promise.resolve();

function configuredCommand() {
  return server.normalizeCommand(vscode.workspace.getConfiguration("skelc").get("path"));
}

function createClient(command) {
  return new LanguageClient(
    "skelc",
    "Skel Language Server",
    server.serverOptions(command),
    {
      documentSelector: [
        { language: "skel", scheme: "file" },
        { language: "skel", scheme: "untitled" },
        { language: "skel", scheme: "vscode-remote" }
      ],
      synchronize: {
        fileEvents: vscode.workspace.createFileSystemWatcher("**/*.skel")
      }
    }
  );
}

function serialize(operation) {
  lifecycle = lifecycle.then(operation, operation);
  return lifecycle;
}

async function stopClient() {
  const runningClient = client;
  client = undefined;
  if (runningClient) {
    await runningClient.dispose();
  }
}

async function showStartupError(command, error) {
  const configure = "Configure skelc.path";
  const install = "Install skelc";
  const retry = "Retry";
  const selection = await vscode.window.showErrorMessage(
    `Skel language server failed to start with ${command}: ${error.message}`,
    configure,
    install,
    retry
  );
  if (selection === configure) {
    await vscode.commands.executeCommand("workbench.action.openSettings", "skelc.path");
  } else if (selection === install) {
    await vscode.env.openExternal(vscode.Uri.parse(installURL));
  } else if (selection === retry) {
    void vscode.commands.executeCommand(restartCommand);
  }
}

async function startClient() {
  const command = configuredCommand();
  try {
    await server.verifyServer(command);
    const nextClient = createClient(command);
    client = nextClient;
    await nextClient.start();
  } catch (error) {
    await stopClient();
    void showStartupError(command, error instanceof Error ? error : new Error(String(error)));
  }
}

function restartClient() {
  return serialize(async () => {
    await stopClient();
    await startClient();
  });
}

async function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand(restartCommand, restartClient),
    vscode.commands.registerCommand(showOutputCommand, () => {
      if (client) {
        client.outputChannel.show(true);
      } else {
        void vscode.window.showInformationMessage("The Skel language server is not running.");
      }
    }),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("skelc.path")) {
        void restartClient();
      }
    })
  );
  await serialize(startClient);
}

async function deactivate() {
  await serialize(stopClient);
}

module.exports = { activate, deactivate };
