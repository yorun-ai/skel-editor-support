"use strict";

const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const grammar = path.join(root, "packages", "highlight", "src", "skel.tmLanguage.json");
const license = path.join(root, "LICENSE");
const vscodeRoot = path.join(root, "editors", "vscode");
const highlightRoot = path.join(root, "packages", "highlight");

fs.mkdirSync(path.join(vscodeRoot, "syntaxes"), { recursive: true });
fs.copyFileSync(grammar, path.join(vscodeRoot, "syntaxes", "skel.tmLanguage.json"));
fs.copyFileSync(license, path.join(vscodeRoot, "LICENSE"));
fs.copyFileSync(license, path.join(highlightRoot, "LICENSE"));
