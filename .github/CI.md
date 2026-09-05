# CI and release lifecycle

This repository follows Vine's event lifecycle, with editor checks selected by changed files.

| Event | Behavior |
| --- | --- |
| PR targeting `main` | Policy tests and baseline checks for affected components only |
| Push/merge to `main` | Check the integrated commit; affected components also run compatibility matrices |
| Tag push | No workflow; a tag marks a version only |
| Published GitHub Release | Validate the release and exact main CI, then publish selected channels independently in parallel |
| Manual CI | Baseline checks for the selected commit; `full=true` checks all components and matrices |
| Manual Publish | Recover an existing published Release using `tag` and `artifacts: all/vscode/npm/jetbrains` |

## CI selection

See [the changed-file table](../CONTRIBUTING.md#ci-scope). Documentation and unrelated changes run lightweight policy tests. Workflow YAML and actionlint configuration changes also run actionlint, without starting application suites. The required gate checks this optional lint job as well. No workflow-level path filter is used: `CI / Required Checks` must always report a result.

PRs test the minimum skelc version and baseline JetBrains platform. On main, selected VS Code changes additionally test the latest configured skelc; selected highlighter changes run the Node/peer matrix; selected JetBrains changes run Plugin Verifier. Unselected components remain skipped, including on main. Full manual CI deliberately selects all components.

Superseded PR runs are cancelled. Main runs are isolated by commit SHA and never cancelled by a later merge, so a release candidate retains its CI result. The required gate rejects failures, cancellations and unexpected skips.

Jobs have explicit time limits: classification/gate 5 minutes, workflow lint 10, package/highlighter checks 15, VS Code integration 30, and JetBrains 60. Individual LSP tests are limited to 5 minutes, Extension Host tests to 10, Gradle tests to 15 and Plugin Verifier to 40. Publishing jobs have limits of 20 minutes for npm/VS Code and 60 for JetBrains, with a 10-minute upload/signing step.

JetBrains CI runs `node --test scripts/jetbrains-signing.test.mjs` against the real Gradle configuration for unset, empty, complete and each partial signing configuration. It uses fake values and `gradlew help`, so it never signs or uploads an artifact.

## Publishing

1. Prepare release changelog entries and merge the PR. Source versions stay `0.0.0`.
2. Wait for successful main-push CI on the exact merged commit.
3. Tag that commit with `vX.Y.Z` (excluding `v0.0.0`) and publish its GitHub Release.
4. Publish validates the existing published Release, tag checkout, ancestry on main, dated VS Code changelog and released minimum skelc version. It requires the latest main-push `ci.yml` run for the exact SHA to have completed successfully. PR CI, another SHA, missing, pending, failed or cancelled CI cannot satisfy this gate.
5. VS Code, npm and the enabled JetBrains channel run independently after validation, checking out the validated SHA. Package versions are injected only into temporary checkouts. Package checks and JetBrains release-artifact verification remain; server integration suites are not repeated during publication.

Before checkout or SDK downloads, the JetBrains job checks that the token is non-empty and signing credentials are paired, without printing secret values. This preflight cannot establish token validity or permissions.

Author signing is optional: the Marketplace token alone is sufficient. Configure both certificate and private key to sign; configuring only one is rejected.

JetBrains publication remains opt-in through `JETBRAINS_MARKETPLACE_ENABLED=true` and its environment secrets. Selecting JetBrains explicitly while disabled fails validation. Selecting `all` includes JetBrains only when enabled.

For recovery, rerun failed jobs or manually dispatch Publish for the existing published tag with only the failed channel selected. Do not select already published channels: existing versions are not overwritten. The validation helper comes from the workflow revision while product sources come from the release SHA, so helper fixes can recover older releases. Manual recovery must still pass release/main-CI validation; it cannot publish an arbitrary branch or draft Release. Runs for the same release tag are serialized.

## Local validation

```sh
node --test scripts/ci-scope.test.mjs scripts/release-policy.test.mjs
actionlint
git diff --check
```
