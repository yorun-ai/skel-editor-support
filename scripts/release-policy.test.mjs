import test from 'node:test';
import assert from 'node:assert/strict';
import { validateRelease, main } from './release-policy.mjs';
const good = { id: 1, head_sha: 'abc', event: 'push', head_branch: 'main', status: 'completed', conclusion: 'success' };
const fixture = { tag: 'v1.2.3', sha: 'abc', release: { tag_name: 'v1.2.3', draft: false, published_at: '2026-09-05' }, runs: [good] };
test('published releases select independent publication jobs', () => {
  assert.deepEqual(validateRelease(fixture), { commit: 'abc', vscode: true, npm: true, jetbrains: false });
  for (const artifacts of ['vscode', 'npm', 'jetbrains']) {
    const result = validateRelease({ ...fixture, artifacts, jetbrainsEnabled: true });
    assert.deepEqual(Object.keys(result).filter(key => result[key] === true), [artifacts]);
  }
  assert.throws(() => validateRelease({ ...fixture, artifacts: 'jetbrains' }), /disabled/);
  assert.throws(() => validateRelease({ ...fixture, artifacts: 'other' }), /selection/);
});
test('release needs exact main-push CI, including latest rerun status', () => {
  for (const runs of [[], [{ ...good, head_sha: 'other' }], [{ ...good, event: 'pull_request' }],
    [{ ...good, head_branch: 'topic' }], ...['failure', 'cancelled', 'skipped', null].map(conclusion => [good, { ...good, id: 2, conclusion }]),
    [good, { ...good, id: 2, status: 'in_progress' }]]) {
    assert.throws(() => validateRelease({ ...fixture, runs }), /main-push CI/);
  }
});
test('drafts, absent releases and invalid versions cannot publish', () => {
  for (const release of [{}, { ...fixture.release, draft: true }, { ...fixture.release, tag_name: 'v1.2.4' }]) {
    assert.throws(() => validateRelease({ ...fixture, release }), /published release/);
  }
  for (const tag of ['v0.0.0', 'v01.2.3', 'v1.2.3-beta', 'main', 'v1.2.3\n']) {
    assert.throws(() => validateRelease({ ...fixture, tag }));
  }
});
test('tag mismatch and off-main commits fail before any API or publication', () => {
  for (const mismatch of [true, false]) {
    const calls = [];
    assert.throws(() => main({ RELEASE_TAG: 'v1.2.3' }, (command, args) => {
      calls.push(command);
      if (args[0] === 'rev-parse') return args.includes('--verify') && mismatch ? 'other' : 'abc';
      if (args[0] === 'merge-base') throw new Error('off main');
      return '';
    }));
    assert.ok(calls.every(command => command === 'git'));
  }
});

test('release orchestration queries exact main CI and writes outputs only after all checks pass', async () => {
  const { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const dir = mkdtempSync(join(tmpdir(), 'skel-release-policy-'));
  const cwd = process.cwd();
  try {
    process.chdir(dir);
    mkdirSync('editors/vscode', { recursive: true });
    writeFileSync('editors/vscode/CHANGELOG.md', '## [1.2.3] - 2026-09-05\n');
    writeFileSync('editors/vscode/skelc-compatibility.json', '{"minimumVersion":"v0.14.0"}');
    const output = join(dir, 'output');
    const calls = [];
    const run = (command, args) => {
      calls.push([command, ...args]);
      if (command === 'git') return args[0] === 'rev-parse' ? 'abc' : '';
      if (args.includes('--paginate')) return JSON.stringify([{ workflow_runs: [good] }]);
      return JSON.stringify(fixture.release);
    };
    main({ RELEASE_TAG: 'v1.2.3', GITHUB_REPOSITORY: 'owner/repo', GITHUB_OUTPUT: output, ARTIFACTS: 'npm' }, run);
    assert.equal(readFileSync(output, 'utf8'), 'commit=abc\nvscode=false\nnpm=true\njetbrains=false\n');
    assert.ok(calls.some(call => call.includes('repos/owner/repo/actions/workflows/ci.yml/runs?event=push&branch=main&head_sha=abc&per_page=100')));
    assert.ok(calls.some(call => call.includes('refs/tags/v0.14.0')));
    writeFileSync(output, '');
    writeFileSync('editors/vscode/CHANGELOG.md', '## [Unreleased]\n');
    assert.throws(() => main({ RELEASE_TAG: 'v1.2.3', GITHUB_OUTPUT: output }, run), /changelog/);
    assert.equal(readFileSync(output, 'utf8'), '');
  } finally {
    process.chdir(cwd);
    rmSync(dir, { recursive: true, force: true });
  }
});
