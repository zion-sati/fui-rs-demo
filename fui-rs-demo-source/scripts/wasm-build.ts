import { spawnSync } from 'node:child_process';

export type WasmBuildTarget = 'debug' | 'release';

export function releaseOptimizationArgs(target: WasmBuildTarget, path: string): string[] | null {
  return target === 'release'
    ? ['-O3', '--strip-debug', '--strip-producers', path, '-o', path]
    : null;
}

export function optimizeWasm(target: WasmBuildTarget, path: string): void {
  const args = releaseOptimizationArgs(target, path);
  if (args === null) return;
  const result = spawnSync('wasm-opt', args, { stdio: 'inherit' });
  if (result.error !== undefined && (result.error as NodeJS.ErrnoException).code === 'ENOENT') {
    console.warn('wasm-opt not found; skipping optional Binaryen release optimization.');
    return;
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
}
