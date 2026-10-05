# CI and release lifecycle

Checks run before merging, with editor components selected by changed files.

| Event | Behavior |
| --- | --- |
| PR targeting `main` | Policy tests, checks and compatibility matrices for affected components only |
| Push/merge to `main` | No workflow; required checks run before squash merging |
| Push a `v*` tag | Validate source, prepare Draft, submit selected channels, then publish Release |
| Published GitHub Release | No workflow |
| Manual CI | Checks and matrices for the selected commit; `full=true` selects all components |
| Manual Publish | Recover publication for an existing tag using `tag` and `artifacts: all/vscode/npm/jetbrains` |

## CI selection

See [the changed-file table](../CONTRIBUTING.md#ci-scope). Documentation and unrelated changes run lightweight policy tests. Workflow YAML and actionlint configuration changes also run actionlint, without starting application suites. The required gate checks this optional lint job as well. No workflow-level path filter is used: `CI / Required Checks` must always report a result.

PRs test both the minimum and latest configured skelc for selected VS Code changes. Selected highlighter changes run the Node/peer matrix; selected JetBrains changes run plugin tests and Plugin Verifier. Unselected components remain skipped. Manual CI uses the same check depth; `full=true` deliberately selects all components.

Superseded PR runs are cancelled. The main rulesets require up-to-date PRs, successful `CI / Required Checks`, and squash merging. No duplicate main CI is needed. The required gate rejects failures, cancellations, missing selection outputs and unexpected skips.

Jobs have explicit time limits: classification/gate 5 minutes, workflow lint 10, package/highlighter checks 15, VS Code integration 30, and JetBrains 60. Individual LSP tests are limited to 5 minutes, Extension Host tests to 10, Gradle tests to 15 and Plugin Verifier to 40. Publishing jobs have limits of 20 minutes for npm/VS Code and 60 for JetBrains, with a 10-minute upload/signing step.

JetBrains CI runs `node --test scripts/jetbrains-signing.test.mjs` against the real Gradle configuration for unset, empty, complete and each partial signing configuration. It uses fake values and `gradlew help`, so it never signs or uploads an artifact.

## Publishing

1. Prepare release changelog entries, pass required PR checks and squash merge. Source versions stay `0.0.0`.
2. Sync main and push a `vX.Y.Z` tag (excluding `v0.0.0`) at that commit; do not publish GitHub Release manually.
3. Publish validates tag checkout, ancestry on main, dated nonempty VS Code changelog and released minimum skelc version. It does not query CI history; merge checks are enforced before main is updated.
4. Prepare a Draft Release using the changelog notes. Store `publication.json` with the tag, commit SHA and required channels. Each successful submission uploads its own `publication-<channel>.json` receipt. These small JSON assets stay with the Release for durable cross-run recovery.
5. VS Code, npm and the enabled JetBrains channel run independently after validation, checking out the validated SHA. Package versions are injected only into temporary checkouts. Package checks and JetBrains release-artifact verification remain; server integration suites are not repeated during publication.

6. The final job requires all selected jobs to succeed and checks every required receipt, including channels skipped during this run. Only then publish GitHub Release. A JetBrains receipt confirms successful submission, not review approval or public availability.

Before checkout or SDK downloads, the JetBrains job checks that the token is non-empty and signing credentials are paired, without printing secret values. This preflight cannot establish token validity or permissions.

Author signing is optional: the Marketplace token alone is sufficient. Configure both certificate and private key to sign; configuring only one is rejected.

JetBrains publication remains opt-in through `JETBRAINS_MARKETPLACE_ENABLED=true` and its environment secrets. Selecting JetBrains explicitly while disabled fails validation. Selecting `all` includes JetBrains only when enabled.

For recovery, rerun failed jobs or manually dispatch Publish for the same tag with
`all` or the failed channel. Matching receipts skip already submitted channels,
so `all` can resume an incomplete release without duplicate uploads. The final
check always requires every channel recorded in the manifest, not just the
current selection. Changed source SHA or changed JetBrains enablement fails
validation; restore the original configuration instead of bypassing the requirement.

If a remote upload succeeded but the receipt upload failed, automatic recovery
cannot infer success safely. Check the exact version and artifact/source against
the channel and the successful upload step. Only after confirmation, run the
receipt command with that tag, original `RELEASE_COMMIT`, `GITHUB_REPOSITORY`,
`GH_TOKEN` and `PUBLICATION_CHANNEL`:

```sh
node scripts/release-publication.mjs record
```

Then dispatch recovery again. Never overwrite or republish an existing channel
version just to repair the receipt. Publication across marketplaces is not atomic;
a partial run can leave some versions available while GitHub Release remains Draft.

Already published Releases from the previous workflow have no manifest. They
retain the previous selective recovery behavior: select only the failed channel,
validate its job result, and leave the existing GitHub Release unchanged. No
receipts are retroactively invented for those releases.

Helpers come from the workflow revision and product sources from the validated
release SHA, allowing updated main to recover older tags. Runs for a tag are
serialized. Keep environment approvals and ensure deployment policies accept
version tags; changing this workflow does not change hosted environment rules.

## Local validation

```sh
node --test scripts/ci-scope.test.mjs scripts/release-policy.test.mjs scripts/release-publication.test.mjs
actionlint
git diff --check
```
