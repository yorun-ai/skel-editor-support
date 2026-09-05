import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export function validateRelease({ tag, sha, release, runs, artifacts = 'all', jetbrainsEnabled = false }) {
  if (!/^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(tag) || tag === 'v0.0.0') {
    throw new Error('Release tag must be vX.Y.Z, excluding v0.0.0');
  }
  if (release.tag_name !== tag || release.draft !== false || !release.published_at) {
    throw new Error(`Expected an existing published release for ${tag}`);
  }
  const latest = runs.filter(run => run.head_sha === sha && run.event === 'push' && run.head_branch === 'main')
    .sort((a, b) => b.id - a.id)[0];
  if (latest?.status !== 'completed' || latest?.conclusion !== 'success') {
    throw new Error(`Latest main-push CI for ${sha} must succeed (run ${latest?.id ?? 'missing'})`);
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
  const repo = env.GITHUB_REPOSITORY;
  const release = JSON.parse(run('gh', ['api', `repos/${repo}/releases/tags/${tag}`]));
  const pages = JSON.parse(run('gh', ['api', '--paginate', '--slurp',
    `repos/${repo}/actions/workflows/ci.yml/runs?event=push&branch=main&head_sha=${sha}&per_page=100`]));
  const selected = validateRelease({ tag, sha, release, runs: pages.flatMap(page => page.workflow_runs),
    artifacts: env.ARTIFACTS || 'all', jetbrainsEnabled: env.JETBRAINS_ENABLED === 'true' });
  const version = tag.slice(1);
  const changelog = readFileSync('editors/vscode/CHANGELOG.md', 'utf8');
  const heading = new RegExp(`^## \\[${version.replaceAll('.', '\\.')}\\] - \\d{4}-\\d{2}-\\d{2}$`, 'm');
  if (!heading.test(changelog)) throw new Error(`Missing dated changelog entry for ${tag}`);
  const { minimumVersion } = JSON.parse(readFileSync('editors/vscode/skelc-compatibility.json', 'utf8'));
  run('git', ['ls-remote', '--exit-code', '--tags', 'https://github.com/yorun-ai/skelc.git', `refs/tags/${minimumVersion}`]);
  appendFileSync(env.GITHUB_OUTPUT, Object.entries(selected).map(([key, value]) => `${key}=${value}\n`).join(''));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
