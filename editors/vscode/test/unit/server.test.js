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

test("verifyServer checks the skelc version", async () => {
  let invocation;
  const execFile = (command, args, options, callback) => {
    invocation = { command, args, options };
    callback(null, JSON.stringify({ version: "v0.9.4" }), "");
  };

  await assert.doesNotReject(server.verifyServer("/opt/bin/skelc", execFile));
  assert.equal(invocation.command, "/opt/bin/skelc");
  assert.deepEqual(invocation.args, ["version", "--output-format", "json"]);
  assert.equal(invocation.options.timeout, 5000);
});

test("verifyServer accepts development and newer builds", async () => {
  for (const version of ["v0.0.0-dev", "v0.9.5", "v1.0.0"]) {
    const execFile = (_command, _args, _options, callback) => {
      callback(null, JSON.stringify({ version }), "");
    };
    await assert.doesNotReject(server.verifyServer("skelc", execFile));
  }
});

test("verifyServer rejects unsupported and invalid versions", async () => {
  for (const [stdout, message] of [
    [JSON.stringify({ version: "v0.9.3" }), /v0\.9\.4 or newer is required/],
    [JSON.stringify({ version: "v0.9.4-rc.1" }), /v0\.9\.4 or newer is required/],
    [JSON.stringify({}), /version unknown is unsupported/],
    ["not json", /Cannot read skelc version/]
  ]) {
    const execFile = (_command, _args, _options, callback) => callback(null, stdout, "");
    await assert.rejects(server.verifyServer("skelc", execFile), message);
  }
});

test("verifyServer explains a missing executable", async () => {
  const execFile = (_command, _args, _options, callback) => {
    const error = new Error("spawn skelc ENOENT");
    error.code = "ENOENT";
    callback(error);
  };

  await assert.rejects(
    server.verifyServer("missing-skelc", execFile),
    /Cannot run missing-skelc: the executable was not found/
  );
});
