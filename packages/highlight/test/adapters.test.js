import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { classHighlighter, highlightTree } from "@lezer/highlight";
import { createStarryNight } from "@wooorm/starry-night";
import hljs from "highlight.js/lib/core";
import { createLowlight } from "lowlight";
import { compile as compileMonarch } from "monaco-editor/editor/standalone/common/monarch/monarchCompile";
import Prism from "prismjs";
import { refractor } from "refractor/core";
import { skelLanguage } from "../dist/codemirror.js";
import skelHighlightJs from "../dist/highlightjs.js";
import { registerSkelMonaco, skelLanguageConfiguration, skelMonarch } from "../dist/monaco.js";
import skelPrism, { registerSkelPrism } from "../dist/prism.js";
import skelStarryNight from "../dist/starry-night.js";
import { builtinTypes, keywords } from "../src/language.js";

const source = "pub data User {\n  id: int\n  @desc(\"Account\")\n}";

test("Prism highlights Skel keywords, declarations, and built-in types", () => {
  assert.equal(registerSkelPrism.displayName, "skel");
  assert.equal(registerSkelPrism(Prism), skelPrism);
  const html = Prism.highlight(source, Prism.languages.skel, "skel");
  assert.match(html, /token keyword">pub/);
  assert.match(html, /token class-name">User/);
  assert.match(html, /token builtin">int/);
  assert.match(html, /token decorator annotation">@desc/);
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
});
