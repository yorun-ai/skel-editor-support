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
    ["api service OrderApiService {", "entity.name.type.skel"],
    ["ext service StorageService {", "entity.name.type.skel"],
    ["ext event AuditRecordedEvent {", "entity.name.type.skel"],
    ["    id: int", "support.type.skel"],
    ["    method getUser {", "entity.name.function.method.skel"],
    ["// contract comment", "comment.line.double-slash.skel"],
    ["@desc(\"User contract\")", "entity.name.function.decorator.skel"],
    ["@sensitive", "entity.name.function.decorator.skel"],
    ["@deprecated(\"Use Profile instead\")", "entity.name.function.decorator.skel"]
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

test("TextMate distinguishes data declarations from data fields", async () => {
  const grammar = await loadGrammar();
  const lines = ['pub data PageResp<TItem> {', '  @desc("数据")', '  data: list<TItem>', '}'];
  let ruleStack = textmate.INITIAL;
  const dataScopes = [];
  for (const line of lines) {
    const result = grammar.tokenizeLine(line, ruleStack);
    ruleStack = result.ruleStack;
    for (const token of result.tokens) {
      if (line.slice(token.startIndex, token.endIndex) === "data") dataScopes.push(token.scopes);
    }
  }
  assert.equal(dataScopes.length, 2);
  assert.ok(dataScopes[0].includes("keyword.declaration.skel"));
  assert.ok(dataScopes[1].includes("variable.other.member.skel"));
  assert.ok(!dataScopes[1].some((scope) => scope.startsWith("keyword.")));
});

test("TextMate highlights service and event modifiers without treating keyword-named fields as keywords", async () => {
  const grammar = await loadGrammar();
  for (const [line, word, scope] of [
    ["api service HealthApiService {", "api", "storage.modifier.public.skel"],
    ["ext service StorageService {", "ext", "storage.modifier.public.skel"],
    ["ext event AuditRecordedEvent {", "ext", "storage.modifier.public.skel"],
    ["api service HealthApiService {", "HealthApiService", "entity.name.type.skel"],
    ["  api: string", "api", "variable.other.member.skel"],
    ["  ext: string", "ext", "variable.other.member.skel"],
    ["  open: string", "open", "variable.other.member.skel"]
  ]) {
    const result = grammar.tokenizeLine(line, textmate.INITIAL);
    assert.ok(result.tokens.some(token => line.slice(token.startIndex, token.endIndex) === word && token.scopes.includes(scope)), line);
  }
});

test("TextMate no longer highlights open as a modifier", async () => {
  const grammar = await loadGrammar();
  const line = "open service StorageService {";
  const result = grammar.tokenizeLine(line, textmate.INITIAL);
  const token = result.tokens.find(token => token.startIndex === 0);
  assert.ok(token);
  assert.ok(!token.scopes.some(scope => scope.startsWith("keyword.") || scope.startsWith("storage.modifier.")));
});

test("TextMate highlights nested config binary values and nullable generic parameters", async () => {
  const grammar = await loadGrammar();
  const fixture = fs.readFileSync(path.join(root, "test", "fixtures", "config.skel"), "utf8");
  const tokens = [];
  let ruleStack = textmate.INITIAL;
  for (const line of fixture.split("\n")) {
    const result = grammar.tokenizeLine(line, ruleStack);
    ruleStack = result.ruleStack;
    tokens.push(...result.tokens.map(token => ({ value: line.slice(token.startIndex, token.endIndex), scopes: token.scopes })));
  }
  for (const [value, scope] of [
    ["AssetConfig", "entity.name.type.skel"],
    ["binary", "support.type.skel"],
    ["?", "keyword.operator.nullable.skel"],
    ["sensitive", "entity.name.function.decorator.skel"]
  ]) {
    assert.ok(tokens.some(token => token.value === value && token.scopes.includes(scope)), `${value}: ${scope}`);
  }
});

test("TextMate grammar highlights explicit auth modes", async () => {
  const grammar = await loadGrammar();
  for (const mode of ["required", "optional", "anonymous", "off"]) {
    const line = `auth ${mode}`;
    const tokenized = grammar.tokenizeLine(line, textmate.INITIAL);
    const token = tokenized.tokens.find((item) => line.slice(item.startIndex, item.endIndex) === mode);
    assert.ok(token?.scopes.some((scope) => scope.startsWith("keyword.control")), `${mode} is not highlighted`);
  }
});
