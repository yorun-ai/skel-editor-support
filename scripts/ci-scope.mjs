import { readFileSync, appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export function classifyChanges(paths, full = false) {
  const scope = { node: full, vscode: full, highlight: full, jetbrains: full, full };
  for (const path of paths) {
    if (/\.(md|png|jpg|jpeg)$/.test(path) || path.startsWith('.github/ISSUE_TEMPLATE/')) continue;
    if (path.startsWith('editors/jetbrains/')) scope.jetbrains = true;
    else if (path === 'editors/vscode/skelc-compatibility.json') {
      scope.node = scope.vscode = scope.jetbrains = true;
    } else if (path.startsWith('editors/vscode/')) scope.node = scope.vscode = true;
    else if (path.startsWith('packages/highlight/')) {
      scope.node = scope.highlight = scope.vscode = scope.jetbrains = true;
    } else {
      // Shared scripts, dependencies, workflows and unknown files must not silently skip checks.
      scope.node = scope.vscode = scope.highlight = scope.jetbrains = true;
    }
  }
  return scope;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const paths = readFileSync(0, 'utf8').split('\0').filter(Boolean);
  const scope = classifyChanges(paths, process.env.CI_EVENT_NAME !== 'pull_request');
  appendFileSync(process.env.GITHUB_OUTPUT, Object.entries(scope).map(([key, value]) => `${key}=${value}\n`).join(''));
}
