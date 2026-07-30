# Changelog

All notable changes to the Skel VS Code extension are documented in this file.

## [Unreleased]

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
