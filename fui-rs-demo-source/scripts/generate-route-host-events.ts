import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const manifest = JSON.parse(readFileSync('routes.json', 'utf8')) as { routes: Array<{ key: string }> };
for (const route of manifest.routes) {
  const outputPath = `crates/routes/${route.key}/src/generated/host_events.rs`;
  const result = spawnSync('tsx', [
    './node_modules/@effindomv2/fui-rs/scripts/generate-host-events.ts',
    'host/host-events.ts',
    'appHostEvents',
    outputPath,
  ], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
  const generated = readFileSync(outputPath, 'utf8');
  writeFileSync(outputPath, `#![allow(clippy::type_complexity)]\n${generated}`);
}
