"use strict";

const fs = require("node:fs");
const path = require("node:path");

function snapshot(command) {
  const candidates = path.isAbsolute(command) || command.includes(path.sep)
    ? [path.resolve(command)]
    : (process.env.PATH || "").split(path.delimiter).flatMap(directory =>
      (process.platform === "win32" && !path.extname(command)
        ? (process.env.PATHEXT || ".EXE;.CMD;.BAT;.COM").split(";") : [""])
        .map(extension => path.resolve(directory, command + extension)));
  for (const candidate of candidates) {
    try {
      fs.accessSync(candidate, fs.constants.X_OK);
      const real = fs.realpathSync(candidate);
      const stat = fs.statSync(real, { bigint: true });
      if (!stat.isFile()) continue;
      return { paths: [...new Set([candidate, real])], key: [candidate, real, stat.dev, stat.ino, stat.size, stat.mtimeNs, stat.ctimeNs].join(":") };
    } catch { /* Installation may temporarily remove the executable. */ }
  }
}

class ExecutableMonitor {
  constructor(command, baseline, verify, notify, delay = 2000) {
    this.command = command;
    this.baseline = baseline?.key;
    this.verify = verify;
    this.notify = notify;
    this.delay = delay;
    this.seen = new Set();
    this.watchers = [];
    this.watchPaths = "";
    this.disposed = false;
    this.bind(baseline);
  }

  bind(state) {
    if (!state || state.paths.join("\n") === this.watchPaths) return;
    for (const watcher of this.watchers) watcher.close();
    this.watchers = [];
    this.watchPaths = state.paths.join("\n");
    for (const directory of new Set(state.paths.map(file => path.dirname(file)))) {
      try {
        const names = new Set(state.paths.filter(file => path.dirname(file) === directory).map(file => path.basename(file)));
        const watcher = fs.watch(directory, (_, name) => {
          if (!name || names.has(name.toString())) this.check();
        });
        watcher.on("error", () => { watcher.close(); this.watchPaths = ""; });
        this.watchers.push(watcher);
      } catch { this.watchPaths = ""; /* Focus checks remain available. */ }
    }
  }

  check() {
    if (this.disposed) return;
    clearTimeout(this.timer);
    const state = snapshot(this.command);
    this.bind(state);
    if (!state || state.key === this.baseline || this.seen.has(state.key)) return;
    this.timer = setTimeout(() => { void this.confirm(state); }, this.delay);
  }

  async confirm(state) {
    if (this.disposed || this.checking) return;
    const stable = snapshot(this.command);
    if (stable?.key !== state.key) { this.check(); return; }
    this.checking = true;
    try {
      await this.verify(this.command);
      if (this.disposed || snapshot(this.command)?.key !== state.key) return;
      this.seen.add(state.key);
      await this.notify(() => !this.disposed && snapshot(this.command)?.key === state.key);
    } catch { /* Keep the running server when a replacement cannot be verified. */ }
    finally {
      this.checking = false;
      if (!this.disposed && snapshot(this.command)?.key !== state.key) this.check();
    }
  }

  dispose() {
    this.disposed = true;
    clearTimeout(this.timer);
    for (const watcher of this.watchers) watcher.close();
    this.watchers = [];
  }
}

module.exports = { snapshot, ExecutableMonitor };
