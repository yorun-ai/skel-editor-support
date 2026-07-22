import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { classHighlighter, highlightTree } from "@lezer/highlight";
import { createHighlighter } from "shiki";
import { createStarryNight } from "@wooorm/starry-night";
import hljs from "highlight.js/lib/core";
import Prism from "prismjs";
import { skelLanguage } from "../dist/codemirror.js";
import skelHighlightJs from "../dist/highlightjs.js";
import skelPrism, { registerSkelPrism } from "../dist/prism.js";
import skelStarryNight from "../dist/starry-night.js";
import skelShiki from "../dist/index.js";

const fixture = await readFile(new URL("./fixtures/compatibility.skel", import.meta.url), "utf8");
const editingStates = [
  "pub data Draft {\n  value: string\n",
  "@desc(\"unfinished",
  "@desc(\"\"\"unfinished\nsecond line",
  "/* unfinished block comment",
  "method find { output map<string,"
];

test("all executable adapters accept a broad Skel fixture", async () => {
  registerSkelPrism(Prism);
  assert.match(Prism.highlight(fixture, skelPrism, "skel"), /token comment/);

  const highlightJs = hljs.newInstance();
  highlightJs.registerLanguage("skel", skelHighlightJs);
  assert.match(highlightJs.highlight(fixture, { language: "skel" }).value, /hljs-comment/);

  const starryNight = await createStarryNight([skelStarryNight]);
  assert.equal(starryNight.highlight(fixture, "source.skel").type, "root");

  const shiki = await createHighlighter({ langs: [skelShiki], themes: ["github-dark"] });
  try {
    assert.match(shiki.codeToHtml(fixture, { lang: "skel", theme: "github-dark" }), /class="shiki/);
  } finally {
    shiki.dispose();
  }

  const codeMirrorTokens = [];
  highlightTree(skelLanguage.parser.parse(fixture), classHighlighter, (from, to, classes) => {
    codeMirrorTokens.push({ value: fixture.slice(from, to), classes });
  });
  assert.ok(codeMirrorTokens.some(({ value, classes }) => value === "duration" && classes === "tok-typeName"));
  assert.ok(codeMirrorTokens.some(({ value, classes }) => value.includes("Find a user") && classes === "tok-string"));
});

test("highlighters tolerate incomplete editor states", async () => {
  registerSkelPrism(Prism);
  const highlightJs = hljs.newInstance();
  highlightJs.registerLanguage("skel", skelHighlightJs);
  const starryNight = await createStarryNight([skelStarryNight]);
  const shiki = await createHighlighter({ langs: [skelShiki], themes: ["github-dark"] });

  try {
    for (const source of editingStates) {
      assert.doesNotThrow(() => Prism.highlight(source, skelPrism, "skel"));
      assert.doesNotThrow(() => highlightJs.highlight(source, { language: "skel" }));
      assert.doesNotThrow(() => starryNight.highlight(source, "source.skel"));
      assert.doesNotThrow(() => skelLanguage.parser.parse(source));
      assert.doesNotThrow(() => shiki.codeToHtml(source, { lang: "skel", theme: "github-dark" }));
    }
  } finally {
    shiki.dispose();
  }

  const unfinishedString = '@desc("unfinished';
  assert.match(Prism.highlight(unfinishedString, skelPrism, "skel"), /token string/);
  assert.match(highlightJs.highlight(unfinishedString, { language: "skel" }).value, /hljs-string/);

  const codeMirrorTokens = [];
  highlightTree(skelLanguage.parser.parse(unfinishedString), classHighlighter, (from, to, classes) => {
    codeMirrorTokens.push({ value: unfinishedString.slice(from, to), classes });
  });
  assert.ok(codeMirrorTokens.some(({ value, classes }) => value === '"unfinished' && classes === "tok-string"));
});
