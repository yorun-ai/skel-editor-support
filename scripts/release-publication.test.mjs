import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, basename } from 'node:path';
import { publication } from './release-publication.mjs';

function fixture() {
  const assets = new Map();
  let release;
  const calls = [];
  const control = {};
  const env = { RELEASE_TAG: 'v1.2.3', RELEASE_COMMIT: 'a'.repeat(40), GITHUB_REPOSITORY: 'test/repo' };
  const run = (command, args) => {
    assert.equal(command, 'gh');
    calls.push(args);
    if (args[0] === 'api') return JSON.stringify([release ? [{ ...release, assets: [...assets.keys()].map(name => ({ name })) }] : []]);
    if (args[1] === 'create') { release = { tag_name: env.RELEASE_TAG, draft: true }; return ''; }
    if (args[1] === 'upload') {
      const name = basename(args[3]);
      if (name === control.failUpload) throw new Error('Receipt upload failed');
      assert.ok(!assets.has(name), 'receipts must not be overwritten');
      assets.set(name, readFileSync(args[3], 'utf8')); return '';
    }
    if (args[1] === 'download') {
      const name = args[args.indexOf('--pattern') + 1];
      if (!assets.has(name)) throw new Error('Missing receipt');
      writeFileSync(join(args[args.indexOf('--dir') + 1], name), assets.get(name)); return '';
    }
    if (args[1] === 'edit') { release.draft = false; return ''; }
    throw new Error('Unexpected operation');
  };
  const use = action => {
    const client = publication(env, run);
    try { return action(client); } finally { client.dispose(); }
  };
  return { env, assets, calls, use, control, makeLegacy() { release = { tag_name: env.RELEASE_TAG, draft: false }; assets.clear(); }, published: () => release?.draft === false };
}
const needs = (selected = ['vscode', 'npm'], failed) => ({
  validate: { result: 'success', outputs: Object.fromEntries(['vscode', 'npm'].map(channel => [channel, String(selected.includes(channel))])) },
  ...Object.fromEntries([['vscode', 'marketplace'], ['npm', 'npm']].map(([channel, job]) => [job, { result: job === failed ? 'failure' : selected.includes(channel) ? 'success' : 'skipped' }])),
});
test('partial success remains draft; a later single-channel recovery completes the release', () => {
  const f = fixture();
  assert.deepEqual(f.use(client => client.prepare('Notes')), []);
  f.use(client => client.record('vscode'));
  assert.throws(() => f.use(client => client.complete(needs())), /Missing receipt/);
  assert.equal(f.published(), false);
  assert.deepEqual(f.use(client => client.prepare('Notes')), ['vscode']);
  f.use(client => client.record('npm'));
  f.use(client => client.complete(needs(['npm'])));
  assert.equal(f.published(), true);
  const before = f.calls.filter(args => args[1] === 'edit').length;
  assert.deepEqual(f.use(client => client.prepare('Notes')), ['vscode', 'npm']);
  f.use(client => client.complete(needs([])));
  assert.equal(f.calls.filter(args => args[1] === 'edit').length, before);
});
test('source mismatches and changing required channels cannot bypass completion', () => {
  const f = fixture();
  f.use(client => client.prepare('Notes'));
  const manifest = JSON.parse(f.assets.get('publication.json'));
  f.assets.set('publication.json', JSON.stringify({ ...manifest, required: [...manifest.required, 'jetbrains'] }));
  assert.throws(() => f.use(client => client.prepare('Notes')), /changed/);
  assert.throws(() => f.use(client => client.complete(needs([]))), /manifest mismatch/);
  assert.equal(f.published(), false);
  f.assets.set('publication.json', JSON.stringify(manifest));
  f.env.RELEASE_COMMIT = 'b'.repeat(40);
  assert.throws(() => f.use(client => client.record('npm')), /mismatch/);
  f.env.RELEASE_COMMIT = 'a'.repeat(40);
  f.assets.set('publication-npm.json', JSON.stringify({ tag: 'v1.2.3', commit: 'b'.repeat(40), channel: 'npm', status: 'submitted' }));
  assert.throws(() => f.use(client => client.prepare('Notes')), /mismatch/);
});
test('registry/API failures do not become missing releases', () => {
  const f = fixture();
  assert.throws(() => publication(f.env, () => { throw new Error('API failure'); }), /API failure/);
});

test('a failed receipt write never authorizes completion', () => {
  const f = fixture();
  f.use(client => client.prepare('Notes'));
  f.use(client => client.record('vscode'));
  f.control.failUpload = 'publication-npm.json';
  assert.throws(() => f.use(client => client.record('npm')), /upload failed/);
  assert.throws(() => f.use(client => client.complete(needs())), /Missing receipt/);
  assert.equal(f.published(), false);
});
test('legacy published releases retain selective recovery without mutations', () => {
  const f = fixture();
  f.makeLegacy();
  assert.deepEqual(f.use(client => client.prepare('Notes')), []);
  f.use(client => client.record('npm'));
  f.use(client => client.complete(needs(['npm'])));
  assert.throws(() => f.use(client => client.complete(needs(['npm'], 'npm'))), /did not complete/);
  assert.ok(f.calls.every(args => args[0] === 'api'));
});
