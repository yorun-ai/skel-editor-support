import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { publication } from './release-publication.mjs';

export function validateRelease({ tag, sha, artifacts = 'all', jetbrainsEnabled = false }) {
  if (!/^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(tag) || tag === 'v0.0.0') {
    throw new Error('Release tag must be vX.Y.Z, excluding v0.0.0');
  }
  if (!['all', 'vscode', 'npm', 'jetbrains'].includes(artifacts)) throw new Error('Invalid artifact selection');
  if (artifacts === 'jetbrains' && !jetbrainsEnabled) throw new Error('JetBrains publication is disabled');
  return {
    commit: sha,
    vscode: artifacts === 'all' || artifacts === 'vscode',
    npm: artifacts === 'all' || artifacts === 'npm',
    jetbrains: jetbrainsEnabled && (artifacts === 'all' || artifacts === 'jetbrains'),
  };
}

export function main(env = process.env, run = (command, args) => execFileSync(command, args, { encoding: 'utf8' }).trim()) {
  const tag = env.RELEASE_TAG;
  // Validate before using the tag in refs or API paths.
  if (!/^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(tag) || tag === 'v0.0.0') throw new Error('Invalid release tag');
  const sha = run('git', ['rev-parse', 'HEAD']);
  if (run('git', ['rev-parse', '--verify', `refs/tags/${tag}^{commit}`]) !== sha) throw new Error('Tag does not match checkout');
  run('git', ['fetch', 'origin', 'main']);
  run('git', ['merge-base', '--is-ancestor', sha, 'refs/remotes/origin/main']);
  const selected = validateRelease({ tag, sha,
    artifacts: env.ARTIFACTS || 'all', jetbrainsEnabled: env.JETBRAINS_ENABLED === 'true' });
  const version = tag.slice(1);
  const changelog = readFileSync('editors/vscode/CHANGELOG.md', 'utf8');
  const heading = new RegExp(`^## \\[${version.replaceAll('.', '\\.')}\\] - \\d{4}-\\d{2}-\\d{2}$`, 'm');
  if (!heading.test(changelog)) throw new Error(`Missing dated changelog entry for ${tag}`);
  const { minimumVersion } = JSON.parse(readFileSync('editors/vscode/skelc-compatibility.json', 'utf8'));
  run('git', ['ls-remote', '--exit-code', '--tags', 'https://github.com/yorun-ai/skelc.git', `refs/tags/${minimumVersion}`]);
  const section = changelog.slice(changelog.search(heading)).split('\n').slice(1).join('\n').split(/^## /m)[0].trim();
  if (!section) throw new Error('Empty changelog entry');
  const client = publication({ ...env, RELEASE_COMMIT: sha }, run);
  try {
    for (const channel of client.prepare(section)) selected[channel] = false;
  } finally { client.dispose(); }
  appendFileSync(env.GITHUB_OUTPUT, Object.entries(selected).map(([key, value]) => `${key}=${value}\n`).join(''));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
