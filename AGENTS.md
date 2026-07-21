# Skel Editor Support Agent Guidelines

## Project Scope

- This repository owns editor integrations and syntax highlighting for the Skel language.
- Keep the extension as a thin Language Server Protocol client. Parsing, semantic analysis, formatting, and language intelligence belong to `skelc lsp` in the independent `yorun-ai/skelc` repository.
- `packages/highlight` owns the canonical TextMate grammar and frontend highlighter adapters. `editors/vscode` owns VS Code language configuration, themes, extension settings, client startup, and Marketplace packaging.
- Do not copy Skel parser or analyzer logic into JavaScript. New semantic editor features should first be implemented by the skelc language server and then enabled by this client.

## Compatibility

- Treat the supported VS Code engine, extension settings, activation behavior, language identifier, grammar scopes, and required skelc version as public compatibility boundaries.
- The extension starts `skelc lsp`. Keep `skelc.path` available for non-standard installations.
- When an LSP capability changes, coordinate the minimum compatible skelc version and update the README.
- Skel syntax changes may require coordinated updates to the TextMate grammar and language configuration even when the LSP server already understands them.

## Source and Packaging

- Edit the canonical grammar under `packages/highlight/src`, highlighter adapters in that package, extension client code under `editors/vscode/src`, themes under `editors/vscode/themes`, and VS Code language behavior in `editors/vscode/language-configuration.json`.
- `editors/vscode/syntaxes`, package `dist` directories, generated licenses, and extension `out` are build artifacts and must not be committed.
- `dist` and `*.vsix` are release artifacts and must not be committed. Build them only as part of an explicit release or packaging task.
- Keep `node_modules` and local editor settings out of the repository.
- Lock files must use public package registry URLs; do not commit internal mirrors or credentials.

## Tests and Validation

- Use `npm ci` for reproducible dependency installation when a lock file is present.
- Run `npm run check` from the repository root after changing an editor client, package manifest, grammar, language configuration, theme, adapter, or build script.
- Test frontend adapters against their real highlighter libraries and keep shared grammar fixtures representative of current Skel syntax.
- Add focused tests when client startup, configuration, or protocol behavior becomes more complex than static validation can cover.
- Test protocol features against a compatible `skelc lsp`; do not replace server integration tests with JavaScript implementations of Skel semantics.
- Run `git diff --check` before handing off changes.
