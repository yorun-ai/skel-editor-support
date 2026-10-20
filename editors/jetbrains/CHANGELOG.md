# Changelog

## [Unreleased]

## [0.19.0] - 2026-10-21

### Added

- Highlight abstract config declarations (`abs config`) and config adoption (`config AppConfig = BaseAbsConfig`), including imported sources, across shared highlighting and editor integrations.

### Compatibility

- Validate editor integrations with skelc v0.33.0. The minimum supported skelc remains v0.14.0; language intelligence for abstract configs and config adoption requires v0.33.0 or newer.
- Cover abstract configs, versioned config names, keyword-named fields, and local and cross-domain adoption with highlighting and real language-server tests.

## [0.18.0] - 2026-10-11

### Changed

- Remove retired actor transport keywords from shared syntax highlighting, editor fixtures and documentation.
- Use `go install go.yorun.ai/skel/cmd/skelc@latest` as the compiler installation command.

### Compatibility

- Validate editor integrations with skelc v0.32.0. The minimum supported skelc remains v0.14.0.
- Cover versioned contract names such as `OrderApiServiceV999` and multiline, comma-separated actor audiences with shared highlighting and real language-server tests. Language intelligence for this syntax requires skelc v0.32.0 or newer.
- Clarify that strict mode has the same validation behavior as the default with skelc v0.31.0 or newer, which rejects legacy bare `auth` and `noauth` syntax.

### Maintenance

- Publish GitHub Release only after all enabled distribution channels report successful submission. JetBrains Marketplace review may finish later.

## [0.17.0] - 2026-10-05

### Added

- Highlight `auth required`, `auth optional`, `auth anonymous` and `auth off` across the shared TextMate grammar, frontend adapters, VS Code and JetBrains.

### Compatibility

- Validate editor integrations with skelc v0.26.0. The minimum supported skelc remains v0.14.0.
- Authentication syntax diagnostics and completion require skelc v0.26.0; syntax highlighting works independently of the installed compiler.
- Keep highlighting legacy bare `auth` and `noauth` syntax.

## [0.15.0] - 2026-10-02

### Compatibility

- Validate skelc v0.23.0 configs containing nested data, binary values and nullable generic parameters, with shared highlighting and real language-server tests.
- Test both minimum and latest configured skelc versions. The minimum remains v0.14.0; the new config capabilities require v0.23.0 or newer.
- Keep the minimum IDE at 2025.2.1 and retain the existing LSP compatibility APIs.

### Maintenance

- Update Kotlin, IntelliJ Platform Gradle plugin and Gradle dependencies.
- Make test-server shutdown reliable and retain IDE verification before merging and publishing.

## [0.14.0] - 2026-09-09

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

[Unreleased]: https://github.com/yorun-ai/skel-editor-support/compare/v0.19.0...HEAD
[0.19.0]: https://github.com/yorun-ai/skel-editor-support/compare/v0.18.0...v0.19.0
[0.18.0]: https://github.com/yorun-ai/skel-editor-support/compare/v0.17.0...v0.18.0
[0.17.0]: https://github.com/yorun-ai/skel-editor-support/compare/v0.16.0...v0.17.0
[0.15.0]: https://github.com/yorun-ai/skel-editor-support/compare/v0.14.0...v0.15.0
