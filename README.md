# Skel Editor Support

[![CI](https://github.com/yorun-ai/skel-editor-support/actions/workflows/ci.yml/badge.svg)](https://github.com/yorun-ai/skel-editor-support/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/yorun-ai/skel-editor-support)](LICENSE)

Editor integrations and syntax highlighting for the [Skel](https://yorun.ai/skelc/syntax) contract language.

## Packages

| Package | Description |
| --- | --- |
| [`@yorun-ai/skel-highlight`](packages/highlight) | Shared TextMate grammar and frontend highlighter integrations |
| [`vscode-skel`](editors/vscode) | VS Code extension and `skelc lsp` client |

## Shiki

Install Shiki and the Skel language registration:

```sh
npm install shiki @yorun-ai/skel-highlight
```

```js
import { createHighlighter } from "shiki";
import skel from "@yorun-ai/skel-highlight/shiki";

const highlighter = await createHighlighter({
  langs: [skel],
  themes: ["github-dark"]
});

const html = highlighter.codeToHtml("domain demo.user", {
  lang: "skel",
  theme: "github-dark"
});
```

The TextMate grammar in `packages/highlight` is the canonical lexical highlighting definition. The VS Code extension consumes a generated copy of the same grammar.

## Visual Studio Code

The [Skel VS Code extension](editors/vscode) provides syntax highlighting, a color theme, diagnostics, symbols, definitions, and references through `skelc lsp`. Its Marketplace identity remains `yorun.vscode-skel`.

## Development

Node.js 22 or later is required for repository development:

```sh
npm ci
npm run check
```

Open this repository in VS Code and press F5 to launch the extension from `editors/vscode`.

## License

Skel Editor Support is open source under the [Apache License 2.0](LICENSE).
