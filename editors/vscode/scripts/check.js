"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const workspaceRoot = path.resolve(root, "..", "..");
const jsonFiles = [
  "package.json",
  "skelc-compatibility.json",
  "language-configuration.json",
  "syntaxes/skel.tmLanguage.json",
  "themes/skel-dark-color-theme.json"
];

for (const file of jsonFiles) {
  JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
}

const manifest = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const compatibility = JSON.parse(fs.readFileSync(path.join(root, "skelc-compatibility.json"), "utf8"));
const highlightManifest = JSON.parse(fs.readFileSync(path.join(workspaceRoot, "packages", "highlight", "package.json"), "utf8"));
const languageClientManifest = JSON.parse(fs.readFileSync(path.join(workspaceRoot, "node_modules", "vscode-languageclient", "package.json"), "utf8"));
if (!/^v\d+\.\d+\.\d+$/.test(compatibility.minimumVersion)) {
  throw new Error(`invalid minimum skelc version: ${compatibility.minimumVersion}`);
}
if (!/^v\d+\.\d+\.\d+$/.test(compatibility.latestTestedVersion)) {
  throw new Error(`invalid latest tested skelc version: ${compatibility.latestTestedVersion}`);
}
if (manifest.engines.vscode !== languageClientManifest.engines.vscode) {
  throw new Error(`VS Code engine differs from vscode-languageclient: extension=${manifest.engines.vscode}, client=${languageClientManifest.engines.vscode}`);
}
if (manifest.version !== highlightManifest.version) {
  throw new Error(`workspace versions differ: vscode=${manifest.version}, highlight=${highlightManifest.version}`);
}
for (const file of [manifest.main, manifest.icon, "assets/editor.png", "CHANGELOG.md"]) {
  if (!fs.existsSync(path.join(root, file))) {
    throw new Error(`missing packaged asset: ${file}`);
  }
}

const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");
if (!readme.includes(`skelc ${compatibility.minimumVersion}`)) {
  throw new Error(`README does not document minimum skelc version ${compatibility.minimumVersion}`);
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

console.log("skeleton manifest and bundled extension are valid");
