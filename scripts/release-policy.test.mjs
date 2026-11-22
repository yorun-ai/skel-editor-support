import test from 'node:test';
import assert from 'node:assert/strict';
import { validateRelease, main } from './release-policy.mjs';
const fixture = { tag: 'v1.2.3', sha: 'a'.repeat(40), release: { tag_name: 'v1.2.3', draft: false, published_at: '2026-09-05' } };
test('version tags select independent publication jobs', () => {
  assert.deepEqual(validateRelease(fixture), { commit: 'a'.repeat(40), vscode: true, npm: true });
  for (const artifacts of ['vscode', 'npm']) {
    const result = validateRelease({ ...fixture, artifacts });
    assert.deepEqual(Object.keys(result).filter(key => result[key] === true), [artifacts]);
  }
  assert.throws(() => validateRelease({ ...fixture, artifacts: 'other' }), /selection/);
});
test('invalid versions cannot publish', () => {
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

test('release orchestration validates artifacts without querying CI history', async () => {
  const { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const dir = mkdtempSync(join(tmpdir(), 'skel-release-policy-'));
  const cwd = process.cwd();
  try {
    process.chdir(dir);
    mkdirSync('editors/vscode', { recursive: true });
    writeFileSync('editors/vscode/CHANGELOG.md', '## [1.2.3] - 2026-09-05\n\n- Fixture.\n');
    writeFileSync('editors/vscode/skelc-compatibility.json', '{"minimumVersion":"v0.14.0"}');
    const output = join(dir, 'output');
    const calls = [];
    const run = (command, args) => {
      calls.push([command, ...args]);
      if (command === 'git') return args[0] === 'rev-parse' ? 'a'.repeat(40) : '';
      assert.deepEqual(args, ['api', '--paginate', '--slurp', 'repos/owner/repo/releases?per_page=100']);
      return JSON.stringify([[{ ...fixture.release, assets: [] }]]);
    };
    main({ RELEASE_TAG: 'v1.2.3', GITHUB_REPOSITORY: 'owner/repo', GITHUB_OUTPUT: output, ARTIFACTS: 'npm' }, run);
    assert.equal(readFileSync(output, 'utf8'), `commit=${'a'.repeat(40)}\nvscode=false\nnpm=true\n`);
    assert.equal(calls.filter(call => call[0] === 'gh').length, 1);
    assert.ok(calls.some(call => call.includes('refs/tags/v0.14.0')));
    writeFileSync(output, '');
    writeFileSync('editors/vscode/CHANGELOG.md', '## [Unreleased]\n');
    assert.throws(() => main({ RELEASE_TAG: 'v1.2.3', GITHUB_REPOSITORY: 'owner/repo', GITHUB_OUTPUT: output }, run), /changelog/);
    assert.equal(readFileSync(output, 'utf8'), '');
  } finally {
    process.chdir(cwd);
    rmSync(dir, { recursive: true, force: true });
  }
});
