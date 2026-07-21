"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const server = require("../../src/server");

test("normalizeCommand uses skelc for missing or blank values", () => {
  assert.equal(server.normalizeCommand(), "skelc");
  assert.equal(server.normalizeCommand("  "), "skelc");
  assert.equal(server.normalizeCommand(" /opt/bin/skelc "), "/opt/bin/skelc");
});

test("serverOptions starts the stdio language server", () => {
  assert.deepEqual(server.serverOptions("/opt/bin/skelc"), {
    command: "/opt/bin/skelc",
    args: ["lsp"]
  });
});

test("verifyServer checks the lsp command", async () => {
  let invocation;
  const execFile = (command, args, options, callback) => {
    invocation = { command, args, options };
    callback(null, "", "");
  };

  await assert.doesNotReject(server.verifyServer("/opt/bin/skelc", execFile));
  assert.equal(invocation.command, "/opt/bin/skelc");
  assert.deepEqual(invocation.args, ["lsp", "--help"]);
  assert.equal(invocation.options.timeout, 5000);
});

test("verifyServer explains a missing executable", async () => {
  const execFile = (_command, _args, _options, callback) => {
    const error = new Error("spawn skelc ENOENT");
    error.code = "ENOENT";
    callback(error);
  };

  await assert.rejects(
    server.verifyServer("missing-skelc", execFile),
    /Cannot run missing-skelc lsp: the executable was not found/
  );
});
