import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { optimizeWasm, type WasmBuildTarget } from './wasm-build.js';

const args = process.argv.slice(2);
const buildAll = args.includes('--all');
const workerIndex = args.indexOf('--worker');
const workerKey = workerIndex >= 0 ? args[workerIndex + 1] : '';
const targetIndex = args.indexOf('--target');
const target = (targetIndex >= 0 ? args[targetIndex + 1] : 'release') as WasmBuildTarget;
if (target !== 'debug' && target !== 'release') throw new Error('--target must be debug or release.');
const manifest = JSON.parse(readFileSync('workers.json', 'utf8')) as {
  workers: Array<{ key: string; packageName: string; crateName: string; wasmFile: string }>;
};
const selected = buildAll ? manifest.workers : manifest.workers.filter((worker) => worker.key === workerKey);
if (selected.length === 0) throw new Error(`Unknown worker key: ${workerKey}`);
mkdirSync('public', { recursive: true });
for (const worker of selected) {
  const releaseArgs = target === 'release' ? ['--release'] : [];
  const result = spawnSync('cargo', ['build', '--package', worker.packageName, '--target', 'wasm32-unknown-unknown', ...releaseArgs], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
  const destination = `public/${worker.wasmFile}`;
  copyFileSync(`target/wasm32-unknown-unknown/${target}/${worker.crateName}.wasm`, destination);
  optimizeWasm(target, destination);
}
