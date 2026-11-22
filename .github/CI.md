# CI and release lifecycle

Checks run before merging, with editor components selected by changed files.

| Event | Behavior |
| --- | --- |
| PR targeting `main` | Policy tests, checks and compatibility matrices for affected components only |
| Push/merge to `main` | No workflow; required checks run before squash merging |
| Push a `v*` tag | Validate source, prepare Draft, submit selected channels, then publish Release |
| Published GitHub Release | No workflow |
| Manual CI | Checks and matrices for the selected commit; `full=true` selects all components |
| Manual Publish | Recover publication for an existing tag using `tag` and `artifacts: all/vscode/npm` |

## CI selection

See [the changed-file table](../CONTRIBUTING.md#ci-scope). Documentation and unrelated changes run lightweight policy tests. Workflow YAML and actionlint configuration changes also run actionlint, without starting application suites. The required gate checks this optional lint job as well. No workflow-level path filter is used: `CI / Required Checks` must always report a result.

PRs test both the minimum and latest configured skelc for selected VS Code changes. Selected highlighter changes run the Node/peer matrix. Manual CI uses the same check depth; `full=true` deliberately selects all components.

Superseded PR runs are cancelled. The main rulesets require up-to-date PRs, successful `CI / Required Checks`, and squash merging. No duplicate main CI is needed. The required gate rejects failures, cancellations, missing selection outputs and unexpected skips.

Classification and the required gate have a 5-minute limit. Workflow lint has a 10-minute limit, package and highlighter checks have a 15-minute limit, and VS Code integration has a 30-minute limit. Individual LSP and Extension Host tests have 5- and 10-minute limits, respectively. Each publishing job has a 20-minute limit.

## Publishing

1. Prepare release changelog entries, pass required PR checks and squash merge. Source versions stay `0.0.0`.
2. Sync main and push a `vX.Y.Z` tag (excluding `v0.0.0`) at that commit; do not publish GitHub Release manually.
3. Publish validates tag checkout, ancestry on main, dated nonempty VS Code changelog and released minimum skelc version. It does not query CI history; merge checks are enforced before main is updated.
4. Prepare a Draft Release using the changelog notes. Store `publication.json` with the tag, commit SHA and required channels. Each successful submission uploads its own `publication-<channel>.json` receipt. These small JSON assets stay with the Release for durable cross-run recovery.
5. VS Code and npm run independently after validation and check out the validated SHA. Each job sets the release version in its temporary checkout and runs its package checks.
6. The final job requires every selected job to succeed and verifies all required receipts, including channels skipped during this run, before publishing GitHub Release.

To resume publication, rerun failed jobs or dispatch Publish for the same tag with
`all` or the failed channel. Publish uses matching receipts to resume pending
uploads. Recovery requires the source SHA and channel list recorded in the
draft manifest.

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
