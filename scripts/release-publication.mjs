import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const channels = ['vscode', 'npm', 'jetbrains'];
const execute = (command, args) => execFileSync(command, args, { encoding: 'utf8' }).trim();

export function checkReceipt(receipt, expected) {
  for (const key of ['tag', 'commit', 'channel']) {
    if (receipt[key] !== expected[key]) throw new Error(`Publication receipt ${key} mismatch`);
  }
  if (receipt.status !== 'submitted') throw new Error('Publication was not submitted successfully');
}

export function publication(env = process.env, run = execute) {
  const tag = env.RELEASE_TAG;
  const repo = env.GITHUB_REPOSITORY;
  const commit = env.RELEASE_COMMIT;
  if (!/^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(tag) || tag === 'v0.0.0') throw new Error('Invalid release tag');
  if (!/^[0-9a-f]{40}$/.test(commit)) throw new Error('Invalid release commit');
  const gh = args => run('gh', [...args, '--repo', repo]);
  const releases = JSON.parse(run('gh', ['api', '--paginate', '--slurp', `repos/${repo}/releases?per_page=100`])).flat();
  const matching = releases.filter(release => release.tag_name === tag);
  if (matching.length > 1) throw new Error('Duplicate release');
  let release = matching[0];
  const required = ['vscode', 'npm', ...(env.JETBRAINS_ENABLED === 'true' ? ['jetbrains'] : [])];
  const legacy = release?.draft === false && !release.assets.some(asset => asset.name === 'publication.json');
  const directory = mkdtempSync(join(tmpdir(), 'skel-publication-'));
  const upload = (name, value) => {
    const file = join(directory, name);
    writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
    gh(['release', 'upload', tag, file]);
  };
  const download = name => {
    const file = join(directory, name);
    gh(['release', 'download', tag, '--pattern', name, '--dir', directory]);
    return JSON.parse(readFileSync(file, 'utf8'));
  };
  try {
    return {
      prepare(notes) {
        // Already-public releases from the previous workflow retain selective recovery.
        if (legacy) return [];
        if (!release) {
          const file = join(directory, 'notes.md');
          writeFileSync(file, notes);
          gh(['release', 'create', tag, '--verify-tag', '--draft', '--title', tag, '--notes-file', file]);
          release = { draft: true, assets: [] };
        }
        const manifestName = 'publication.json';
        if (release.assets.some(asset => asset.name === manifestName)) {
          const manifest = download(manifestName);
          if (manifest.tag !== tag || manifest.commit !== commit || JSON.stringify(manifest.required) !== JSON.stringify(required)) {
            throw new Error('Release source or required channels changed; restore the original configuration');
          }
        } else {
          if (!release.draft || release.assets.length !== 0) throw new Error('Release has no publication manifest; verify legacy publication manually');
          upload(manifestName, { tag, commit, required });
        }
        const completed = [];
        for (const channel of required) {
          if (release.assets.some(asset => asset.name === `publication-${channel}.json`)) {
            checkReceipt(download(`publication-${channel}.json`), { tag, commit, channel });
            completed.push(channel);
          }
        }
        return completed;
      },
      record(channel) {
        if (legacy && channels.includes(channel)) return;
        if (!channels.includes(channel) || !release?.draft) throw new Error('Recording requires a valid channel and unpublished Draft');
        const manifest = download('publication.json');
        if (manifest.tag !== tag || manifest.commit !== commit || !manifest.required.includes(channel)) throw new Error('Publication manifest mismatch');
        const name = `publication-${channel}.json`;
        if (release.assets.some(asset => asset.name === name)) {
          checkReceipt(download(name), { tag, commit, channel });
          return;
        }
        upload(name, { tag, commit, channel, status: 'submitted' });
      },
      complete(needs) {
        if (needs.validate?.result !== 'success') throw new Error('Release validation failed');
        for (const [channel, job] of [['vscode', 'marketplace'], ['npm', 'npm'], ['jetbrains', 'jetbrains']]) {
          const expected = needs.validate.outputs[channel] === 'true' ? 'success' : 'skipped';
          if (needs[job]?.result !== expected) throw new Error(`Publication job ${job} did not complete`);
        }
        if (legacy) return;
        const manifest = download('publication.json');
        if (manifest.tag !== tag || manifest.commit !== commit || JSON.stringify(manifest.required) !== JSON.stringify(required)) throw new Error('Publication manifest mismatch');
        for (const channel of required) checkReceipt(download(`publication-${channel}.json`), { tag, commit, channel });
        if (release.draft) gh(['release', 'edit', tag, '--verify-tag', '--draft=false']);
      },
      dispose() { rmSync(directory, { recursive: true, force: true }); },
    };
  } catch (error) {
    rmSync(directory, { recursive: true, force: true });
    throw error;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const client = publication();
  try {
    if (process.argv[2] === 'record') client.record(process.env.PUBLICATION_CHANNEL);
    else if (process.argv[2] === 'complete') client.complete(JSON.parse(process.env.NEEDS));
    else throw new Error('Expected record or complete');
  } finally { client.dispose(); }
}
