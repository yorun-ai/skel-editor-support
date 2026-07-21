# Skel for Visual Studio Code

[![CI](https://github.com/yorun-ai/skel-editor-support/actions/workflows/ci.yml/badge.svg)](https://github.com/yorun-ai/skel-editor-support/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/yorun-ai/skel-editor-support)](https://github.com/yorun-ai/skel-editor-support/blob/main/LICENSE)
[![Version](https://img.shields.io/github/v/release/yorun-ai/skel-editor-support?label=version&cacheSeconds=300)](https://github.com/yorun-ai/skel-editor-support/releases/latest)

The official VS Code extension for the [Skel](https://yorun.ai/skelc/syntax) contract language.

![Skel editing in VS Code](assets/editor.png)

## Features

- TextMate syntax highlighting for Skel declarations, types, decorators, comments, and strings
- Live syntax diagnostics and document symbols from `skelc lsp`
- Go to Definition and Find All References across workspace Skel files
- A Skel-focused dark color theme
- Commands to restart the language server and open its output channel

## Installation

Install `skelc` first:

```sh
go install go.yorun.ai/skelc/cmd/skelc@latest
skelc lsp --help
```

Install the `Skel` extension from the VS Code Marketplace, then open a `.skel` file. The extension starts `skelc lsp` from `PATH`.

The extension requires a skelc build that provides the `lsp` command. Complete naming, type, and cross-domain semantic validation still belongs to `skelc check`.

## Configuration

| Setting | Default | Description |
| --- | --- | --- |
| `skelc.path` | `skelc` | Executable used to start the language server. Changing it restarts the server. |
| `skelc.trace.server` | `off` | Protocol tracing: `off`, `messages`, or `verbose`. |

Available commands:

- `Skel: Restart Language Server`
- `Skel: Show Language Server Output`

## Remote and Virtual Workspaces

The extension runs as a workspace extension. In Remote SSH, WSL, and Dev Container windows, install skelc in that remote environment or configure a remote value for `skelc.path`.

Untitled Skel documents receive language-server support. Virtual and untrusted workspaces are intentionally unsupported because the extension requires filesystem access and starts the configured executable.

## Troubleshooting

If the server does not start:

1. Run `skelc lsp --help` in the same environment as the VS Code extension host.
2. Set `skelc.path` to the executable's absolute path when it is not on `PATH`.
3. Run `Skel: Restart Language Server`.
4. Run `Skel: Show Language Server Output` and set `skelc.trace.server` to `messages` or `verbose` when protocol details are needed.

## Development

From the repository root, install dependencies and run the normal checks:

```sh
npm ci
npm run check
```

Open this repository in VS Code and press F5 to launch the portable Extension Development Host configuration.

Protocol and Extension Host tests require a local skelc build with LSP support:

```sh
SKELC_PATH=/absolute/path/to/skelc npm run test:integration
SKELC_PATH=/absolute/path/to/skelc npm run test:extension
```

## Release

Publishing a GitHub Release whose tag matches `v<extension version>` automatically publishes the packaged extension to the VS Code Marketplace. For example, extension version `0.9.0` must use tag `v0.9.0`.

The repository must provide a `VSCE_PAT` secret to the `vscode-marketplace` GitHub environment. The token must belong to the `yorun` Marketplace publisher and have Marketplace management permission. The workflow only publishes tags whose commit is contained in `main`.

Run the `Publish` workflow manually to verify the configured Marketplace credentials without packaging or publishing an extension.

## License

Skel for Visual Studio Code is open source under the [Apache License 2.0](https://github.com/yorun-ai/skel-editor-support/blob/main/LICENSE).
