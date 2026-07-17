import { accessSync, readFileSync } from 'node:fs';
import { chromium, type Locator, type Page } from 'playwright';
import { spawn } from 'node:child_process';

async function clickCanvasNode(page: Page, locator: Locator, description: string): Promise<void> {
  const bounds = await locator.boundingBox();
  if (bounds === null) throw new Error(`${description} is not visible.`);
  await page.mouse.click(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
}

async function waitForTextChange(locator: Locator, previous: string | null): Promise<string> {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const current = await locator.textContent();
    if (current !== previous) return current ?? '';
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error('Retained status text did not change after interaction.');
}

for (const file of [
  'public/index.html',
  'public/favicon.ico',
  'public/text-fonts/index.html',
  'public/advanced/index.html',
  'public/immediate-drawing/index.html',
  'public/harness.js',
  'public/home.wasm',
  'public/text-fonts.wasm',
  'public/advanced.wasm',
  'public/immediate-drawing.wasm',
  'public/advanced-workers.wasm',
  'public/bridge.js',
  'public/effindom-runtime-config.js',
  'public/runtime/dist/effindom.v2.manifest.json',
  'public/runtime/fonts/DejaVuSans.ttf',
  'public/runtime/fonts/DejaVuSans-Bold.ttf',
]) {
  accessSync(file);
}

for (const generatedBinding of [
  'crates/shared/src/generated/host_services.rs',
  'crates/routes/home/src/generated/host_events.rs',
  'crates/routes/text-fonts/src/generated/host_events.rs',
  'crates/routes/advanced/src/generated/host_events.rs',
  'crates/routes/immediate-drawing/src/generated/host_events.rs',
]) {
  accessSync(generatedBinding);
}

for (const shell of ['public/index.html', 'public/text-fonts/index.html', 'public/advanced/index.html', 'public/immediate-drawing/index.html']) {
  if (!readFileSync(shell, 'utf8').includes('id="fui-canvas"')) {
    throw new Error(`${shell} is missing #fui-canvas.`);
  }
  if (readFileSync(shell, 'utf8').includes('{{LOADING_OVERLAY_')) {
    throw new Error(`${shell} contains unresolved loading-overlay placeholders.`);
  }
}

const server = spawn('npx', ['serve', 'public', '--listen', '4179'], {
  stdio: 'ignore',
});
try {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.goto('http://127.0.0.1:4179/', { waitUntil: 'networkidle' });
    await page
      .locator('[data-semantic-text-content="true"]')
      .getByText('Basic controls showcase', { exact: true })
      .waitFor();
    await page.keyboard.press('Meta+Shift+F12');
    const debugDialog = page.locator('#effindom-devtools-debug-dialog');
    await debugDialog.waitFor();
    await page.keyboard.press('Meta+Shift+F12');
    await debugDialog.waitFor({ state: 'detached' });
    const biStateCheckbox = page.getByRole('checkbox', { name: 'Bi-state checkbox' });
    const selectionSummary = page
      .locator('[data-semantic-text-content="true"]')
      .filter({ hasText: 'Selections:' })
      .first();
    const selectionBefore = await selectionSummary.textContent();
    await clickCanvasNode(
      page,
      biStateCheckbox,
      'Home bi-state checkbox',
    );
    if ((await waitForTextChange(selectionSummary, selectionBefore)) === selectionBefore) {
      throw new Error('Home bi-state checkbox did not toggle through the public control surface.');
    }
    await page.mouse.move(1000, 700);
    for (let index = 0; index < 12; index += 1) {
      await page.mouse.wheel(0, 700);
      await page.waitForTimeout(30);
    }
    const keyTarget = page
      .locator('[data-semantic-text-content="true"]')
      .filter({ hasText: 'Focus me, then press keys' })
      .first();
    const keyTargetBounds = await keyTarget.boundingBox();
    if (keyTargetBounds === null) {
      throw new Error('Keyboard focus target is not visible after scrolling.');
    }
    await page.mouse.click(
      keyTargetBounds.x + keyTargetBounds.width / 2,
      keyTargetBounds.y + keyTargetBounds.height / 2,
    );
    await page.keyboard.press('K');
    await page
      .locator('[data-semantic-text-content="true"]')
      .getByText(/Last key: [kK]$/)
      .waitFor();
    if (pageErrors.length > 0) {
      throw new Error(`Home route raised browser errors: ${pageErrors.join(' | ')}`);
    }
    pageErrors.length = 0;
    await page.setViewportSize({ width: 1280, height: 4000 });
    await page.goto('http://127.0.0.1:4179/text-fonts/', { waitUntil: 'networkidle' });
    await page
      .locator('[data-semantic-text-content="true"]')
      .getByText('Text Inputs', { exact: true })
      .waitFor();
    const projectedForm = page.locator('form[data-effindom-projected-form="true"]');
    await projectedForm.waitFor({ state: 'attached' });
    await projectedForm.locator('input[autocomplete="username"]').waitFor({ state: 'attached' });
    await projectedForm.locator('input[autocomplete="current-password"]').waitFor({ state: 'attached' });
    const wrappingCheckbox = page.getByRole('checkbox', { name: 'Wrapping' });
    const settingsSummary = page
      .locator('[data-semantic-text-content="true"]')
      .filter({ hasText: 'Read-only:' })
      .first();
    const wrappingBefore = await settingsSummary.textContent();
    await clickCanvasNode(
      page,
      wrappingCheckbox,
      'Text & Fonts wrapping checkbox',
    );
    if ((await waitForTextChange(settingsSummary, wrappingBefore)) === wrappingBefore) {
      throw new Error('Text & Fonts wrapping setting did not toggle.');
    }
    await page
      .locator('[data-semantic-text-content="true"]')
      .getByText('App-authored Custom Fonts', { exact: true })
      .waitFor();
    if (pageErrors.length > 0) {
      throw new Error(`Text & Fonts route raised browser errors: ${pageErrors.join(' | ')}`);
    }
    pageErrors.length = 0;
    await page.setViewportSize({ width: 1280, height: 6000 });
    await page.goto('http://127.0.0.1:4179/advanced/', { waitUntil: 'networkidle' });
    await page
      .locator('[data-semantic-text-content="true"]')
      .getByText('Advanced', { exact: true })
      .last()
      .waitFor();
    const startWorker = page.getByRole('button', { name: 'Start prime worker', exact: true });
    await startWorker.waitFor();
    const startWorkerBounds = await startWorker.boundingBox();
    if (startWorkerBounds === null) {
      throw new Error('Advanced worker start control is not visible.');
    }
    await page.mouse.click(
      startWorkerBounds.x + startWorkerBounds.width / 2,
      startWorkerBounds.y + startWorkerBounds.height / 2,
    );
    await page
      .locator('[data-semantic-text-content="true"]')
      .getByText('Worker: computing primes...', { exact: true })
      .waitFor();
    await clickCanvasNode(
      page,
      page.getByRole('button', { name: 'Cancel prime worker', exact: true }),
      'Advanced worker cancel control',
    );
    await page
      .locator('[data-semantic-text-content="true"]')
      .getByText('Worker: cancelled', { exact: true })
      .waitFor();
    await page
      .locator('[data-semantic-text-content="true"]')
      .getByText('Drag-and-drop Reorder', { exact: true })
      .waitFor();
    const firstGrip = page.getByLabel('Drag grip for Draft project brief');
    const thirdRow = page
      .locator('[data-semantic-text-content="true"]')
      .getByText('Reorder item 3: Prepare interaction demo', { exact: true });
    const [firstGripBounds, thirdRowBounds] = await Promise.all([
      firstGrip.boundingBox(),
      thirdRow.boundingBox(),
    ]);
    if (firstGripBounds === null || thirdRowBounds === null) {
      throw new Error('Reorder drag source or destination is not visible.');
    }
    const orderSummary = page
      .locator('[data-semantic-text-content="true"]')
      .filter({ hasText: 'Reorder order:' })
      .first();
    const orderBefore = await orderSummary.textContent();
    let orderAfter = orderBefore;
    for (let attempt = 0; attempt < 3 && orderAfter === orderBefore; attempt += 1) {
      await page.mouse.move(
        firstGripBounds.x + firstGripBounds.width / 2,
        firstGripBounds.y + firstGripBounds.height / 2,
      );
      await page.mouse.down();
      await page.mouse.move(
        thirdRowBounds.x + thirdRowBounds.width / 2,
        thirdRowBounds.y + thirdRowBounds.height / 2,
        { steps: 12 },
      );
      await page.mouse.up();
      await page.waitForTimeout(150);
      orderAfter = await orderSummary.textContent();
    }
    if (orderAfter === orderBefore) {
      throw new Error('Advanced reorder gesture did not mutate the retained item order.');
    }
    if (pageErrors.length > 0) {
      throw new Error(`Advanced route raised browser errors: ${pageErrors.join(' | ')}`);
    }
    pageErrors.length = 0;
    await page.setViewportSize({ width: 1280, height: 3000 });
    await page.goto('http://127.0.0.1:4179/immediate-drawing/', { waitUntil: 'networkidle' });
    if (await page.locator('form[data-effindom-projected-form="true"]').count() !== 0) {
      throw new Error('Text & Fonts projected form survived route teardown.');
    }
    await page
      .locator('[data-semantic-text-content="true"]')
      .getByText('Immediate-mode drawing', { exact: true })
      .waitFor();
    await page
      .locator('[data-semantic-text-content="true"]')
      .getByText('Live drawing surfaces', { exact: true })
      .waitFor();
    const paintSurface = page.getByLabel('Paint canvas - drag to draw');
    const paintBounds = await paintSurface.boundingBox();
    if (paintBounds === null) {
      throw new Error('Paint surface is not visible.');
    }
    const paintClip = {
      x: Math.max(0, paintBounds.x),
      y: Math.max(0, paintBounds.y),
      width: paintBounds.width,
      height: paintBounds.height,
    };
    const paintBefore = await page.screenshot({ clip: paintClip });
    await page.mouse.move(paintBounds.x + 40, paintBounds.y + 60);
    await page.mouse.down();
    await page.mouse.move(paintBounds.x + 180, paintBounds.y + 100, { steps: 10 });
    await page.mouse.up();
    const paintAfter = await page.screenshot({ clip: paintClip });
    if (paintBefore.equals(paintAfter)) {
      throw new Error('Paint surface did not redraw during pointer capture.');
    }
    await page.mouse.move(paintBounds.x + 260, paintBounds.y + 140, { steps: 8 });
    const paintAfterRelease = await page.screenshot({ clip: paintClip });
    if (!paintAfter.equals(paintAfterRelease)) {
      throw new Error('Paint surface continued drawing after pointer release.');
    }
    if (pageErrors.length > 0) {
      throw new Error(`Immediate drawing route raised browser errors: ${pageErrors.join(' | ')}`);
    }
    pageErrors.length = 0;
    await page.goto('http://127.0.0.1:4179/advanced/', { waitUntil: 'networkidle' });
    await page
      .locator('[data-semantic-text-content="true"]')
      .getByText('Advanced', { exact: true })
      .last()
      .waitFor();
    if (pageErrors.length > 0) {
      throw new Error(`Advanced route remount raised browser errors: ${pageErrors.join(' | ')}`);
    }
    const touchContext = await browser.newContext({
      viewport: { width: 1280, height: 6000 },
      hasTouch: true,
      isMobile: true,
    });
    try {
      const touchPage = await touchContext.newPage();
      const touchErrors: string[] = [];
      touchPage.on('pageerror', (error) => touchErrors.push(error.message));
      await touchPage.goto('http://127.0.0.1:4179/advanced/', { waitUntil: 'networkidle' });
      const touchGrip = touchPage.getByLabel('Drag grip for Draft project brief');
      const touchTarget = touchPage
        .locator('[data-semantic-text-content="true"]')
        .getByText('Reorder item 3: Prepare interaction demo', { exact: true });
      const [touchGripBounds, touchTargetBounds] = await Promise.all([
        touchGrip.boundingBox(),
        touchTarget.boundingBox(),
      ]);
      if (touchGripBounds === null || touchTargetBounds === null) {
        throw new Error('Touch reorder source or destination is not visible.');
      }
      const touchOrder = touchPage
        .locator('[data-semantic-text-content="true"]')
        .filter({ hasText: 'Reorder order:' })
        .first();
      const touchOrderBefore = await touchOrder.textContent();
      const client = await touchContext.newCDPSession(touchPage);
      const startX = touchGripBounds.x + touchGripBounds.width / 2;
      const startY = touchGripBounds.y + touchGripBounds.height / 2;
      const endX = touchTargetBounds.x + touchTargetBounds.width / 2;
      const endY = touchTargetBounds.y + touchTargetBounds.height / 2;
      await client.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: startX, y: startY, id: 1, radiusX: 8, radiusY: 8, force: 1 }],
      });
      await touchPage.waitForTimeout(650);
      for (let step = 1; step <= 12; step += 1) {
        const progress = step / 12;
        await client.send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: [{
            x: startX + (endX - startX) * progress,
            y: startY + (endY - startY) * progress,
            id: 1,
            radiusX: 8,
            radiusY: 8,
            force: 1,
          }],
        });
        await touchPage.waitForTimeout(25);
      }
      await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await waitForTextChange(touchOrder, touchOrderBefore);
      if (touchErrors.length > 0) {
        throw new Error(`Touch reorder route raised browser errors: ${touchErrors.join(' | ')}`);
      }
    } finally {
      await touchContext.close();
    }
  } finally {
    await browser.close();
  }
} finally {
  server.kill('SIGTERM');
}
