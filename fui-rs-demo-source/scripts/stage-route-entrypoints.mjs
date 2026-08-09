import { copyFile, mkdir, readFile, stat } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import process from 'node:process';

const projectRoot = resolve(process.cwd());
const checkOnly = process.argv.includes('--check');
const outputOption = process.argv.find((argument) => argument.startsWith('--output='));
const outputDirectory = outputOption?.slice('--output='.length) || 'public';
const publicRoot = resolve(projectRoot, outputDirectory);

function routeDirectory(routePath) {
  if (typeof routePath !== 'string' || !routePath.startsWith('/') || !routePath.endsWith('/')) {
    throw new Error(`Route path ${JSON.stringify(routePath)} must start and end with '/'.`);
  }
  if (/[\\?#]/u.test(routePath)) {
    throw new Error(`Route path ${JSON.stringify(routePath)} contains unsupported characters.`);
  }
  const components = routePath.split('/').filter(Boolean);
  if (components.some((component) => component === '.' || component === '..')) {
    throw new Error(`Route path ${JSON.stringify(routePath)} contains an unsafe component.`);
  }
  return components.join(sep);
}

async function requireFile(path, description) {
  const details = await stat(path).catch(() => null);
  if (!details?.isFile()) throw new Error(`${description} is missing: ${path}`);
}

const manifest = JSON.parse(await readFile(resolve(projectRoot, 'routes.json'), 'utf8'));
if (!Array.isArray(manifest.routes) || manifest.routes.length === 0) {
  throw new Error('routes.json must declare at least one route.');
}

const shell = resolve(publicRoot, 'index.html');
await requireFile(shell, 'Built application shell');
for (const route of manifest.routes) {
  const directory = routeDirectory(route.routePath);
  const destination = resolve(publicRoot, directory, 'index.html');
  if (!destination.startsWith(`${publicRoot}${sep}`) && destination !== shell) {
    throw new Error(`Route ${JSON.stringify(route.routePath)} escapes public/.`);
  }
  if (!checkOnly && destination !== shell) {
    await mkdir(resolve(publicRoot, directory), { recursive: true });
    await copyFile(shell, destination);
  }
  await requireFile(destination, `Static shell for ${route.routePath}`);

  if (typeof route.wasmPath !== 'string' || !route.wasmPath.startsWith('/')) {
    throw new Error(`WASM path ${JSON.stringify(route.wasmPath)} must be root-relative.`);
  }
  const wasmRelative = route.wasmPath.slice(1);
  if (wasmRelative.split('/').some((component) => component === '' || component === '.' || component === '..')) {
    throw new Error(`WASM path ${JSON.stringify(route.wasmPath)} is unsafe.`);
  }
  await requireFile(resolve(publicRoot, wasmRelative), `WASM module for ${route.routePath}`);
}

console.log(`${checkOnly ? 'Verified' : 'Staged'} ${manifest.routes.length} web route entrypoints in ${outputDirectory}/.`);
