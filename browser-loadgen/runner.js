const { chromium } = require('playwright');

const targetUrl = (process.env.TARGET_URL || 'http://php-storefront:8080').replace(/\/$/, '');
const workerCount = Math.max(1, Number(process.env.BROWSER_CONCURRENCY || '2'));
const sessionIntervalMs = Math.max(1000, Number(process.env.SESSION_INTERVAL_MS || '12000'));
const sessionDurationMs = Math.max(1000, Number(process.env.SESSION_DURATION_MS || '5000'));
const rumErrorEvery = Math.max(0, Number(process.env.RUM_ERROR_EVERY_N || '0'));

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function log(message, context = {}) {
  const line = {
    timestamp: new Date().toISOString(),
    message,
    context,
  };
  console.log(JSON.stringify(line));
}

async function waitForRum(page) {
  try {
    await page.waitForFunction(() => window.__OPENOBSERVE_RUM_STATE__ !== undefined, undefined, { timeout: 10000 });
  } catch (_error) {
    log('rum state not detected before timeout');
  }
}

async function annotateSyntheticUser(page, sessionId, workerId) {
  await page.evaluate(({ syntheticSessionId, syntheticWorkerId }) => {
    const email = `synthetic-rum+${syntheticSessionId}@example.local`;
    window.localStorage.setItem('synthetic.source', 'playwright-rum-runner');
    window.localStorage.setItem('synthetic.session_id', syntheticSessionId);
    window.localStorage.setItem('synthetic.worker_id', String(syntheticWorkerId));

    if (typeof window.__setOpenObserveUser === 'function') {
      window.__setOpenObserveUser({
        id: `synthetic-${syntheticSessionId}`,
        name: `Synthetic Browser ${syntheticWorkerId}`,
        email,
      });
    }
  }, { syntheticSessionId: sessionId, syntheticWorkerId: workerId });
}

async function runSession(browser, workerId, sequence) {
  const sessionId = `${workerId}-${Date.now().toString(36)}-${sequence}`;
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    userAgent: `synthetic-rum-browser/${workerId}`,
  });
  const page = await context.newPage();

  page.on('pageerror', (error) => {
    log('browser pageerror observed', {
      session_id: sessionId,
      worker_id: workerId,
      error: error.message,
    });
  });

  try {
    await page.goto(`${targetUrl}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await waitForRum(page);
    await annotateSyntheticUser(page, sessionId, workerId);
    await page.waitForTimeout(1200);

    await page.fill('#search', 'hoodie');
    await page.waitForTimeout(350);
    await page.selectOption('#category', 'apparel');
    await page.waitForTimeout(350);

    const addButtons = page.locator('button[data-sku]');
    const addButtonCount = await addButtons.count();
    if (addButtonCount > 0) {
      await addButtons.nth(0).click();
      await page.waitForTimeout(300);
      if (addButtonCount > 1) {
        await addButtons.nth(Math.min(1, addButtonCount - 1)).click();
      }
    }

    await page.waitForTimeout(400);
    await page.click('#btn-checkout');
    await page.waitForTimeout(800);

    await page.goto(`${targetUrl}/auth`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(900);

    if (rumErrorEvery > 0 && sequence % rumErrorEvery === 0) {
      await page.goto(`${targetUrl}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await waitForRum(page);
      await page.waitForTimeout(1000);
      const rumErrorButton = page.locator('#btn-generate-rum-error');
      if (await rumErrorButton.count()) {
        await rumErrorButton.click();
        await page.waitForTimeout(1200);
      }
    }

    await page.waitForTimeout(sessionDurationMs);
    log('synthetic browser session completed', {
      session_id: sessionId,
      worker_id: workerId,
    });
  } catch (error) {
    log('synthetic browser session failed', {
      session_id: sessionId,
      worker_id: workerId,
      error: error.message,
    });
  } finally {
    await context.close();
  }
}

async function runWorker(browser, workerId) {
  let sequence = 0;
  while (true) {
    sequence += 1;
    await runSession(browser, workerId, sequence);
    await sleep(sessionIntervalMs);
  }
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  log('synthetic rum browser runner started', {
    target_url: targetUrl,
    worker_count: workerCount,
    session_interval_ms: sessionIntervalMs,
    session_duration_ms: sessionDurationMs,
    rum_error_every_n: rumErrorEvery,
  });

  await Promise.all(
    Array.from({ length: workerCount }, (_, index) => runWorker(browser, index + 1)),
  );
}

main().catch((error) => {
  log('synthetic rum browser runner crashed', { error: error.message });
  process.exit(1);
});
