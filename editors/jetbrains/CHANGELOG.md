# Changelog

## [Unreleased]

### Added

- Highlight the `open` service modifier.

### Compatibility

- `open service` language intelligence requires skelc v0.19.0 or newer; syntax highlighting works independently of the installed compiler.

## [0.13.0] - 2026-09-09

### Added

- Highlight the `api` modifier in service declarations.
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
- Remove `PermissionCode` from the shared built-in type vocabulary to match skelc v0.16.0. Capitalized user-defined names retain normal type highlighting.

### Compatibility

- The minimum supported skelc remains v0.14.0. Use skelc v0.16.0 or newer for diagnostics and completion matching the updated permission-code syntax.


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
