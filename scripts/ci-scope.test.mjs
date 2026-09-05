import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyChanges } from './ci-scope.mjs';

test('documentation-only PR skips expensive jobs', () => {
  assert.deepEqual(classifyChanges(['README.md', 'editors/jetbrains/README.md']),
    { node: false, vscode: false, highlight: false, jetbrains: false, full: false });
});
test('JetBrains changes do not run VS Code integration', () => {
  assert.deepEqual(classifyChanges(['editors/jetbrains/build.gradle.kts']),
    { node: false, vscode: false, highlight: false, jetbrains: true, full: false });
});
test('VS Code changes do not run JetBrains', () => {
  assert.equal(classifyChanges(['editors/vscode/src/extension.js']).jetbrains, false);
  assert.equal(classifyChanges(['editors/vscode/src/extension.js']).vscode, true);
});
test('shared vocabulary and compatibility affect both clients', () => {
  for (const path of ['packages/highlight/src/language.js', 'editors/vscode/skelc-compatibility.json']) {
    const scope = classifyChanges([path]);
    assert.ok(scope.node && scope.vscode && scope.jetbrains);
  }
});
test('unknown paths and workflow edits conservatively run all affected jobs', () => {
  for (const path of ['package-lock.json', '.github/workflows/ci.yml', 'new file.js']) {
    const scope = classifyChanges([path]);
    assert.ok(scope.node && scope.vscode && scope.highlight && scope.jetbrains);
  }
});
test('push and manual full runs include every job even without code changes', () => {
  assert.ok(Object.values(classifyChanges(['README.md'], true)).every(Boolean));
});
