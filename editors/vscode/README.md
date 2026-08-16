# Skeleton DSL Support

[![CI](https://github.com/yorun-ai/skel-editor-support/actions/workflows/ci.yml/badge.svg)](https://github.com/yorun-ai/skel-editor-support/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/yorun-ai/skel-editor-support)](https://github.com/yorun-ai/skel-editor-support/blob/main/LICENSE)
[![Version](https://img.shields.io/github/v/release/yorun-ai/skel-editor-support?label=version&cacheSeconds=300)](https://github.com/yorun-ai/skel-editor-support/releases/latest)

VS Code language support for [Skeleton (Skel)](https://github.com/yorun-ai/skelc), an open-source DSL for describing software architecture.

![Skel editing in VS Code](https://raw.githubusercontent.com/yorun-ai/skel-editor-support/main/editors/vscode/assets/editor.png)

## Features

- TextMate syntax highlighting for Skel declarations, types, decorators, comments, and strings
- Recoverable syntax and workspace semantic diagnostics, including multiple diagnostics and related locations
- Live schema compatibility diagnostics, CodeLens checks, and complete JSON diff reports
- Diagnostic quick fixes, formatting, context-aware decorator completion, hover details, and hierarchical symbols from `skelc lsp`
- Go to Definition and Find All References across workspace Skel files
- Workspace symbol search and top-level declaration rename
- Best-effort navigation while the current document contains a syntax error
- A Skel-focused dark color theme
- Commands to restart the language server and open its output channel

## Installation

Install `skelc` first:

```sh
go install go.yorun.ai/skelc/cmd/skelc@latest
skelc version --output-format json
```

Install the `Skeleton DSL Support` extension from the VS Code Marketplace, then open a `.skel` file. The extension starts `skelc lsp` from `PATH`.

The extension supports VS Code 1.91 or newer and requires `skelc v0.13.0` or newer. The language server reports syntax, source-directory-scoped semantic diagnostics, and schema compatibility changes while you edit; use `skelc check` and `skelc schema diff` for reproducible terminal and CI validation. Decorator completion is filtered by the following target and omits decorators already present on it. Deprecated declarations and elements are identified in completion, hover, and symbol views.

## Configuration

| Setting | Default | Description |
| --- | --- | --- |
| `skelc.path` | `skelc` | Executable used to start the language server. Changing it restarts the server. |
| `skelc.trace.server` | `off` | Protocol tracing: `off`, `messages`, or `verbose`. |
| `skelc.schemaCompatibility.diagnostics` | `true` | Report breaking and dangerous schema changes while editing. |
| `skelc.schemaCompatibility.includeCompatible` | `false` | Also report compatible changes as hints. |
| `skelc.schemaCompatibility.codeLens` | `true` | Show a compatibility action above domain declarations. |
| `skelc.schemaCompatibility.baseline` | empty | Explicit baseline file or directory relative to the domain source directory; empty uses Git `HEAD`. |

Available commands:

- `Skel: Restart Language Server`
- `Skel: Show Language Server Output`
- `Skel: Check Schema Compatibility`

## Remote and Virtual Workspaces

The extension runs as a workspace extension. In Remote SSH, WSL, and Dev Container windows, install skelc in that remote environment or configure a remote value for `skelc.path`.

Untitled Skel documents receive language-server support. Virtual and untrusted workspaces are intentionally unsupported because the extension requires filesystem access and starts the configured executable.

## Troubleshooting

If the server does not start:

1. Run `skelc version --output-format json` in the same environment as the VS Code extension host and confirm the version is v0.13.0 or newer.
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

Local Extension Host tests reuse an installed VS Code and do not download a
test runtime. Set `VSCODE_EXECUTABLE_PATH` when VS Code is installed in a
non-standard location. CI may set `VSCODE_VERSION` to opt into a managed,
versioned test runtime.

## License

Skel for Visual Studio Code is open source under the [Apache License 2.0](https://github.com/yorun-ai/skel-editor-support/blob/main/LICENSE).
