"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { snapshot, ExecutableMonitor } = require("../../src/executable-monitor");
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(predicate) {
  for (let i = 0; i < 100; i++) { if (predicate()) return; await wait(20); }
  assert.fail("Timed out waiting for executable update");
}
function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "skel-monitor-"));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const executable = path.join(directory, "skelc");
  fs.writeFileSync(executable, "old", { mode: 0o755 });
  return { directory, executable };
}

test("atomic replacement prompts once, unrelated files do not, disposal stops monitoring", async t => {
  const { directory, executable } = fixture(t);
  let prompts = 0;
  let verifications = 0;
  const monitor = new ExecutableMonitor(executable, snapshot(executable), async () => { verifications++; }, async () => { prompts++; }, 20);
  t.after(() => monitor.dispose());
  fs.writeFileSync(path.join(directory, "unrelated"), "x");
  await wait(80);
  assert.equal(verifications, 0);
  fs.writeFileSync(path.join(directory, "next"), "new version", { mode: 0o755 });
  fs.renameSync(path.join(directory, "next"), executable);
  await until(() => prompts === 1);
  monitor.check(); monitor.check();
  await wait(80);
  assert.equal(prompts, 1);
  monitor.dispose();
  fs.writeFileSync(executable, "another version");
  monitor.check();
  await wait(80);
  assert.equal(prompts, 1);
});

test("symlink retargeting and target replacement are detected", { skip: process.platform === "win32" }, async t => {
  const { directory, executable } = fixture(t);
  const link = path.join(directory, "link");
  fs.symlinkSync(executable, link);
  let prompts = 0;
  const monitor = new ExecutableMonitor(link, snapshot(link), async () => {}, async () => { prompts++; }, 20);
  t.after(() => monitor.dispose());
  await wait(150); // Allow the native directory subscription to become active.
  const other = path.join(directory, "other");
  fs.mkdirSync(other);
  const target = path.join(other, "skelc");
  fs.writeFileSync(target, "next", { mode: 0o755 });
  fs.unlinkSync(link); fs.symlinkSync(target, link);
  await until(() => prompts === 1);
  fs.writeFileSync(target, "next build");
  await until(() => prompts === 2);
});

test("invalid replacement keeps server and does not poll; focus can retry", async t => {
  const { executable } = fixture(t);
  let attempts = 0;
  let prompts = 0;
  let valid = false;
  const monitor = new ExecutableMonitor(executable, snapshot(executable), async () => {
    attempts++;
    if (!valid) throw new Error("install incomplete");
  }, async () => { prompts++; }, 20);
  t.after(() => monitor.dispose());
  fs.writeFileSync(executable, "new");
  await until(() => attempts > 0);
  await wait(80);
  const count = attempts;
  await wait(80);
  assert.equal(attempts, count);
  assert.equal(prompts, 0);
  valid = true;
  monitor.check();
  await until(() => prompts === 1);
});
