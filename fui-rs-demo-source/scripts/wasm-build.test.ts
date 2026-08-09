import assert from 'node:assert/strict';
import test from 'node:test';
import { releaseOptimizationArgs } from './wasm-build.js';

void test('release optimization is requested only for release WASM builds', () => {
  assert.equal(releaseOptimizationArgs('debug', 'app.wasm'), null);
  assert.deepEqual(releaseOptimizationArgs('release', 'app.wasm'), [
    '-O3',
    '--strip-debug',
    '--strip-producers',
    'app.wasm',
    '-o',
    'app.wasm',
  ]);
});
