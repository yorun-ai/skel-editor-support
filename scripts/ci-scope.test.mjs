import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { classifyChanges } from './ci-scope.mjs';

const active = paths => Object.entries(classifyChanges(paths)).filter(([, value]) => value).map(([key]) => key);

test('docs and unrelated changes never select application suites', () => {
  for (const path of ['README.md', 'editors/jetbrains/README.md', '.github/dependabot.yml', 'scripts/ci-scope.mjs', 'notes.txt']) {
    assert.deepEqual(active([path]), [], path);
  }
});
test('JetBrains code only selects JetBrains', () => {
  assert.deepEqual(active(['editors/jetbrains/build.gradle.kts']), ['jetbrains']);
});
test('VS Code runtime selects only its package and integration tests', () => {
  assert.deepEqual(active(['editors/vscode/src/extension.js']), ['node', 'vscode_package', 'vscode']);
});
test('VS Code assets and themes only require package validation', () => {
  for (const path of ['editors/vscode/assets/icon.png', 'editors/vscode/themes/skel-dark-color-theme.json']) {
    assert.deepEqual(active([path]), ['node', 'vscode_package']);
  }
});
test('frontend adapters do not trigger either IDE', () => {
  assert.deepEqual(active(['packages/highlight/src/prism.js']), ['node', 'highlight']);
});
test('shared inputs select their actual consumers', () => {
  assert.deepEqual(active(['packages/highlight/src/language.js']), ['node', 'vscode_package', 'highlight', 'jetbrains']);
  assert.deepEqual(active(['packages/highlight/test/fixtures/example.skel']), ['node', 'highlight', 'jetbrains']);
  assert.deepEqual(active(['packages/highlight/src/skel.tmLanguage.json']), ['node', 'vscode_package', 'vscode', 'highlight']);
  assert.deepEqual(active(['editors/vscode/skelc-compatibility.json']), ['node', 'vscode_package', 'vscode', 'jetbrains']);
});
test('npm dependencies and asset preparation do not trigger Gradle', () => {
  for (const path of ['package-lock.json', 'package.json', '.npmrc', 'scripts/prepare-assets.js']) {
    assert.deepEqual(active([path]), ['node', 'vscode_package', 'vscode', 'highlight']);
  }
});
test('mixed changes union scopes, including deleted/renamed paths from git diff', () => {
  assert.deepEqual(active(['editors/vscode/src/old.js', 'editors/jetbrains/new file.kt']),
    ['node', 'vscode_package', 'vscode', 'jetbrains']);
});
test('full verification requires an explicit opt-in', () => {
  assert.ok(Object.values(classifyChanges([], true)).every(Boolean));
  assert.deepEqual(active([]), []);
});
test('CLI treats pushes and PRs identically and handles NUL-separated paths', () => {
  const directory = mkdtempSync(join(tmpdir(), 'skel-ci-scope-'));
  try {
    for (const event of ['push', 'pull_request', 'workflow_dispatch']) {
      const output = join(directory, event);
      const result = spawnSync(process.execPath, ['scripts/ci-scope.mjs'], {
        input: 'editors/vscode/src/new file.js\0README.md\0', encoding: 'utf8',
        env: { ...process.env, CI_EVENT_NAME: event, FULL_CI: 'false', GITHUB_OUTPUT: output },
      });
      assert.equal(result.status, 0, result.stderr);
      assert.match(readFileSync(output, 'utf8'), /vscode=true/);
      assert.match(readFileSync(output, 'utf8'), /jetbrains=false/);
      assert.match(readFileSync(output, 'utf8'), /full=false/);
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('workflow diffs PRs, pushes, initial pushes and manual commits without forcing full CI', () => {
  const directory = mkdtempSync(join(tmpdir(), 'skel-ci-diff-'));
  const workflow = readFileSync('.github/workflows/ci.yml', 'utf8');
  const shell = workflow.split('      - name: Select checks')[1]
    .split('        run: |\n')[1].split('\n\n  check:')[0]
    .split('\n').map(line => line.slice(10)).join('\n');
  const git = (...args) => {
    const result = spawnSync('git', args, { cwd: directory, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    return result.stdout.trim();
  };
  const run = (event, base, head, full = false) => {
    const output = join(directory, 'output');
    writeFileSync(output, '');
    const result = spawnSync('bash', ['-eo', 'pipefail', '-c', shell], {
      cwd: directory, encoding: 'utf8',
      env: { ...process.env, CI_EVENT_NAME: event, BASE_SHA: base, HEAD_SHA: head,
        FULL_CI: String(full), GITHUB_OUTPUT: output },
    });
    assert.equal(result.status, 0, result.stderr);
    return Object.fromEntries(readFileSync(output, 'utf8').trim().split('\n').map(line => line.split('=')));
  };
  try {
    git('init', '-q');
    git('config', 'user.name', 'CI test');
    git('config', 'user.email', 'ci@example.invalid');
    mkdirSync(join(directory, 'scripts'));
    writeFileSync(join(directory, 'scripts/ci-scope.mjs'), readFileSync('scripts/ci-scope.mjs'));
    git('add', '.'); git('commit', '-qm', 'initial');
    const base = git('rev-parse', 'HEAD');
    assert.equal(run('workflow_dispatch', '', base).node, 'false');
    mkdirSync(join(directory, 'editors/vscode/src'), { recursive: true });
    writeFileSync(join(directory, 'editors/vscode/src/client.js'), '// fixture');
    git('add', '.'); git('commit', '-qm', 'client');
    const head = git('rev-parse', 'HEAD');
    for (const [event, before] of [['pull_request', base], ['push', base],
      ['push', '0'.repeat(40)], ['workflow_dispatch', '']]) {
      const scope = run(event, before, head);
      assert.equal(scope.vscode, 'true');
      assert.equal(scope.jetbrains, 'false');
      assert.equal(scope.full, 'false');
    }
    assert.ok(Object.values(run('workflow_dispatch', '', head, true)).every(value => value === 'true'));
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('required gate accepts scoped main matrices and rejects unexpected skips or cancellations', () => {
  const workflow = readFileSync('.github/workflows/ci.yml', 'utf8');
  const shell = workflow.split('      - name: Verify CI results')[1].split('        run: |\n')[1]
    .split('\n').map(line => line.slice(10)).join('\n');
  for (const extended of [false, true]) {
    for (const paths of [['.github/workflows/publish.yml'], [], ['editors/jetbrains/src/Test.kt'], ['packages/highlight/src/prism.js'], ['editors/vscode/src/client.js']]) {
      const scope = classifyChanges(paths);
      const needs = { changes: { result: 'success', outputs: Object.fromEntries(Object.entries(scope).map(([k, v]) => [k, String(v)])) } };
      for (const [job, selected] of Object.entries({ check: scope.node, vscode: scope.vscode,
        workflow: scope.workflow, jetbrains: scope.jetbrains, 'highlight-compatibility': scope.highlight && extended })) {
        needs[job] = { result: selected ? 'success' : 'skipped' };
      }
      const run = () => spawnSync('bash', ['-eo', 'pipefail', '-c', shell], {
        encoding: 'utf8', env: { ...process.env, NEEDS: JSON.stringify(needs), EXTENDED: String(extended) },
      });
      assert.equal(run().status, 0);
      const workflowResult = needs.workflow.result;
      needs.workflow.result = 'cancelled';
      assert.notEqual(run().status, 0);
      needs.workflow.result = scope.workflow ? 'skipped' : 'success';
      assert.notEqual(run().status, 0);
      needs.workflow.result = workflowResult;
      needs.changes.result = 'cancelled';
      assert.notEqual(run().status, 0);
      needs.changes.result = 'success';
      needs.jetbrains.result = scope.jetbrains ? 'skipped' : 'success';
      assert.notEqual(run().status, 0);
    }
  }
});

test('workflow changes select lint without application suites', () => {
  for (const path of ['.github/workflows/ci.yml', '.github/workflows/publish.yml', '.github/actionlint.yaml']) {
    assert.deepEqual(active([path]), ['workflow']);
  }
  assert.deepEqual(active(['scripts/jetbrains-signing.test.mjs']), ['jetbrains']);
});
