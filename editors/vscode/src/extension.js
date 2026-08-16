"use strict";

const vscode = require("vscode");
const { LanguageClient } = require("vscode-languageclient/node");
const compatibility = require("./compatibility");
const server = require("./server");

const restartCommand = "skel.restartLanguageServer";
const showOutputCommand = "skel.showLanguageServerOutput";
const installURL = "https://github.com/yorun-ai/skelc#install";

let client;
let fileEvents;
let compatibilityReportContent = "{}\n";
let compatibilityReportEmitter;
let lifecycle = Promise.resolve();

function configuredCommand() {
  return server.normalizeCommand(vscode.workspace.getConfiguration("skelc").get("path"));
}

function compatibilitySettings() {
  return compatibility.settings(vscode.workspace.getConfiguration("skelc.schemaCompatibility"));
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
        fileEvents
      },
      initializationOptions: {
        schemaCompatibility: compatibilitySettings()
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

async function showSchemaCompatibility(target) {
  if (!client) {
    void vscode.window.showErrorMessage("The Skel language server is not running.");
    return;
  }
  let documentURI = typeof target === "string" ? target : undefined;
  if (!documentURI && target && typeof target.toString === "function") {
    documentURI = target.toString();
  }
  if (!documentURI && vscode.window.activeTextEditor?.document.languageId === "skel") {
    documentURI = vscode.window.activeTextEditor.document.uri.toString();
  }
  if (!documentURI) {
    void vscode.window.showErrorMessage("Open a Skel document before checking schema compatibility.");
    return;
  }
  try {
    const report = await client.sendRequest("workspace/executeCommand", {
      command: compatibility.executeCommand,
      arguments: [documentURI]
    });
    const reportURI = vscode.Uri.from(compatibility.reportDocument);
    compatibilityReportContent = compatibility.reportContent(report);
    compatibilityReportEmitter.fire(reportURI);
    let document = await vscode.workspace.openTextDocument(reportURI);
    if (document.languageId !== "json") {
      document = await vscode.languages.setTextDocumentLanguage(document, "json");
    }
    await vscode.window.showTextDocument(document, { preview: true, preserveFocus: false });
    void vscode.window.showInformationMessage(`Skel schema compatibility: ${compatibility.summary(report)}.`);
    return document;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    void vscode.window.showErrorMessage(`Cannot check Skel schema compatibility: ${message}`);
  }
}

async function activate(context) {
  fileEvents = vscode.workspace.createFileSystemWatcher("**/*.skel");
  compatibilityReportEmitter = new vscode.EventEmitter();
  context.subscriptions.push(
    fileEvents,
    compatibilityReportEmitter,
    vscode.workspace.registerTextDocumentContentProvider(compatibility.reportDocument.scheme, {
      onDidChange: compatibilityReportEmitter.event,
      provideTextDocumentContent: () => compatibilityReportContent
    }),
    vscode.commands.registerCommand(restartCommand, restartClient),
    vscode.commands.registerCommand(compatibility.showCommand, showSchemaCompatibility),
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
      if (event.affectsConfiguration("skelc.schemaCompatibility") && client) {
        void client.sendNotification("workspace/didChangeConfiguration", {
          settings: { schemaCompatibility: compatibilitySettings() }
        });
      }
    })
  );
  await serialize(startClient);
}

async function deactivate() {
  await serialize(stopClient);
  fileEvents = undefined;
  compatibilityReportEmitter = undefined;
  compatibilityReportContent = "{}\n";
}

module.exports = { activate, deactivate };
