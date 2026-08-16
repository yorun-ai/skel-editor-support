# Changelog

All notable changes to the Skel VS Code extension are documented in this file.

## [Unreleased]

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
