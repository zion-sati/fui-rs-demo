import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    encoding: 'utf8',
    stdio: options.inherit ? 'inherit' : 'pipe',
  });
  if (result.status !== 0) {
    const detail = result.stderr?.trim() || result.stdout?.trim() || `exit ${result.status}`;
    throw new Error(`${command} ${args.join(' ')} failed: ${detail}`);
  }
  return result.stdout?.trim() ?? '';
}

const metadata = JSON.parse(run('cargo', ['metadata', '--format-version', '1', '--no-deps']));
const version = metadata.metadata?.fui?.['cargo-fui-version'];
if (typeof version !== 'string' || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/u.test(version)) {
  throw new Error('Cargo.toml must define workspace.metadata.fui.cargo-fui-version exactly.');
}

const installed = spawnSync('cargo', ['fui', '--version'], {
  cwd: projectRoot,
  encoding: 'utf8',
});
if (installed.status === 0 && installed.stdout.trim() === `cargo-fui ${version}`) {
  console.log(`Using cargo-fui ${version}.`);
  process.exit(0);
}

run('cargo', [
  'install', '--locked', '--force', '--version', version, 'cargo-fui',
], { inherit: true });
