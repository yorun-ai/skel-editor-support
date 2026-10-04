# Changelog

All notable changes to the Skel VS Code extension are documented in this file.

## [Unreleased]

## [0.17.0] - 2026-10-05

### Added

- Highlight `auth required`, `auth optional`, `auth anonymous` and `auth off` across the shared TextMate grammar, frontend adapters, VS Code and JetBrains.

### Compatibility

- Validate editor integrations with skelc v0.26.0. The minimum supported skelc remains v0.14.0.
- Authentication syntax diagnostics and completion require skelc v0.26.0; syntax highlighting works independently of the installed compiler.
- Keep highlighting legacy bare `auth` and `noauth` syntax.

## [0.16.0] - 2026-10-04

### Added

- Highlight `ext service` and `ext event` across the shared TextMate grammar, frontend adapters, VS Code and JetBrains.
- Fold extension service and event declarations in VS Code.

### Changed

- Remove highlighting of the retired `open` modifier to match skelc v0.24.0.

### Compatibility

- Extension contract diagnostics, completion and formatting require skelc v0.24.0 or newer. The minimum supported skelc remains v0.14.0 for existing capabilities.
- Validate both editor integrations with skelc v0.24.0, including extension contracts and API services declaring actor audiences.
- When upgrading an existing `open service` contract, replace it with `ext service` and upgrade the skelc executable configured by the editor.

## [0.15.0] - 2026-10-02

### Compatibility

- Validate language-server integration with skelc v0.23.0, including configs containing nested data, binary values and nullable generic parameters. These config capabilities require skelc v0.23.0 or newer; the minimum supported skelc remains v0.14.0.
- Keep existing syntax highlighting for the new config value combinations.

### Maintenance

- Update the VS Code language client and packaging dependencies.
- Refresh compiler integration fixtures, make test-server shutdown reliable, and enforce selected compatibility checks before merging.
- Remove the flaky Marketplace preflight from CI; Marketplace publication still validates and uploads the extension.

## [0.14.0] - 2026-09-09

### Added

- Highlight the `open` service modifier.

### Compatibility

- `open service` language intelligence requires skelc v0.19.0 or newer; syntax highlighting works independently of the installed compiler.

## [0.13.0] - 2026-09-09

### Added

- Highlight the `api` modifier in service declarations. Support folding API service declarations in VS Code.
- Add an optional strict-mode setting that restarts skelc with `--strict lsp`; it is disabled by default.

### Compatibility

- The minimum supported skelc remains v0.14.0. API service language intelligence and strict mode require skelc v0.18.0 or newer.

## [0.12.1] - 2026-09-08

### Added

- Offer Restart Now or Later when the configured skelc executable is replaced, after validating the updated executable.
- Detect executable and symbolic-link target changes through directory notifications and a check when the editor regains focus, without periodic polling.
- Suppress repeated prompts for the same update and keep the current language server running if the replacement cannot be validated.

### Compatibility

- The minimum supported skelc remains v0.14.0.

## [0.12.0] - 2026-09-07

### Fixed

- Highlight keyword-named fields such as `data: list<TItem>` as identifiers while preserving declaration keyword highlighting.
- Remove `PermissionCode` from built-in type highlighting to match skelc v0.16.0; user-defined types can still use that name.

### Compatibility

- The minimum supported skelc remains v0.14.0. Use skelc v0.16.0 or newer for diagnostics and completion matching the updated permission-code syntax.

## [0.11.2] - 2026-09-05

### Changed

- Update vscode-languageclient to 10.1.1 and its LSP dependencies.

## [0.11.1] - 2026-08-17

### Changed

- Require skelc v0.14.0 and consume the default JSON `skelc version` result

## [0.11.0] - 2026-08-17

### Added

- Live `BREAKING` and `DANGEROUS` schema compatibility diagnostics against Git
  `HEAD` or an explicit source baseline
- Schema compatibility CodeLens and command with a complete formatted JSON diff
  report for the current in-memory domain
- Settings for compatibility diagnostics, compatible-change hints, CodeLens,
  and an explicit baseline path

### Changed

- Require skelc v0.13.0 or newer for schema compatibility protocol support

## [0.10.2] - 2026-08-13

### Changed

- Refresh the Marketplace icon to the current Skel brand mark

## [0.10.1] - 2026-07-30

### Added

- Context-aware decorator completion filtered by the following declaration,
  block, field, or argument, with decorators already present omitted

### Changed

- Require skelc v0.10.3 or newer for language-server support

### Fixed

- Scope workspace semantic diagnostics to one source directory so independent
  same-named domains do not report duplicate declarations
- Match `skelc check` by leaving imports unresolved during live editor
  diagnostics

## [0.10.0] - 2026-07-30

### Added

- Deprecated declaration and element presentation from `skelc lsp`
- Recoverable syntax and workspace semantic diagnostics with related locations and quick fixes
- Formatting, completion, hover details, hierarchical symbols, workspace symbols, and top-level declaration rename
- Context-aware completion for actor transports and config lifecycle values
- Remote workspace URI preservation and dynamic workspace-folder indexing

### Changed

- Require skelc v0.10.2 or newer for language-server support
- Require VS Code 1.91 or newer to match the language-client runtime
- Keep the minimum compatible skelc version in one checked configuration source
- Rename the Marketplace extension identity to `yorun.skeleton` and the display name to `Skeleton DSL Support`

### Fixed

- Reuse and dispose one Skel filesystem watcher across language-server restarts
- Fold `resource` declarations consistently with other top-level Skel declarations

## [0.9.0] - 2026-07-21

Initial public release.

### Included

- TextMate syntax highlighting and the Skel Dark color theme
- `skelc lsp` client with live syntax diagnostics and document symbols
- Go to Definition and Find All References across workspace Skel files
- Configurable `skelc.path` with automatic language-server restart
- Language-server trace, output, restart, and startup troubleshooting support
- Local, remote workspace, and untitled-document selectors

[Unreleased]: https://github.com/yorun-ai/skel-editor-support/compare/v0.17.0...HEAD
[0.17.0]: https://github.com/yorun-ai/skel-editor-support/compare/v0.16.0...v0.17.0
[0.16.0]: https://github.com/yorun-ai/skel-editor-support/compare/v0.15.0...v0.16.0
[0.15.0]: https://github.com/yorun-ai/skel-editor-support/compare/v0.14.0...v0.15.0
