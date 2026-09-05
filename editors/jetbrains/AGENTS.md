# Skel JetBrains Plugin Guidelines

- This is an independent Gradle/Kotlin project inside skel-editor-support, not an npm workspace package.
- Target IntelliJ Platform 2026.2 (build 262), Java 25, and the public LSP client API. Do not depend on Go-specific APIs.
- Keep lexical highlighting local and language intelligence in `skelc lsp`. The flat PSI tree exists only to support editor APIs, not to reproduce the Skel parser.
- Generate vocabulary resources from `packages/highlight/src/language.js`; do not maintain duplicate keyword lists. Read the existing VS Code compatibility manifest as the shared minimum skelc version.
- LSP registrations belong in the optional `skel-lsp.xml` descriptor. Basic editing must load without the LSP module or a skelc installation.
- Keep executable paths as one process argument; never execute a shell command. Do not start skelc for untrusted projects.
- Source pluginVersion remains `0.0.0`; pass `-PpluginVersion` only for packaging a release. Never commit Gradle caches, generated resources, build output, signed packages, or credentials. Commit the Gradle wrapper, including its JAR and distribution checksum.
- Read README.md for the development prerequisites and supported capability boundaries.
- After changes run repository `npm run check`, then `SKELC_PATH=/absolute/path/to/skelc ./gradlew test`. Run `verifyPlugin` before publishing and `git diff --check` before handoff.
- Use `-PlocalPlatformPath=/absolute/path/to/IDE/Contents` to test with an installed macOS IDE. Otherwise Gradle explicitly downloads the pinned GoLand SDK. A clean CI run requires network access.
