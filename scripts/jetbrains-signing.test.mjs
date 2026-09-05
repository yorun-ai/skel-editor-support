import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Exercise the real Gradle providers without signing, packaging or publishing.
// Fake non-empty values suffice: this checks configuration, not cryptography.
test('optional signing uses absent providers and rejects partial configuration', async t => {
  const directory = mkdtempSync(join(tmpdir(), 'skel-signing-'));
  const init = join(directory, 'assert-signing.gradle');
  writeFileSync(init, `
gradle.projectsEvaluated {
    def signing = gradle.rootProject.extensions.getByName('intellijPlatform').signing
    def expected = System.getenv('EXPECT_SIGNING') == 'true'
    assert signing.certificateChain.isPresent() == expected
    assert signing.privateKey.isPresent() == expected
}
`);
  const env = { ...process.env };
  for (const key of ['JETBRAINS_CERTIFICATE_CHAIN', 'JETBRAINS_PRIVATE_KEY',
    'JETBRAINS_PRIVATE_KEY_PASSWORD', 'JETBRAINS_MARKETPLACE_TOKEN', 'EXPECT_SIGNING']) delete env[key];
  const cases = [
    ['unset', {}, true],
    ['empty', { JETBRAINS_CERTIFICATE_CHAIN: '', JETBRAINS_PRIVATE_KEY: '' }, true],
    ['both', { JETBRAINS_CERTIFICATE_CHAIN: 'fixture-cert', JETBRAINS_PRIVATE_KEY: 'fixture-key', EXPECT_SIGNING: 'true' }, true],
    ['certificate only', { JETBRAINS_CERTIFICATE_CHAIN: 'fixture-cert' }, false],
    ['key only', { JETBRAINS_PRIVATE_KEY: 'fixture-key' }, false],
  ];
  try {
    for (const [name, values, success] of cases) {
      await t.test(name, () => {
        const result = spawnSync('./gradlew', ['help', '--console=plain', '-I', init], {
          cwd: fileURLToPath(new URL('../editors/jetbrains/', import.meta.url)),
          env: { ...env, ...values }, encoding: 'utf8', timeout: 180_000,
        });
        assert.ifError(result.error);
        if (success) assert.equal(result.status, 0, result.stdout + result.stderr);
        else {
          assert.notEqual(result.status, 0);
          assert.match(result.stdout + result.stderr, /Set both JETBRAINS_CERTIFICATE_CHAIN and JETBRAINS_PRIVATE_KEY/);
        }
      });
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
