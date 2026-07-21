"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const workspaceRoot = path.resolve(root, "..", "..");
const jsonFiles = [
  "package.json",
  "language-configuration.json",
  "syntaxes/skel.tmLanguage.json",
  "themes/skel-dark-color-theme.json"
];

for (const file of jsonFiles) {
  JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
}

const manifest = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
if (manifest.version !== "0.9.0") {
  throw new Error(`expected first public version 0.9.0, found ${manifest.version}`);
}
for (const file of [manifest.main, manifest.icon, "assets/editor.png", "CHANGELOG.md"]) {
  if (!fs.existsSync(path.join(root, file))) {
    throw new Error(`missing packaged asset: ${file}`);
  }
}

const lock = fs.readFileSync(path.join(workspaceRoot, "package-lock.json"), "utf8");
if (lock.includes("npm.cew.io")) {
  throw new Error("package-lock.json contains an internal registry URL");
}

const extensionSource = fs.readFileSync(path.join(root, "out/extension.js"), "utf8");
new Function("require", "module", "exports", extensionSource);

const generatedGrammar = fs.readFileSync(path.join(root, "syntaxes", "skel.tmLanguage.json"));
const canonicalGrammar = fs.readFileSync(path.join(workspaceRoot, "packages", "highlight", "src", "skel.tmLanguage.json"));
if (!generatedGrammar.equals(canonicalGrammar)) {
  throw new Error("generated VS Code grammar differs from packages/highlight");
}

console.log("vscode-skel manifest and bundled extension are valid");
