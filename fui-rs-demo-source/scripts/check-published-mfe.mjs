import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { chromium } from '@playwright/test';

const root = resolve(process.argv[2] ?? 'published');
const routeModules = new Set([
  'home.wasm',
  'text-fonts.wasm',
  'advanced.wasm',
  'immediate-drawing.wasm',
]);
const routes = [
  ['/', 'home.wasm'],
  ['/text-fonts/', 'text-fonts.wasm'],
  ['/advanced/', 'advanced.wasm'],
  ['/immediate-drawing/', 'immediate-drawing.wasm'],
];
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.wasm': 'application/wasm',
};

if (!existsSync(root) || !statSync(root).isDirectory()) {
  throw new Error(`Published directory does not exist: ${root}`);
}
if (existsSync(join(root, 'app.wasm'))) {
  throw new Error('Forbidden monolithic web artifact exists: app.wasm');
}

const server = createServer((request, response) => {
  const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
  const relative = normalize(decodeURIComponent(pathname)).replace(/^[/\\]+/u, '');
  let file = resolve(root, relative);
  if (!file.startsWith(`${root}/`) && file !== root) {
    response.writeHead(403).end();
    return;
  }
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!existsSync(file) || !statSync(file).isFile()) {
    response.writeHead(404).end();
    return;
  }
  response.writeHead(200, { 'content-type': mimeTypes[extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(response);
});

await new Promise((resolveListen) => server.listen(0, '127.0.0.1', resolveListen));
const address = server.address();
if (!address || typeof address === 'string') throw new Error('Static test server did not bind to TCP.');
const origin = `http://127.0.0.1:${address.port}`;
const browser = await chromium.launch({ headless: true });

try {
  for (const [route, expectedModule] of routes) {
    const page = await browser.newPage();
    const failures = [];
    const requestedRouteModules = new Set();
    page.on('pageerror', (error) => failures.push(`page error: ${error.message}`));
    page.on('response', (response) => {
      const name = new URL(response.url()).pathname.split('/').at(-1);
      if (name && routeModules.has(name)) requestedRouteModules.add(name);
      if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`);
    });
    await page.goto(`${origin}${route}`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => {
      const canvas = document.querySelector('canvas');
      return canvas instanceof HTMLCanvasElement
        && canvas.width > 0
        && !document.querySelector('#effindom-loading-overlay');
    }, undefined, { timeout: 30_000 });
    if (failures.length > 0) throw new Error(`${route}: ${failures.join('; ')}`);
    const actual = [...requestedRouteModules];
    if (actual.length !== 1 || actual[0] !== expectedModule) {
      throw new Error(`${route}: expected only ${expectedModule}, requested ${actual.join(', ') || 'none'}`);
    }
    await page.close();
  }
} finally {
  await browser.close();
  await new Promise((resolveClose, reject) => server.close((error) => error ? reject(error) : resolveClose()));
}

console.log(`Verified routed web MFE behavior in ${root}.`);
