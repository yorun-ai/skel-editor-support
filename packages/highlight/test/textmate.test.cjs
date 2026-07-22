"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const oniguruma = require("vscode-oniguruma");
const textmate = require("vscode-textmate");

const root = path.resolve(__dirname, "..");

async function loadGrammar() {
  const wasm = fs.readFileSync(require.resolve("vscode-oniguruma/release/onig.wasm"));
  await oniguruma.loadWASM(wasm.buffer.slice(wasm.byteOffset, wasm.byteOffset + wasm.byteLength));
  const registry = new textmate.Registry({
    onigLib: Promise.resolve({
      createOnigScanner: (patterns) => new oniguruma.OnigScanner(patterns),
      createOnigString: (value) => new oniguruma.OnigString(value)
    }),
    loadGrammar: async (scopeName) => {
      if (scopeName !== "source.skel") {
        return null;
      }
      const source = fs.readFileSync(path.join(root, "src", "skel.tmLanguage.json"), "utf8");
      return textmate.parseRawGrammar(source, "skel.tmLanguage.json");
    }
  });
  return registry.loadGrammar("source.skel");
}

test("TextMate grammar recognizes representative Skel constructs", async () => {
  const grammar = await loadGrammar();
  assert.ok(grammar);

  const cases = [
    ["domain demo.user", "keyword.declaration.domain.skel"],
    ["import demo.shared as shared", "keyword.control.import.skel"],
    ["pub data User {", "entity.name.type.skel"],
    ["    id: int", "support.type.skel"],
    ["    method getUser {", "entity.name.function.method.skel"],
    ["// contract comment", "comment.line.double-slash.skel"],
    ["@desc(\"User contract\")", "entity.name.function.decorator.skel"]
  ];

  let ruleStack = textmate.INITIAL;
  for (const [line, expectedScope] of cases) {
    const tokenized = grammar.tokenizeLine(line, ruleStack);
    ruleStack = tokenized.ruleStack;
    const scopes = tokenized.tokens.flatMap((token) => token.scopes);
    assert.ok(scopes.includes(expectedScope), `${line} did not contain ${expectedScope}: ${scopes.join(", ")}`);
  }
});

test("TextMate grammar preserves multiline and incomplete editing state", async () => {
  const grammar = await loadGrammar();
  assert.ok(grammar);
  const fixture = fs.readFileSync(path.join(root, "test", "fixtures", "compatibility.skel"), "utf8");
  let ruleStack = textmate.INITIAL;
  const scopes = [];
  for (const line of fixture.split("\n")) {
    const tokenized = grammar.tokenizeLine(line, ruleStack);
    ruleStack = tokenized.ruleStack;
    scopes.push(...tokenized.tokens.flatMap((token) => token.scopes));
  }
  assert.ok(scopes.includes("comment.block.skel"));
  assert.ok(scopes.includes("string.quoted.triple.skel"));
  assert.ok(scopes.includes("constant.language.actor-via.skel"));

  const incomplete = grammar.tokenizeLine('@desc("unfinished', textmate.INITIAL);
  assert.ok(incomplete.tokens.some((token) => token.scopes.includes("string.quoted.double.skel")));
});
