# Skel Editor Support Agent Guidelines

## Project Scope

- This repository owns editor integrations and syntax highlighting for the Skel language.
- Keep the extension as a thin Language Server Protocol client. Parsing, semantic analysis, formatting, and language intelligence belong to `skelc lsp` in the independent `yorun-ai/skelc` repository.
- `packages/highlight` owns the canonical TextMate grammar and frontend highlighter adapters. `editors/vscode` owns VS Code language configuration, themes, extension settings, client startup, and Marketplace packaging.
- Do not copy Skel parser or analyzer logic into JavaScript. New semantic editor features should first be implemented by the skelc language server and then enabled by this client.
- `editors/jetbrains` owns the Kotlin IntelliJ Platform plugin, editor behavior, LSP integration, Gradle tests and Marketplace packaging. Read its local guidelines before modifying it.

## Compatibility

- Treat the supported VS Code engine, extension settings, activation behavior, language identifier, grammar scopes, and required skelc version as public compatibility boundaries.
- The extension starts `skelc lsp`. Keep `skelc.path` available for non-standard installations.
- When an LSP capability changes, coordinate the minimum compatible skelc version and update the README.
- Skel syntax changes may require coordinated updates to the TextMate grammar and language configuration even when the LSP server already understands them.

## Source and Packaging

- Edit the canonical grammar under `packages/highlight/src`, highlighter adapters in that package, extension client code under `editors/vscode/src`, themes under `editors/vscode/themes`, and VS Code language behavior in `editors/vscode/language-configuration.json`.
- Do not commit generated grammars (`editors/vscode/syntaxes`), generated licenses, `out`, `dist`, or `*.vsix`. Build release artifacts only for an explicit release or packaging task.
- Keep workspace source versions at the `0.0.0` development placeholder. The Publish workflow derives the release version from a pushed `v<version>` Git tag and applies it only in the temporary Actions checkout.
- Lock files must use public package registry URLs; do not commit internal mirrors or credentials.

## Tests and Validation

- Use `npm ci` for reproducible dependency installation when a lock file is present.
- Run `npm run check` from the repository root after changing an editor client, package manifest, grammar, language configuration, theme, adapter, or build script.
- Test frontend adapters against their real highlighter libraries and keep shared grammar fixtures representative of current Skel syntax.
- Add focused tests when client startup, configuration, or protocol behavior becomes more complex than static validation can cover.
- Test protocol features against a compatible `skelc lsp`; do not replace server integration tests with JavaScript implementations of Skel semantics.
- Run `git diff --check` before handing off changes.

## Release Publication and Recovery

- Merge release preparation after required PR checks pass, sync main, then push the reviewed `vX.Y.Z` tag (excluding `v0.0.0`). Tag pushes start Publish; do not publish GitHub Release first.
- Validate tag identity, main ancestry, dated nonempty VS Code CHANGELOG and the released minimum skelc version. Keep source versions at `0.0.0`; inject versions only in Actions checkouts.
- Prepare a Draft Release with changelog notes and a `publication.json` manifest binding tag, commit and required channels. Keep one `publication-<channel>.json` receipt after each successful upload. Receipts are durable Release assets, never source files, and must not be overwritten or fabricated.
- Only publish GitHub Release after all required channel receipts match the source and the current selected jobs succeeded. JetBrains remains opt-in; its receipt records upload/submission, not Marketplace review approval or public availability.
- Preserve per-channel environments and credentials. Check environment deployment rules permit version tags. Changing the JetBrains enablement flag during recovery must fail rather than silently drop a required channel.
- Retry failed jobs or dispatch for the same tag with `all`, `vscode`, `npm`, or `jetbrains`; matching successful receipts skip duplicate uploads. If remote upload succeeded but recording failed, verify the exact remote version and source before repairing the missing receipt; never blindly republish or overwrite a version.
- Existing published Releases without a manifest retain legacy selective recovery and are not edited. See `.github/CI.md` for recovery boundaries and checks.
