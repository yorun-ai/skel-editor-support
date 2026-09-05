# Skel Language Support for JetBrains

Skel editing for IntelliJ Platform 2025.2.1 and newer (minimum build 252.25557.131). Plugin ID: `ai.yorun.skel`.

## Features

- `.skel` file recognition, syntax highlighting, configurable colors, comment toggling, bracket matching and quote insertion
- Diagnostics, completion, documentation, definitions, references, document/workspace symbols, formatting and rename through `skelc lsp`
- Schema compatibility diagnostics, with configurable baseline and compatible-change hints
- Project-specific executable path and enable/disable setting
- Language Services status widget and **Tools | Restart Skel Language Server**

The plugin uses shared Skel vocabulary for lexical highlighting and leaves semantic analysis to skelc. The flat PSI tree is for editor APIs only. Lexical highlighting is independent of the language server and does not exactly reproduce every contextual TextMate scope.

## Compatibility

The minimum IDE version is **2025.2.1**. Compile and test against GoLand 2025.2.1 using Java 21. The verification matrix covers GoLand and IntelliJ IDEA at 2025.2.1 and 2026.2.2. There is no fixed upper build bound; newer IDE versions are allowed, but are not guaranteed compatible until verified. Other IntelliJ Platform products may be compatible but require product-specific testing before claiming support. No Go plugin APIs are required.

Language intelligence requires the JetBrains `com.intellij.modules.lsp` module and **skelc v0.14.0 or newer**. Without that module, the plugin provides basic highlighting and editing only. Local files in trusted projects are supported. Remote Development and virtual files have not been validated.

Standard LSP capabilities depend on the server and IDE. Diagnostics, completion, hover, definitions, references and document formatting work on the baseline. Document/workspace symbols require IDE 2025.3+, and LSP rename requires 2026.1.1+. See the [JetBrains LSP feature matrix](https://plugins.jetbrains.com/docs/intellij/language-server-protocol.html#supported-features). The VS Code-specific schema JSON report interface is not implemented; schema CodeLens is disabled to avoid presenting an action without a report viewer. Use `skelc schema diff` for a complete report. No parser, formatter, or analyzer is copied from skelc.

## Install and configure

Install **Skel Language Support** from Marketplace when available, or build the plugin ZIP as described below and use **Settings | Plugins | gear | Install Plugin from Disk**. Restart if prompted. Marketplace availability is subject to JetBrains review.

For language intelligence, install skelc:

```sh
go install go.yorun.ai/skelc/cmd/skelc@latest
skelc version
```

Open **Settings | Languages & Frameworks | Skel** and set the executable to `skelc` or an absolute path. Do not add arguments or surrounding shell quotes. Saving settings restarts the server for this project. Schema baseline paths resolve from the domain source directory, not the IDE project root.

Open a `.skel` file in a trusted project. The plugin starts `skelc version` with a five-second timeout, validates compatibility, and then starts `skelc lsp` over standard input/output. If you trust a previously untrusted project after opening the file, use **Tools | Restart Skel Language Server**.

If startup fails, check the Language Services widget, executable path, and `skelc version`. Protocol logging is available through **Help | Diagnostic Tools | Debug Log Settings** by adding `#com.intellij.platform.lsp`; logs are in the IDE log directory. Never share logs without reviewing their contents.

## Development

Prerequisites: Node.js 22+, JDK 21, and a compatible skelc for integration tests. Gradle is pinned through the checked-in wrapper. From the repository root run `npm ci` and `npm run check`, then:

```sh
cd editors/jetbrains
SKELC_PATH=/absolute/path/to/skelc ./gradlew test
./gradlew runIde
```

The first run downloads the pinned SDK and test dependencies. To reuse an installed GoLand on macOS:

```sh
JAVA_HOME=/absolute/path/to/GoLand.app/Contents/jbr/Contents/Home \
SKELC_PATH=/absolute/path/to/skelc \
./gradlew test -PlocalPlatformPath=/absolute/path/to/GoLand.app/Contents
```

Without `SKELC_PATH`, real server integration is explicitly skipped; lexer, version policy, and IDE fixture tests still run. CI sets it and runs against the minimum supported skelc version. PRs and main pushes run baseline tests only when JetBrains code or its shared inputs change. The full Plugin Verifier matrix runs only when explicitly requested with manual CI input `full=true`, or during publishing. Release publishing always runs tests and the full matrix. Tests cover token restart boundaries, incomplete edits, shared fixtures, comment/bracket/quote behavior, LSP initialize/open/change/symbols/format/shutdown against the real server, and startup/restart/disable through the IDE LSP manager.

## Packaging and publishing

```sh
./gradlew test verifyPlugin buildPlugin
```

For local verification against an installed IDE, add both `-PlocalPlatformPath=/path/to/IDE/Contents` and `-PlocalVerificationPath=/path/to/IDE/Contents`. Omitting the verification override downloads the configured GoLand and IDEA verification targets.

The ZIP is written under `build/distributions/`. Local builds use version `0.0.0`; for a release pass `-PpluginVersion=X.Y.Z`. Keep generated files out of Git. The plugin includes the repository Apache-2.0 license.

For first publication, create/select the Yorun Vendor profile on JetBrains Marketplace, prepare the listing and screenshots, configure signing, run `signPlugin`, and manually upload the signed ZIP. Marketplace review is required. See the [official publishing guide](https://plugins.jetbrains.com/docs/intellij/publishing-plugin.html).

For later releases, the repository Publish workflow has a separate JetBrains job. After the first manual upload, set repository variable `JETBRAINS_MARKETPLACE_ENABLED` to `true`, create the `jetbrains-marketplace` GitHub environment, and configure these secrets in it:

- `JETBRAINS_MARKETPLACE_TOKEN`
- `JETBRAINS_CERTIFICATE_CHAIN`
- `JETBRAINS_PRIVATE_KEY`
- `JETBRAINS_PRIVATE_KEY_PASSWORD`

A published `v<version>` GitHub Release injects the version through Gradle, validates compatibility, signs and uploads the plugin. Keep the job disabled until the first listing and credentials are ready. Do not publish version `0.0.0`. Publication does not bypass Marketplace review.
