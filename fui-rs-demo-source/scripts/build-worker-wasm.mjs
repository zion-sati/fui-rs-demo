import { copyFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

import { publishedWasmEnvironment } from './published-wasm-environment.mjs';

const release = process.argv.includes('--release');
const profile = release ? 'release' : 'debug';
const arguments_ = [
  'rustc', '--package', 'fui-rs-demo-worker', '--target', 'wasm32-unknown-unknown',
  '--lib', '--crate-type', 'cdylib',
];
if (release) arguments_.push('--release');
const result = spawnSync('cargo', arguments_, { stdio: 'inherit', env: publishedWasmEnvironment() });
if (result.status !== 0) process.exit(result.status ?? 1);
copyFileSync(
  `target/wasm32-unknown-unknown/${profile}/fui_rs_demo_worker.wasm`,
  'public/workers.wasm',
);
