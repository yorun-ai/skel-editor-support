"use strict";

const assert = require("node:assert/strict");
const childProcess = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { pathToFileURL } = require("node:url");

class LSPPeer {
  constructor(input, output) {
    this.input = input;
    this.buffer = Buffer.alloc(0);
    this.nextID = 1;
    this.pending = new Map();
    output.on("data", (chunk) => this.accept(chunk));
  }

  request(method, params) {
    const id = this.nextID++;
    this.send({ jsonrpc: "2.0", id, method, params });
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }

  notify(method, params) {
    this.send({ jsonrpc: "2.0", method, params });
  }

  send(message) {
    const body = Buffer.from(JSON.stringify(message));
    this.input.write(`Content-Length: ${body.length}\r\n\r\n`);
    this.input.write(body);
  }

  accept(chunk) {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    for (;;) {
      const headerEnd = this.buffer.indexOf("\r\n\r\n");
      if (headerEnd < 0) {
        return;
      }
      const header = this.buffer.subarray(0, headerEnd).toString("ascii");
      const match = /Content-Length:\s*(\d+)/i.exec(header);
      if (!match) {
        throw new Error(`Missing Content-Length header: ${header}`);
      }
      const length = Number(match[1]);
      const bodyStart = headerEnd + 4;
      if (this.buffer.length < bodyStart + length) {
        return;
      }
      const message = JSON.parse(this.buffer.subarray(bodyStart, bodyStart + length));
      this.buffer = this.buffer.subarray(bodyStart + length);
      if (message.id !== undefined && !message.method) {
        const pending = this.pending.get(message.id);
        if (pending) {
          this.pending.delete(message.id);
          if (message.error) {
            pending.reject(new Error(message.error.message));
          } else {
            pending.resolve(message.result);
          }
        }
      }
    }
  }
}

function waitForExit(process, timeout) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      process.kill();
      reject(new Error("skelc lsp did not exit"));
    }, timeout);
    process.once("exit", (code, signal) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`skelc lsp exited with code=${code} signal=${signal}`));
      }
    });
  });
}

test("skelc completes the LSP initialize and shutdown lifecycle", {
  skip: !process.env.SKELC_PATH
}, async () => {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "vscode-skel-lsp-"));
  const userPath = path.join(workspace, "user.skel");
  const orderPath = path.join(workspace, "order.skel");
  const userSource = "domain demo.user\n@desc(\"User account\")\ndata User {\n    id: int\n}\n";
  const orderSource = "domain demo.order\nimport demo.user\ndata Order {\nowner: user.User\n}\n";
  fs.writeFileSync(userPath, userSource);
  fs.writeFileSync(orderPath, orderSource);
  const server = childProcess.spawn(process.env.SKELC_PATH, ["lsp"], {
    stdio: ["pipe", "pipe", "pipe"]
  });
  let stderr = "";
  server.stderr.on("data", (chunk) => { stderr += chunk; });
  const peer = new LSPPeer(server.stdin, server.stdout);

  try {
    const rootURI = pathToFileURL(workspace).href;
    const initialized = await peer.request("initialize", {
      processId: process.pid,
      rootUri: rootURI,
      workspaceFolders: [{ uri: rootURI, name: "test" }],
      capabilities: {}
    });
    assert.equal(initialized.serverInfo.name, "skelc");
    assert.equal(initialized.capabilities.positionEncoding, "utf-16");
    assert.deepEqual(initialized.capabilities.completionProvider.triggerCharacters, ["."]);
    assert.equal(initialized.capabilities.hoverProvider, true);
    assert.equal(initialized.capabilities.documentFormattingProvider, true);
    assert.equal(initialized.capabilities.workspaceSymbolProvider, true);
    assert.equal(initialized.capabilities.renameProvider.prepareProvider, true);
    peer.notify("initialized", {});

    const orderURI = pathToFileURL(orderPath).href;
    peer.notify("textDocument/didOpen", {
      textDocument: { uri: orderURI, languageId: "skel", version: 1, text: orderSource }
    });

    const formatting = await peer.request("textDocument/formatting", {
      textDocument: { uri: orderURI },
      options: { tabSize: 4, insertSpaces: true }
    });
    assert.equal(formatting.length, 1);
    assert.match(formatting[0].newText, /    owner: user\.User/);

    const completion = await peer.request("textDocument/completion", {
      textDocument: { uri: orderURI },
      position: { line: 3, character: 12 },
      context: { triggerKind: 2, triggerCharacter: "." }
    });
    assert.ok(completion.some((item) => item.label === "User"));

    const hover = await peer.request("textDocument/hover", {
      textDocument: { uri: orderURI },
      position: { line: 3, character: 13 }
    });
    assert.match(hover.contents.value, /User account/);

    const symbols = await peer.request("textDocument/documentSymbol", {
      textDocument: { uri: orderURI }
    });
    assert.equal(symbols[0].name, "Order");
    assert.equal(symbols[0].children[0].name, "owner");

    const workspaceSymbols = await peer.request("workspace/symbol", { query: "owner" });
    assert.equal(workspaceSymbols[0].name, "owner");
    assert.equal(workspaceSymbols[0].containerName, "Order");

    const prepared = await peer.request("textDocument/prepareRename", {
      textDocument: { uri: orderURI },
      position: { line: 3, character: 13 }
    });
    assert.deepEqual(prepared, {
      start: { line: 3, character: 12 },
      end: { line: 3, character: 16 }
    });

    const rename = await peer.request("textDocument/rename", {
      textDocument: { uri: orderURI },
      position: { line: 3, character: 13 },
      newName: "Account"
    });
    assert.equal(rename.changes[orderURI][0].newText, "Account");
    assert.equal(rename.changes[pathToFileURL(userPath).href][0].newText, "Account");

    assert.equal(await peer.request("shutdown", null), null);
    peer.notify("exit");
    await waitForExit(server, 5000);
    assert.equal(stderr, "");
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
    if (server.exitCode === null) {
      server.kill();
    }
  }
});
