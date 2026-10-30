import { spawnSync } from 'node:child_process';

import { publishedWasmEnvironment } from './published-wasm-environment.mjs';

// `cargo fui build` builds the web routes of this universal app as well as the native one.
const result = spawnSync('cargo', ['fui', 'build', ...process.argv.slice(2)], { stdio: 'inherit', env: publishedWasmEnvironment() });
process.exit(result.status ?? 1);
