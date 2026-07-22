import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));
const repositoryRoot = path.resolve(packageRoot, "../..");

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout;
}

test("the packed package exposes every documented entrypoint", async () => {
  const temporaryRoot = await mkdtemp(path.join(repositoryRoot, ".highlight-package-"));
  try {
    const packOutput = run(
      "npm",
      ["pack", "--ignore-scripts", "--json", "--pack-destination", temporaryRoot],
      packageRoot
    );
    const [{ filename, files }] = JSON.parse(packOutput);
    const archive = path.join(temporaryRoot, filename);
    run("tar", ["-xzf", archive, "-C", temporaryRoot], packageRoot);

    const installedRoot = path.join(temporaryRoot, "consumer", "node_modules", "@yorun-ai");
    await mkdir(installedRoot, { recursive: true });
    await rename(path.join(temporaryRoot, "package"), path.join(installedRoot, "skel-highlight"));

    const consumer = path.join(temporaryRoot, "consumer", "consumer.mjs");
    await writeFile(consumer, `
      import assert from "node:assert/strict";
      import shiki from "@yorun-ai/skel-highlight/shiki";
      import prism from "@yorun-ai/skel-highlight/prism";
      import highlightjs from "@yorun-ai/skel-highlight/highlightjs";
      import monaco from "@yorun-ai/skel-highlight/monaco";
      import starryNight from "@yorun-ai/skel-highlight/starry-night";
      import codeMirror from "@yorun-ai/skel-highlight/codemirror";
      import textmate from "@yorun-ai/skel-highlight/textmate" with { type: "json" };
      assert.equal(shiki.scopeName, "source.skel");
      assert.equal(typeof prism, "object");
      assert.equal(typeof highlightjs, "function");
      assert.equal(typeof monaco, "object");
      assert.equal(starryNight.scopeName, "source.skel");
      assert.equal(typeof codeMirror, "function");
      assert.equal(textmate.scopeName, "source.skel");
    `);
    run(process.execPath, [consumer], path.dirname(consumer));

    const paths = new Set(files.map(({ path: filePath }) => filePath));
    for (const expected of [
      "dist/index.js", "dist/prism.js", "dist/highlightjs.js", "dist/monaco.js",
      "dist/starry-night.js", "dist/codemirror.js", "src/skel.tmLanguage.json"
    ]) {
      assert.ok(paths.has(expected), `${expected} is missing from npm pack`);
    }
    assert.equal(JSON.parse(await readFile(path.join(installedRoot, "skel-highlight", "package.json"))).sideEffects, false);
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});
