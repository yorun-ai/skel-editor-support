# Skel VS Code Support

[![License](https://img.shields.io/github/license/yorun-ai/vscode-skel)](LICENSE)

The official VS Code extension for the [Skel](https://yorun.ai/skelc/syntax) contract language.

This extension adds language support for `.skel` files:

- TextMate syntax highlighting for domains, imports, declarations, decorators, scalar types, comments, and strings.
- Live syntax diagnostics from `skelc`.
- Document symbols, Go to Definition, and Find All References across the workspace.

The extension is a thin client for the language server provided by skelc. Install skelc first:

```sh
go install go.yorun.ai/skelc/cmd/skelc@latest
```

The extension starts `skelc lsp` from `PATH`. Set `skelc.path` when the executable is installed elsewhere.

The current extension requires a skelc build that provides the `lsp` command. Run `skelc version` to confirm which executable VS Code will use.

## Development

Install dependencies and run the extension checks:

```sh
npm ci
npm run check
```

Open this directory in VS Code and press `F5` to launch an Extension Development Host.

## License

Skel VS Code Support is open source under the Apache License 2.0. The complete
license text is included in the extension package.
