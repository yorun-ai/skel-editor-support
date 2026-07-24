# Skel Editor Support

[![CI](https://github.com/yorun-ai/skel-editor-support/actions/workflows/ci.yml/badge.svg)](https://github.com/yorun-ai/skel-editor-support/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/yorun-ai/skel-editor-support)](LICENSE)

Editor integrations and syntax highlighting for the [Skel](https://github.com/yorun-ai/skelc) contract language.

## Packages

| Package | Description |
| --- | --- |
| [`@yorun-ai/skel-highlight`](packages/highlight) | Shared TextMate grammar and frontend highlighter integrations |
| [`skeleton`](editors/vscode) | VS Code extension and `skelc lsp` client |

## Syntax Highlighting

`@yorun-ai/skel-highlight` provides adapters for:

- Shiki
- PrismJS and Refractor
- Highlight.js and Lowlight
- Monaco Editor with Monarch
- Starry Night
- CodeMirror 6

See the [package README](packages/highlight) for installation and registration examples. The TextMate grammar in `packages/highlight` is the canonical lexical highlighting definition shared by Shiki, Starry Night, and the VS Code extension; the other adapters reuse one shared set of Skel keywords and built-in types.

## Visual Studio Code

The [Skeleton VS Code extension](editors/vscode) provides syntax highlighting, a color theme, recoverable syntax and workspace semantic diagnostics, quick fixes, formatting, completion, hover details, hierarchical symbols, definitions, references, and top-level declaration rename through `skelc lsp`. Its Marketplace identity is `yorun.skeleton`.

## Development

Node.js 22 or later is required for repository development:

```sh
npm ci
npm run check
```

Open this repository in VS Code and press F5 to launch the extension from `editors/vscode`.

See [CONTRIBUTING.md](CONTRIBUTING.md) for repository boundaries, validation commands, and pull request guidance.

## Release Versions

Source manifests use `0.0.0` as a development placeholder. Publishing a GitHub Release with a `v<version>` tag applies that version to every workspace package in the temporary Actions checkout before validation and packaging.

## License

Skel Editor Support is open source under the [Apache License 2.0](LICENSE).
