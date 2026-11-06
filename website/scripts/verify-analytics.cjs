#!/usr/bin/env node
'use strict';

// Uses the repository's existing browser installation; never reads env files.
// Google collection is intercepted and answered locally: no test events reach GA.
const assert = require('node:assert/strict');
const http = require('node:http');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { runInNewContext } = require('node:vm');
const { build, transformSync } = require('../node_modules/esbuild');
const { buildCsp } = require('../src/lib/csp');
const root = path.resolve(__dirname, '../..');
const id = process.argv[process.argv.indexOf('--measurement-id') + 1];
assert(process.argv.includes('--measurement-id') && /^G-[A-Z0-9]+$/.test(id), 'Supply the public Measurement ID with --measurement-id');
const appUrl = process.argv.includes('--app-url') ? new URL(process.argv[process.argv.indexOf('--app-url') + 1]) : null;
if (appUrl) assert(appUrl.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(appUrl.hostname) && !appUrl.username && !appUrl.password, 'App checks require an explicit local HTTP origin');

async function main() {
  const bundle = await build({
    stdin: {
      resolveDir: path.join(root, 'website'), loader: 'ts',
      contents: `import * as analytics from './src/lib/analytics';
        import { saveCookieConsent, clearAnalyticsCookies } from './src/lib/cookieConsent';
        window.qa = { ...analytics, choose: (allow) => {
          saveCookieConsent({ analytics: allow, ads: false });
          if (!allow) clearAnalyticsCookies();
        }, navigate: (path) => { history.pushState(null, '', path); analytics.sendPageview(location.href); } };
        analytics.initializeAnalytics();`,
    },
    tsconfig: path.join(root, 'website/tsconfig.json'),
    bundle: true, write: false, format: 'iife', platform: 'browser',
    define: { 'process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID': JSON.stringify(id), 'process.env.NODE_ENV': '"production"' },
  });
  // Keep a real reproduction of the original caught exception, using the
  // pre-fix document from Git rather than a mocked Google implementation.
  const legacySource = execFileSync('git', ['show', '7680a99:website/src/lib/analyticsFrame.ts'], { cwd: root, encoding: 'utf8' });
  const legacy = runInNewContext(transformSync(legacySource, { loader: 'ts', format: 'iife', globalName: 'legacy' }).code + '; legacy');
  let origin;
  const server = http.createServer((req, res) => {
    const nonceMode = req.url.startsWith('/nonce');
    res.setHeader('Content-Security-Policy', buildCsp({ adsEnabled: nonceMode, nonce: 'browserFixtureNonce123' }));
    res.setHeader('Content-Type', req.url === '/analytics.js' ? 'application/javascript' : 'text/html');
    if (req.url === '/analytics.js') return res.end(bundle.outputFiles[0].text);
    if (req.url === '/legacy') {
      const srcdoc = legacy.analyticsFrameDocument(id, origin, '123456.123456');
      return res.end(`<!doctype html><title>Legacy regression</title><body><script>
        const frame = document.createElement('iframe'); frame.sandbox = 'allow-scripts';
        frame.srcdoc = ${JSON.stringify(srcdoc).replace(/</g, '\\u003c')};
        frame.onload = () => frame.contentWindow.postMessage({page_path:'/projects',page_location:location.origin+'/projects',page_referrer:''}, '*');
        document.body.appendChild(frame);
      </script></body>`);
    }
    res.end(`<!doctype html><head><title>Analytics browser regression</title>
      ${nonceMode ? '<meta name="csp-nonce" content="browserFixtureNonce123">' : ''}
      </head><body><h1>Local analytics regression</h1><script ${nonceMode ? 'nonce="browserFixtureNonce123"' : ''} src="/analytics.js"></script></body>`);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
  const browserRoot = path.join(root, 'build/playwright-mcp-phase7');
  const { chromium } = require(path.join(browserRoot, 'node_modules/playwright'));
  let browser;
  const report = { collectionForwardedToGoogle: false, checks: [], blockers: [], requests: [] };
  try {
    browser = await chromium.launch({ headless: true, chromiumSandbox: true, executablePath: path.join(browserRoot, 'browsers/chromium_headless_shell-1247/chrome-headless-shell-linux64/chrome-headless-shell') });
    const context = await browser.newContext({ serviceWorkers: 'block' });
    let failLoader = false;
    let loaderCount = 0;
    await context.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.origin === origin || url.origin === appUrl?.origin) return route.continue();
      if (url.hostname === 'www.googletagmanager.com' && url.pathname === '/gtag/js') {
        loaderCount++;
        return failLoader ? route.abort('failed') : route.continue();
      }
      if (/^(?:[a-z0-9-]+\.)?google-analytics\.com$/.test(url.hostname) && url.pathname === '/g/collect') {
        for (const line of (route.request().postData() || '').split('\n')) {
          const params = new URLSearchParams(url.search);
          for (const [key, value] of new URLSearchParams(line.trim())) params.set(key, value);
          report.requests.push({ host: url.hostname, event: params.get('en'), page: params.get('dl'), referrer: params.get('dr'), consent: params.get('gcs'), measurementIdMatches: params.get('tid') === id });
        }
        return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' }, body: '' });
      }
      return route.abort('blockedbyclient');
    });
    const page = await context.newPage();
    await page.addInitScript(() => {
      // Observe the real Google tag's cookie writes without recording values.
      const cookie = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');
      window.analyticsCookieViolations = [];
      Object.defineProperty(document, 'cookie', {
        get: () => cookie.get.call(document),
        set: value => {
          if (/^(_ga($|_)|_gid$|_gat($|_)|_gac_)/.test(value.split('=')[0]) &&
              !cookie.get.call(document).split('; ').includes('campusedux_consent_v1=a1d0') &&
              !cookie.get.call(document).split('; ').includes('campusedux_consent_v1=a1d1') &&
              !/Max-Age=0/i.test(value)) window.analyticsCookieViolations.push(value.split('=')[0]);
          cookie.set.call(document, value);
        },
      });
    });
    const assertNoAnalyticsCookies = async () => {
      assert.deepEqual((await context.cookies()).filter(c => /^(_ga($|_)|_gid$|_gat($|_)|_gac_)/.test(c.name)).map(c => c.name), []);
      assert.deepEqual(await page.evaluate(() => window.analyticsCookieViolations), []);
    };
    const waitForRequests = async count => {
      for (let attempt = 0; attempt < 50 && report.requests.length < count; attempt++) await page.waitForTimeout(200);
    };
    const cdp = await context.newCDPSession(page);
    const exceptions = [];
    await cdp.send('Debugger.enable');
    await cdp.send('Debugger.setPauseOnExceptions', { state: 'all' });
    cdp.on('Debugger.paused', async event => {
      try {
        if (event.reason === 'exception' && event.data?.description?.includes('sandboxed')) exceptions.push(event.data.description.split('\n')[0]);
      } finally { await cdp.send('Debugger.resume').catch(() => {}); }
    });
    const violations = [];
    await page.exposeFunction('recordViolation', value => violations.push(value));
    await page.addInitScript(() => document.addEventListener('securitypolicyviolation', event => window.recordViolation({ directive: event.effectiveDirective, blocked: event.blockedURI })));
    await page.goto(origin + '/legacy');
    await page.waitForTimeout(2500);
    assert(exceptions.some(e => e.includes('allow-same-origin')), 'Legacy iframe must reproduce the original Google cookie exception');
    assert.equal(report.requests.length, 0, 'Legacy execution must not collect');
    report.checks.push('Legacy Google cookie SecurityError reproduced');
    exceptions.length = 0;

    await page.goto(origin + '/projects');
    await waitForRequests(1);
    const beforeConsent = loaderCount;
    assert.equal(await page.evaluate(() => !!window.gtag), true);
    assert.equal(report.requests.filter(x => x.event === 'page_view').length, 1, 'A cookieless public view before consent');
    await assertNoAnalyticsCookies();
    await page.evaluate(() => window.qa.choose(false));
    assert.equal(loaderCount, beforeConsent);
    await page.evaluate(() => window.qa.choose(true));
    await page.waitForFunction(() => window.google_tag_manager);
    await waitForRequests(1);
    assert.equal(report.requests.filter(x => x.event === 'page_view').length, 1, 'Consent updates do not duplicate the initial view');
    await page.evaluate(() => { window.qa.choose(true); window.qa.navigate('/projects?code=fabricated-secret#fabricated-secret'); });
    await page.waitForTimeout(600);
    assert.equal(report.requests.filter(x => x.event === 'page_view').length, 1, 'Unchanged consent/query/hash must not duplicate views');
    for (const route of ['/learning', '/learning/java-tutorial/introduction-to-java', '/jobs']) {
      await page.evaluate(route => window.qa.navigate(route), route);
      await page.waitForTimeout(700);
    }
    // Google batches later events; wait for the batch rather than assuming
    // an immediate request per gtag call. The interceptor decodes each line.
    await page.waitForTimeout(5500);
    const views = report.requests.filter(x => x.event === 'page_view');
    const expectedPaths = ['/projects', '/learning', '/learning/java-tutorial/introduction-to-java', '/jobs'];
    assert.deepEqual(views.slice(0, 4).map(x => new URL(x.page).pathname), expectedPaths);
    if (views.length !== expectedPaths.length) report.blockers.push('Disable Enhanced Measurement: Page changes based on browser history events. Google sent extra page views beyond the app-owned events.');
    assert(!JSON.stringify(report.requests).includes('fabricated-secret'), 'No query/fragment credential leakage');
    assert(report.requests.every(x => x.measurementIdMatches));
    assert.equal(loaderCount, beforeConsent, 'One loader across consent updates and client navigation');
    assert.deepEqual(await page.evaluate(() => window.analyticsCookieViolations), []);
    report.checks.push('Real Google tag: cookieless initial view, no analytics cookie writes before consent, acceptance, manual navigation and deduplication');

    const count = report.requests.length;
    await page.evaluate(() => window.qa.navigate('/account/applications?code=fabricated-secret'));
    await page.waitForTimeout(600);
    assert.equal(await page.evaluate(id => window[`ga-disable-${id}`], id), true);
    assert.equal(report.requests.length, count, 'No private-route collection');
    await page.evaluate(() => { window.qa.choose(false); window.qa.navigate('/jobs'); });
    await waitForRequests(count + 1);
    assert(report.requests.length > count, 'Cookieless collection resumes on public pages after withdrawal');
    await assertNoAnalyticsCookies();
    await page.reload();
    await page.waitForTimeout(1000);
    assert.equal(await page.evaluate(() => !!window.gtag), true);
    await assertNoAnalyticsCookies();
    report.checks.push('Private-route opt-out, withdrawal clears analytics cookies, persisted denial keeps cookieless measurement');

    await page.goto(origin + '/nonce/projects');
    const beforeNonce = report.requests.length;
    await page.evaluate(() => window.qa.choose(true));
    await waitForRequests(beforeNonce + 1);
    assert.equal(await page.locator('script[src*="googletagmanager.com/gtag/js"]').evaluate(s => s.nonce), 'browserFixtureNonce123');
    await page.reload();
    await waitForRequests(beforeNonce + 2);
    assert.equal(await page.locator('script[src*="googletagmanager.com/gtag/js"]').count(), 1);
    assert.equal(exceptions.length, 0, 'Original Google cookie exception must be absent');
    assert.deepEqual(violations, [], 'No CSP violations');
    report.checks.push('Stored acceptance, nonce/strict-dynamic CSP and no sandbox exceptions');

    failLoader = true;
    await page.goto(origin + '/projects');
    await page.waitForTimeout(500);
    assert.equal(await page.evaluate(id => window[`ga-disable-${id}`], id), true);
    const failedCount = report.requests.length;
    failLoader = false;
    await page.evaluate(() => window.qa.choose(true));
    await waitForRequests(failedCount + 1);
    assert.equal(report.requests.length, failedCount + 1, 'A later action retries a failed tag once');
    report.checks.push('Script failure fails closed and a later consent action retries');
    if (appUrl) {
      await context.clearCookies();
      const initialCount = report.requests.length;
      await page.goto(appUrl.origin);
      await page.waitForTimeout(500);
      await assertNoAnalyticsCookies();
      await page.getByRole('button', { name: 'Accept all', exact: true }).click();
      await waitForRequests(initialCount + 1);
      for (const path of ['/learning', '/projects', '/jobs']) {
        await page.locator(`a[href="${path}"]`).first().click();
        await page.waitForURL(appUrl.origin + path);
        await page.waitForTimeout(900);
      }
      await page.waitForTimeout(5500);
      const appViews = report.requests.slice(initialCount).filter(x => x.event === 'page_view');
      const appPaths = appViews.map(x => new URL(x.page).pathname);
      const manualPaths = await page.evaluate(() => window.dataLayer.filter(x => x[0] === 'event' && x[1] === 'page_view').map(x => x[2].page_path));
      assert.deepEqual(manualPaths, ['/', '/learning', '/projects', '/jobs'], 'Next.js must queue exactly one manual view per route');
      assert.deepEqual(appPaths.filter((path, index) => path !== appPaths[index - 1]), ['/', '/learning', '/projects', '/jobs']);
      if (appViews.length !== 4) report.blockers.push('Next.js app also received additional Enhanced Measurement history views');
      const documentPath = await page.evaluate(() => new URL(performance.getEntriesByType('navigation')[0].name).pathname);
      assert.equal(documentPath, '/', 'Actual Next.js route clicks must retain the original document');
      assert.equal(exceptions.length, 0);
      assert.deepEqual(violations, []);
      report.checks.push('Rebuilt Next.js app: initial page view, real client router navigation, no sandbox exception or CSP violations');
    }
    await cdp.detach();
    await context.close();
    console.log(JSON.stringify(report, null, 2));
    if (report.blockers.length) process.exitCode = 1;
  } catch (error) {
    console.log(JSON.stringify(report, null, 2));
    throw error;
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
