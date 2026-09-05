# Changelog

## [Unreleased]

## [0.11.2] - 2026-09-05

### Added

- Skel Language Support for IntelliJ Platform 2025.2.1 and newer, using Java 21.
- Local syntax highlighting, configurable colors, comments, brackets and quotes.
- skelc LSP integration for diagnostics, completion, navigation, formatting and supported rename capabilities.
- Executable settings, version checks, schema diagnostic options and restart/status UI.
- Automatic Marketplace publication with optional author signing.

### Compatibility

- Keep the backward-compatible LSP API and allow newer IDE builds without a fixed upper bound.
- Verify GoLand and IntelliJ IDEA at 2025.2.1 and 2026.2.2.
