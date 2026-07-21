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
    peer.notify("initialized", {});
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
