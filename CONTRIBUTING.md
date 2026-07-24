# Contributing to Skel Editor Support

Thank you for contributing to the editor integrations and syntax-highlighting packages for Skeleton (Skel).

## Repository Scope

This repository contains two workspace packages:

- `packages/highlight` owns the canonical TextMate grammar and adapters for frontend highlighting libraries.
- `editors/vscode` owns the Visual Studio Code extension, language configuration, theme, Marketplace metadata, and the client that starts `skelc lsp`.

Keep the VS Code extension as a thin Language Server Protocol client. Parsing, semantic analysis, formatting, diagnostics, and other language intelligence belong in the independent [`yorun-ai/skelc`](https://github.com/yorun-ai/skelc) repository.

## Prerequisites

- Node.js 22 or later for repository development
- npm
- A compatible `skelc` executable for integration and Extension Host tests

Install dependencies from the repository root:

```sh
npm ci
```

The lock file must continue to use public npm registry URLs.

## Making Changes

Edit source files rather than generated artifacts:

- Canonical grammar: `packages/highlight/src`
- Highlighting adapters: `packages/highlight/src`
- VS Code client: `editors/vscode/src`
- VS Code language configuration: `editors/vscode/language-configuration.json`
- VS Code themes: `editors/vscode/themes`

Do not commit generated grammar copies, package `dist` directories, extension `out`, generated licenses, `.vsix` files, `node_modules`, local editor settings, or test downloads.

When Skel syntax changes, update the canonical grammar and representative fixtures here, and coordinate the language implementation and documentation changes with:

- [`yorun-ai/skelc`](https://github.com/yorun-ai/skelc)
- [`yorun-ai/vine-doc`](https://github.com/yorun-ai/vine-doc)

When an LSP capability changes, implement it in `skelc lsp` first, keep the extension client thin, and update the minimum compatible skelc version in the extension README when necessary.

## Validation

Run the normal validation suite from the repository root:

```sh
npm run check
```

This builds the workspace packages, runs unit and adapter tests, validates the bundled extension and generated grammar, and type-checks the highlighting package.

For protocol integration, build or install a compatible skelc executable and run:

```sh
SKELC_PATH=/absolute/path/to/skelc npm run test:integration
```

For the real Visual Studio Code Extension Host test, run:

```sh
SKELC_PATH=/absolute/path/to/skelc npm run test:extension
```

The Extension Host test downloads a compatible VS Code test runtime on first use.

Before submitting a pull request, also run:

```sh
git diff --check
```

Add focused tests for changes to client startup, configuration, protocol behavior, grammar coverage, or highlighting adapters.

## Versions and Release Artifacts

Workspace source manifests use `0.0.0` as a development placeholder. Do not replace it with a release version in a pull request.

The Publish workflow derives the release version from a `v<version>` GitHub Release tag, applies it in the temporary Actions checkout, validates the packages, and produces the release artifacts. The VS Code Marketplace extension identity is `yorun.skeleton`.

Create the root release `dist` directory and `.vsix` files only for an explicit packaging or release task, and do not commit them.

## Pull Requests

Keep pull requests focused and preserve repository boundaries. In the pull request description:

- Explain the user-visible behavior or compatibility impact.
- List the validation commands that were run.
- Call out coordinated skelc or documentation changes when applicable.
- Update the relevant README and changelog for user-visible behavior.

Maintainers will review compatibility-sensitive changes to extension identity, settings, activation behavior, supported VS Code versions, grammar scopes, and the minimum supported skelc version as public interface changes.
