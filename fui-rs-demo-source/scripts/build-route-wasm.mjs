import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const release = process.argv.includes('--release');
const profile = release ? 'release' : 'debug';
const manifest = JSON.parse(readFileSync('routes.json', 'utf8'));
mkdirSync('public', { recursive: true });

for (const route of manifest.routes) {
  const packageName = `fui-rs-demo-web-${route.key}`;
  const crateName = `fui_rs_demo_web_${route.key.replaceAll('-', '_')}`;
  const arguments_ = ['build', '--package', packageName, '--target', 'wasm32-unknown-unknown'];
  if (release) arguments_.push('--release');
  const result = spawnSync('cargo', arguments_, { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
  copyFileSync(
    `target/wasm32-unknown-unknown/${profile}/${crateName}.wasm`,
    `public/${route.wasmPath.replace(/^\//u, '')}`,
  );
}
