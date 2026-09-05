import { readFileSync, appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export function classifyChanges(paths, full = false) {
  const scope = { node: full, vscode_package: full, vscode: full, highlight: full, jetbrains: full, workflow: full, full };
  for (const path of paths) {
    if (/\.md$/.test(path)) continue;
    if (path.startsWith('.github/workflows/') || path === '.github/actionlint.yaml') scope.workflow = true;
    else if (path === 'scripts/jetbrains-signing.test.mjs') scope.jetbrains = true;
    else if (path.startsWith('editors/jetbrains/')) scope.jetbrains = true;
    else if (path === 'editors/vscode/skelc-compatibility.json') {
      scope.vscode_package = scope.vscode = scope.jetbrains = true;
    } else if (path.startsWith('editors/vscode/')) {
      scope.vscode_package = true;
      if (!/^editors\/vscode\/(assets|themes)\//.test(path)) scope.vscode = true;
    } else if (path.startsWith('packages/highlight/')) {
      scope.highlight = true;
      if (path === 'packages/highlight/src/language.js' || path.startsWith('packages/highlight/test/fixtures/')) {
        scope.jetbrains = true;
      }
      if (['packages/highlight/src/language.js', 'packages/highlight/package.json'].includes(path)) scope.vscode_package = true;
      if (path === 'packages/highlight/src/skel.tmLanguage.json') scope.vscode_package = scope.vscode = true;
    } else if (['package.json', 'package-lock.json', '.npmrc', 'scripts/prepare-assets.js'].includes(path)) {
      scope.highlight = scope.vscode_package = scope.vscode = true;
    } else if (path === 'LICENSE') {
      scope.highlight = scope.vscode_package = scope.jetbrains = true;
    }
    // CI configuration, documentation and unrelated files only run the lightweight scope checks.
    // Add new build inputs/components here together with regression cases.
  }
  scope.node = scope.vscode_package || scope.highlight;
  return scope;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const paths = readFileSync(0, 'utf8').split('\0').filter(Boolean);
  const scope = classifyChanges(paths, process.env.FULL_CI === 'true');
  appendFileSync(process.env.GITHUB_OUTPUT, Object.entries(scope).map(([key, value]) => `${key}=${value}\n`).join(''));
}
