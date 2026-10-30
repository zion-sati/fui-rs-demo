import { homedir } from 'node:os';

/**
 * The environment for a WebAssembly build that will be published. Panic locations name each dependency's source under
 * the Cargo home, which would publish the builder's home directory inside the module, so the home directory becomes `~`.
 * The flag goes to wasm32 builds only, leaving the RUSTFLAGS that `cargo fui build` sets for native workers alone; a
 * home directory with whitespace cannot be passed this way and is left as it is.
 */
export function publishedWasmEnvironment() {
  const home = homedir();
  if (/\s/u.test(home)) return process.env;
  const variable = 'CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_RUSTFLAGS';
  return {
    ...process.env,
    [variable]: [process.env[variable], `--remap-path-prefix=${home}=~`].filter(Boolean).join(' '),
  };
}
