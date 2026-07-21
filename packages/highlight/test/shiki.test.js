import assert from "node:assert/strict";
import test from "node:test";
import { createHighlighter } from "shiki";
import skel, { skel as namedSkel } from "../dist/index.js";

test("exports the Skel custom language registration", () => {
  assert.equal(skel, namedSkel);
  assert.equal(skel.name, "skel");
  assert.equal(skel.scopeName, "source.skel");
  assert.deepEqual(skel.fileTypes, ["skel"]);
});

test("Shiki highlights representative Skel source", async () => {
  const highlighter = await createHighlighter({
    langs: [skel],
    themes: ["github-dark"]
  });

  try {
    const html = highlighter.codeToHtml("pub data User {\n  id: int\n}", {
      lang: "skel",
      theme: "github-dark"
    });
    assert.match(html, /class="shiki github-dark"/);
    assert.match(html, /<span[^>]*>pub<\/span>/);
    assert.match(html, /<span[^>]*> data<\/span>/);
    assert.match(html, /<span[^>]*> User<\/span>/);
  } finally {
    highlighter.dispose();
  }
});
