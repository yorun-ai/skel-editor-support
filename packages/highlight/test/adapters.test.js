import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { classHighlighter, highlightTree } from "@lezer/highlight";
import { createStarryNight } from "@wooorm/starry-night";
import hljs from "highlight.js/lib/core";
import { createLowlight } from "lowlight";
import { compile as compileMonarch } from "monaco-editor/editor/standalone/common/monarch/monarchCompile";
import { MonarchTokenizer } from "monaco-editor/editor/standalone/common/monarch/monarchLexer";
import Prism from "prismjs";
import { refractor } from "refractor/core";
import { skelLanguage } from "../dist/codemirror.js";
import skelHighlightJs from "../dist/highlightjs.js";
import { registerSkelMonaco, skelLanguageConfiguration, skelMonarch } from "../dist/monaco.js";
import skelPrism, { registerSkelPrism } from "../dist/prism.js";
import skelStarryNight from "../dist/starry-night.js";
import { builtinTypes, keywords } from "../src/language.js";

const source = "@deprecated(\"Use Profile instead\")\npub data User {\n  id: int\n  @desc(\"Account\")\n  @sensitive\n  token: string\n}";

test("Prism highlights Skel keywords, declarations, and built-in types", () => {
  assert.equal(registerSkelPrism.displayName, "skel");
  assert.equal(registerSkelPrism(Prism), skelPrism);
  const html = Prism.highlight(source, Prism.languages.skel, "skel");
  assert.match(html, /token keyword">pub/);
  assert.match(html, /token class-name">User/);
  assert.match(html, /token builtin">int/);
  assert.match(html, /token decorator annotation">@desc/);
  assert.match(html, /token decorator annotation">@sensitive/);
  assert.match(html, /token decorator annotation">@deprecated/);
  assert.doesNotMatch(
    Prism.highlight("credential { subject: string }", Prism.languages.skel, "skel"),
    /token keyword">subject/
  );
});

test("the canonical TextMate grammar covers the shared vocabulary", async () => {
  const grammar = await readFile(new URL("../src/skel.tmLanguage.json", import.meta.url), "utf8");
  for (const word of [...keywords, ...builtinTypes]) assert.match(grammar, new RegExp(`\\b${word}\\b`));
});

test("Highlight.js highlights representative Skel constructs", () => {
  const instance = hljs.newInstance();
  instance.registerLanguage("skel", skelHighlightJs);
  const html = instance.highlight(source, { language: "skel" }).value;
  assert.match(html, /hljs-keyword">pub/);
  assert.match(html, /hljs-title class_">User/);
  assert.match(html, /hljs-type">int/);
  assert.match(html, /hljs-meta">@desc/);
  assert.match(html, /hljs-meta">@sensitive/);
  assert.match(html, /hljs-meta">@deprecated/);
});

test("Lowlight and Refractor reuse the Highlight.js and Prism adapters", () => {
  const lowlight = createLowlight({ skel: skelHighlightJs });
  assert.equal(lowlight.highlight("skel", source).data.language, "skel");

  refractor.register(registerSkelPrism);
  assert.equal(refractor.registered("skel"), true);
  assert.equal(refractor.highlight(source, "skel").type, "root");
});

test("Monaco registration installs one shared language definition", () => {
  const calls = [];
  const monaco = {
    languages: {
      register: (value) => calls.push(["register", value]),
      setLanguageConfiguration: (...args) => calls.push(["configuration", ...args]),
      setMonarchTokensProvider: (...args) => calls.push(["tokens", ...args])
    }
  };
  registerSkelMonaco(monaco);
  assert.deepEqual(calls, [
    ["register", { id: "skel", extensions: [".skel"], aliases: ["Skel", "skel"] }],
    ["configuration", "skel", skelLanguageConfiguration],
    ["tokens", "skel", skelMonarch]
  ]);
});

test("Monaco's real Monarch compiler accepts the language definition", () => {
  assert.equal(Object.isExtensible(skelMonarch), true);
  const lexer = compileMonarch("skel", skelMonarch);
  assert.equal(lexer.languageId, "skel");
  assert.ok(lexer.tokenizer.root.length > 0);
});

test("Starry Night consumes the canonical TextMate grammar", async () => {
  const highlighter = await createStarryNight([skelStarryNight]);
  assert.equal(highlighter.flagToScope("skel"), "source.skel");
  const tree = highlighter.highlight(source, "source.skel");
  const classes = JSON.stringify(tree);
  assert.match(classes, /pl-k/);
  assert.match(classes, /pl-en/);
  assert.match(classes, /pl-c1/);
});

test("CodeMirror stream language emits semantic highlight classes", () => {
  const tokens = [];
  highlightTree(skelLanguage.parser.parse(source), classHighlighter, (from, to, classes) => {
    tokens.push({ value: source.slice(from, to), classes });
  });
  assert.ok(tokens.some((token) => token.value === "pub" && token.classes === "tok-keyword"));
  assert.ok(tokens.some((token) => token.value === "User" && token.classes === "tok-className"));
  assert.ok(tokens.some((token) => token.value === "int" && token.classes === "tok-typeName"));
  assert.ok(tokens.some((token) => token.value === "@desc" && token.classes === "tok-meta"));
  assert.ok(tokens.some((token) => token.value === "@sensitive" && token.classes === "tok-meta"));
  assert.ok(tokens.some((token) => token.value === "@deprecated" && token.classes === "tok-meta"));
});

test("keyword and type spellings remain identifiers before a field colon", () => {
  const instance = hljs.newInstance();
  instance.registerLanguage("skel", skelHighlightJs);
  for (const word of [...keywords, ...builtinTypes]) {
    for (const gap of ["", " ", "\t"]) {
      const source = `pub data PageResp<TItem> {\n  ${word}${gap}: list<TItem>\n}`;
      const prism = Prism.highlight(source, skelPrism, "skel");
      assert.match(prism, /token keyword">data/);
      assert.ok(prism.includes(`token property">${word}</span>${gap}<span class="token punctuation">:`), prism);
      const html = instance.highlight(source, { language: "skel" }).value;
      assert.match(html, /hljs-keyword">data/);
      assert.ok(html.includes(`hljs-property">${word}</span>${gap}:`), html);
      const tokens = [];
      highlightTree(skelLanguage.parser.parse(source), classHighlighter, (from, to, classes) => {
        tokens.push({ from, value: source.slice(from, to), classes });
      });
      assert.ok(tokens.some((token) => token.value === "data" && token.classes === "tok-keyword"));
      assert.ok(tokens.some((token) => token.from === source.indexOf("\n") + 3 &&
        token.value === word && token.classes === "tok-variableName"), JSON.stringify(tokens));
    }
  }
});

test("Monaco tokenizes keyword-named fields as identifiers", () => {
  const tokenizer = new MonarchTokenizer({}, {}, "skel", compileMonarch("skel", skelMonarch), {
    getValue: () => 20000,
    onDidChangeConfiguration: () => ({ dispose() {} })
  });
  try {
    const declaration = tokenizer.tokenize("pub data PageResp<TItem> {", true, tokenizer.getInitialState());
    assert.ok(declaration.tokens.some((token) => token.offset === 4 && token.type === "keyword.skel"));
    for (const word of [...keywords, ...builtinTypes]) {
      for (const gap of ["", " ", "\t"]) {
        const result = tokenizer.tokenize(`  ${word}${gap}: list<TItem>`, true, declaration.endState);
        assert.ok(result.tokens.some((token) => token.offset === 2 && token.type === "identifier.skel"));
        assert.ok(result.tokens.some((token) => token.type === "type.skel"));
      }
    }
  } finally {
    tokenizer.dispose();
  }
});

test("service modifiers are highlighted across frontend adapters", async () => {
  const source = await readFile(new URL("./fixtures/api.skel", import.meta.url), "utf8");
  const modifiers = [
    ["api service HealthApiService {", "api"],
    ["open service StorageService {", "open"]
  ];
  const instance = hljs.newInstance();
  instance.registerLanguage("skel", skelHighlightJs);
  const tokenizer = new MonarchTokenizer({}, {}, "skel", compileMonarch("skel", skelMonarch), {
    getValue: () => 20000, onDidChangeConfiguration: () => ({ dispose() {} })
  });
  try {
    for (const [line, modifier] of modifiers) {
      assert.match(Prism.highlight(line, skelPrism, "skel"), new RegExp(`token keyword">${modifier}</span>`));
      assert.match(instance.highlight(line, { language: "skel" }).value, new RegExp(`hljs-keyword">${modifier}</span>`));

      const tokens = [];
      highlightTree(skelLanguage.parser.parse(line), classHighlighter, (from, to, classes) => {
        tokens.push({ value: line.slice(from, to), classes });
      });
      assert.ok(tokens.some(token => token.value === modifier && token.classes === "tok-keyword"));

      const result = tokenizer.tokenize(line, true, tokenizer.getInitialState());
      assert.ok(result.tokens.some(token => token.offset === 0 && token.type === "keyword.skel"));
    }
  } finally { tokenizer.dispose(); }
  const starryNight = await createStarryNight([skelStarryNight]);
  assert.match(JSON.stringify(starryNight.highlight(source, "source.skel")), /pl-k/);
  assert.match(JSON.stringify(starryNight.highlight("open service StorageService {", "source.skel")), /pl-k/);
});
