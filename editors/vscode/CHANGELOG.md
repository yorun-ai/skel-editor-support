# Changelog

All notable changes to the Skel VS Code extension are documented in this file.

## [Unreleased]

### Added

- Recoverable syntax and workspace semantic diagnostics with related locations and quick fixes
- Formatting, completion, hover details, hierarchical symbols, workspace symbols, and top-level declaration rename

### Changed

- Require skelc v0.9.4 or newer for language-server support

## [0.9.0] - 2026-07-21

Initial public release.

### Included

- TextMate syntax highlighting and the Skel Dark color theme
- `skelc lsp` client with live syntax diagnostics and document symbols
- Go to Definition and Find All References across workspace Skel files
- Configurable `skelc.path` with automatic language-server restart
- Language-server trace, output, restart, and startup troubleshooting support
- Local, remote workspace, and untitled-document selectors
