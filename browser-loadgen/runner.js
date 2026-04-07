const { chromium } = require('playwright');

const targetUrl = (process.env.TARGET_URL || 'http://php-storefront:8080').replace(/\/$/, '');
const locustUiUrl = (process.env.LOCUST_UI_URL || 'http://load-generator:8089').replace(/\/$/, '');
const maxBrowserWorkers = Math.max(1, Number(process.env.BROWSER_CONCURRENCY || '3'));
const usersPerBrowserWorker = Math.max(1, Number(process.env.BROWSER_USERS_PER_WORKER || '25'));
const locustPollIntervalMs = Math.max(1000, Number(process.env.LOCUST_POLL_INTERVAL_MS || '5000'));
const sessionIntervalMs = Math.max(1000, Number(process.env.SESSION_INTERVAL_MS || '4000'));
const sessionDurationMs = Math.max(1000, Number(process.env.SESSION_DURATION_MS || '3000'));
const rumErrorEvery = Math.max(1, Number(process.env.RUM_ERROR_EVERY_N || '1'));
const faultEvery = Math.max(1, Number(process.env.FAULT_EVERY_N || '2'));
const loginEmail = (process.env.RUM_LOGIN_EMAIL || 'dylan@dylan123.nl').trim().toLowerCase();
const loginPassword = process.env.RUM_LOGIN_PASSWORD || 'dylan123';

const faultTargets = ['mysql', 'postgres', 'redis', 'php', 'python', 'java', 'nodejs'];
let desiredActiveWorkers = 0;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function log(message, context = {}) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    message,
    context,
  }));
}

async function fetchLocustState() {
  try {
    const response = await fetch(`${locustUiUrl}/stats/requests`);
    if (!response.ok) {
      throw new Error(`Locust responded with ${response.status}`);
    }

    const payload = await response.json();
    const userCount = Number(payload.user_count || 0);
    const state = String(payload.state || 'unknown');
    const active = userCount > 0 && state !== 'stopped' && state !== 'ready';
    const nextWorkers = active
      ? Math.max(1, Math.min(maxBrowserWorkers, Math.ceil(userCount / usersPerBrowserWorker)))
      : 0;

    desiredActiveWorkers = nextWorkers;
    log('locust state updated', {
      state,
      user_count: userCount,
      desired_browser_workers: desiredActiveWorkers,
    });
  } catch (error) {
    desiredActiveWorkers = 0;
    log('failed to read locust state, parking browser workers', {
      error: error.message,
      locust_ui_url: locustUiUrl,
    });
  }
}

async function pollLocustState() {
  while (true) {
    await fetchLocustState();
    await sleep(locustPollIntervalMs);
  }
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

async function ensureLoggedIn(page) {
  await page.goto(`${targetUrl}/auth?next=/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await waitForRum(page);
  await page.waitForTimeout(800);

  await page.fill('#login-email', loginEmail);
  await page.fill('#login-password', loginPassword);
  await page.click('#login-form button[type="submit"]');
  await page.waitForTimeout(1200);

  const statusText = (await page.locator('#auth-status').textContent().catch(() => '')) || '';
  if (statusText.includes('Inloggen mislukt')) {
    await page.fill('#register-email', loginEmail);
    await page.fill('#register-password', loginPassword);
    await page.click('#register-form button[type="submit"]');
    await page.waitForTimeout(1500);

    await page.goto(`${targetUrl}/auth?next=/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.fill('#login-email', loginEmail);
    await page.fill('#login-password', loginPassword);
    await page.click('#login-form button[type="submit"]');
    await page.waitForTimeout(1500);
  }

  await page.goto(`${targetUrl}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await waitForRum(page);
  await page.waitForTimeout(1000);
}

async function addProductsAndCheckout(page, iterations) {
  for (let attempt = 0; attempt < iterations; attempt += 1) {
    await page.fill('#search', attempt % 2 === 0 ? 'hoodie' : 'redis');
    await page.selectOption('#category', attempt % 2 === 0 ? 'apparel' : 'all');
    await page.waitForTimeout(300);

    const addButtons = page.locator('button[data-sku]');
    const count = await addButtons.count();
    const clicks = Math.min(3, count);
    for (let index = 0; index < clicks; index += 1) {
      await addButtons.nth(index).click();
      await page.waitForTimeout(180);
      if (index === 0) {
        await addButtons.nth(index).click();
      }
    }

    await page.waitForTimeout(350);
    await page.click('#btn-checkout');
    await page.waitForTimeout(900);
  }
}

async function triggerSyntheticFault(page, sequence) {
  if (sequence % faultEvery !== 0) {
    return;
  }

  const target = faultTargets[sequence % faultTargets.length];
  const button = page.locator(`button[data-fault="${target}"]`);
  if (await button.count()) {
    await button.click();
    await page.waitForTimeout(900);
  }
}

async function triggerRumError(page, sequence) {
  if (sequence % rumErrorEvery !== 0) {
    return;
  }

  const rumErrorButton = page.locator('#btn-generate-rum-error');
  if (await rumErrorButton.count()) {
    await rumErrorButton.click();
    await page.waitForTimeout(1200);
  }
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
    await ensureLoggedIn(page);
    await annotateSyntheticUser(page, sessionId, workerId);
    await addProductsAndCheckout(page, 3);
    await page.waitForTimeout(600);
    await page.goto(`${targetUrl}/auth?next=/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(500);
    await page.goto(`${targetUrl}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(700);
    await triggerSyntheticFault(page, sequence);
    await triggerRumError(page, sequence);
    await page.waitForTimeout(sessionDurationMs);

    log('synthetic browser session completed', {
      session_id: sessionId,
      worker_id: workerId,
      sequence,
    });
  } catch (error) {
    log('synthetic browser session failed', {
      session_id: sessionId,
      worker_id: workerId,
      sequence,
      error: error.message,
    });
  } finally {
    await context.close();
  }
}

async function runWorker(browser, workerId) {
  let sequence = 0;
  while (true) {
    if (workerId > desiredActiveWorkers) {
      await sleep(locustPollIntervalMs);
      continue;
    }

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
    locust_ui_url: locustUiUrl,
    max_browser_workers: maxBrowserWorkers,
    users_per_browser_worker: usersPerBrowserWorker,
    session_interval_ms: sessionIntervalMs,
    session_duration_ms: sessionDurationMs,
    rum_error_every_n: rumErrorEvery,
    fault_every_n: faultEvery,
    login_email: loginEmail,
  });

  await fetchLocustState();

  await Promise.all([
    pollLocustState(),
    ...Array.from({ length: maxBrowserWorkers }, (_, index) => runWorker(browser, index + 1)),
  ]);
}

main().catch((error) => {
  log('synthetic rum browser runner crashed', { error: error.message });
  process.exit(1);
});
