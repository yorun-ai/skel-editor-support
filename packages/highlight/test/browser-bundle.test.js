import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";

test("all public JavaScript entrypoints bundle for browsers", async () => {
  const result = await build({
    bundle: true,
    format: "esm",
    platform: "browser",
    stdin: {
      contents: `
        import shiki from "@yorun-ai/skel-highlight/shiki";
        import prism from "@yorun-ai/skel-highlight/prism";
        import highlightjs from "@yorun-ai/skel-highlight/highlightjs";
        import monaco from "@yorun-ai/skel-highlight/monaco";
        import starryNight from "@yorun-ai/skel-highlight/starry-night";
        import codeMirror from "@yorun-ai/skel-highlight/codemirror";
        export default [shiki, prism, highlightjs, monaco, starryNight, codeMirror];
      `,
      resolveDir: new URL("..", import.meta.url).pathname,
      sourcefile: "browser-consumer.js"
    },
    write: false
  });

  assert.equal(result.errors.length, 0);
  assert.equal(result.outputFiles.length, 1);
  assert.match(result.outputFiles[0].text, /source\.skel/);
});
