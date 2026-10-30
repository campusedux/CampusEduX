#!/usr/bin/env node
'use strict';

// Run from the repository root:
// node website/scripts/staging-browser-qa.cjs --output /tmp/campusedux-staging-qa.json
// Uses the existing local Playwright/browser installation. No installs, env-file
// reads, login, form submission, payment interaction, or production navigation.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const ROOT = path.resolve(__dirname, '../..');
const ORIGIN = 'http://localhost:3100';
const ROUTES = ['/', '/learning', '/jobs', '/projects'];
const STAGING_SUPABASE = 'biktjhenbvnklmagmvav.supabase.co';

function option(name, fallback) {
  const index = process.argv.indexOf(name);
  return index < 0 ? fallback : process.argv[index + 1];
}
function localRequest(raw) {
  try { return new URL(raw).origin === ORIGIN; } catch { return false; }
}
function endpoint(raw) {
  // Never retain query strings, fragments, credentials, headers or bodies.
  try {
    const u = new URL(raw);
    if (u.origin === ORIGIN) {
      if (u.pathname.startsWith('/api/')) return u.pathname.replace(/\/[^/]{40,}/g, '/[redacted]');
      if (ROUTES.includes(u.pathname)) return u.pathname;
      if (u.pathname.startsWith('/_next/')) return u.pathname;
      return '[other-local-resource]';
    }
    return u.hostname === STAGING_SUPABASE ? '[staging-supabase-blocked]' : '[external-blocked]';
  } catch { return '[invalid-url]'; }
}
function cacheHeaders(headers) {
  const names = ['cache-control', 'age', 'x-nextjs-cache', 'x-vercel-cache', 'content-type', 'content-length'];
  return Object.fromEntries(names.filter(k => headers[k] !== undefined).map(k => [k, headers[k]]));
}
function selfTest() {
  assert(localRequest(ORIGIN + '/projects'));
  assert(!localRequest('https://campusedux.com/'));
  assert(!localRequest('https://www.campusedux.com/'));
  assert(!localRequest('http://localhost:3100.evil.example/'));
  assert(!localRequest('http://localhost:3101/'));
  assert(!localRequest('https://' + STAGING_SUPABASE + '/rest/v1/projects'));
  assert.equal(endpoint(ORIGIN + '/api/search?q=PRIVATE&token=SECRET#PRIVATE'), '/api/search');
  assert.equal(endpoint('https://prod.supabase.co/rest/v1/projects?apikey=SECRET'), '[external-blocked]');
  assert.deepEqual(cacheHeaders({'set-cookie':'SECRET','authorization':'SECRET','cache-control':'no-store'}), {'cache-control':'no-store'});
  console.log('SELF-TEST PASS: origin restrictions, URL redaction, header allowlist. No browser or network started.');
}

async function run() {
  if (process.argv.includes('--self-test')) return selfTest();
  const pairs = Number(option('--pairs', '3'));
  if (!Number.isInteger(pairs) || pairs < 1 || pairs > 5) throw new Error('Use --pairs 1..5');
  const output = path.resolve(option('--output', '/tmp/campusedux-staging-qa.json'));
  const browserDir = path.join(ROOT, 'build/playwright-mcp-phase7/browsers');
  process.env.PLAYWRIGHT_BROWSERS_PATH = browserDir;
  const { chromium } = require(path.join(ROOT, 'build/playwright-mcp-phase7/node_modules/playwright'));
  const browser = await chromium.launch({
    headless: true,
    chromiumSandbox: true,
    executablePath: path.join(browserDir, 'chromium_headless_shell-1247/chrome-headless-shell-linux64/chrome-headless-shell'),
  });
  const report = {
    target: ORIGIN,
    generatedAt: new Date().toISOString(),
    paymentFlows: 'not verified: no Razorpay test keys in staging',
    settings: { pairs, browsers: 1, tabs: 1, sandbox: true, persistentProfile: false, externalRequests: 'blocked', postRequests: 'blocked' },
    limitations: [
      'This script blocks browser network traffic outside exactly http://localhost:3100. It cannot constrain server-side upstream requests: use your already-verified staging environment.',
      'Direct browser Supabase attempts are counted and blocked. Same-origin /api requests are counted separately; browser tools cannot count server-side Supabase SQL/RPC calls. Zero browser calls does not mean zero database work.',
      'Intercepting requests disables the normal browser HTTP cache in Playwright. CDP Fetch interception is used instead so ordinary cache behavior can remain enabled; verify CDP cache-source flags in the results.',
      'Cold means browser cache cleared before the visit, with caching enabled so the response can populate it. Repeat immediately follows without clearing. This does not clear Next/CDN/database caches.',
      'TTFB includes transport and server work. It is not pure server compute time. Localhost cannot reproduce deployed CDN/Storage/network latency.',
      'LCP is measured during a fixed observation window after load, before interactions. It is a lab sample, not field Core Web Vitals.',
      'Accessibility checks cover named dialogs, keyboard containment, Escape, focus restoration, filter IDs/labels and price names. They are not a full WCAG audit.',
      'The running production build may differ from source changes. Rebuild the intended branch before comparing before/after results.',
    ],
    runs: [], accessibility: [], listingEvidence: [], skipped: [], failures: [],
  };
  let context;
  let current = null;
  const addFailure = (area, error) => report.failures.push({area, type:error?.name || 'Error'});
  try {
    context = await browser.newContext({ serviceWorkers: 'block' });
    // A production static-page audit needs no WebSockets. Block handshakes,
    // including any external socket not intercepted by HTTP Fetch handling.
    await context.routeWebSocket('**/*', socket => socket.close());
    const page = await context.newPage();
    page.setDefaultTimeout(6000);
    page.setDefaultNavigationTimeout(30000);
    const cdp = await context.newCDPSession(page);
    await cdp.send('Network.enable');
    // Unlike context.route, raw CDP interception does not automatically turn
    // off the HTTP cache. Every external request, redirect hop and non-GET
    // request is rejected before network dispatch.
    await cdp.send('Fetch.enable', {patterns:[{urlPattern:'*',requestStage:'Request'}]});
    cdp.on('Fetch.requestPaused', async e => {
      try {
        const allowed = localRequest(e.request.url) && ['GET','HEAD'].includes(e.request.method);
        if (!allowed && current) {
          current.blockedRequests++;
          if (new URL(e.request.url).hostname === STAGING_SUPABASE) current.directStagingSupabaseAttempts++;
          current.blockedKinds[endpoint(e.request.url)] = (current.blockedKinds[endpoint(e.request.url)] || 0) + 1;
        }
        await cdp.send(allowed ? 'Fetch.continueRequest' : 'Fetch.failRequest', allowed ? {requestId:e.requestId} : {requestId:e.requestId,errorReason:'BlockedByClient'});
      } catch { /* teardown may race a paused request */ }
    });
    const requests = new Map();
    cdp.on('Network.requestWillBeSent', e => {
      if (!current) return;
      requests.set(e.requestId, current);
      current.requests++;
      const u = new URL(e.request.url);
      if (u.origin === ORIGIN && u.pathname.startsWith('/api/')) {
        current.sameOriginApiRequests++;
        current.apiCounts[endpoint(e.request.url)] = (current.apiCounts[endpoint(e.request.url)] || 0) + 1;
      }
    });
    cdp.on('Network.requestServedFromCache', e => { const r=requests.get(e.requestId); if(r) r.cacheEvents++; });
    cdp.on('Network.responseReceived', e => {
      const run = requests.get(e.requestId);
      if (!run) return;
      const r=e.response;
      if (r.fromDiskCache) run.diskCacheResponses++;
      if (r.fromServiceWorker) run.serviceWorkerResponses++;
      if (r.status >= 400) run.httpErrors.push({endpoint:endpoint(r.url),status:r.status});
      if (e.type === 'Document') { run.status=r.status; run.documentHeaders=cacheHeaders(Object.fromEntries(Object.entries(r.headers).map(([k,v])=>[k.toLowerCase(),v]))); }
      if (r.url.includes('custom-project-banner')) run.bannerResponses.push({endpoint:endpoint(r.url),status:r.status,fromDiskCache:!!r.fromDiskCache,headers:cacheHeaders(Object.fromEntries(Object.entries(r.headers).map(([k,v])=>[k.toLowerCase(),v])))});
    });
    cdp.on('Network.loadingFinished', e => { const run=requests.get(e.requestId); if(run) run.networkEncodedBytes+=e.encodedDataLength; requests.delete(e.requestId); });
    cdp.on('Network.loadingFailed', e => { const run=requests.get(e.requestId); if(run) run.networkFailures++; requests.delete(e.requestId); });
    page.on('pageerror', () => { if (current) current.runtimeErrors++; });
    page.on('console', msg => { if(current && msg.type()==='error') current.consoleErrors++; });
    await page.addInitScript(() => {
      window.__stagingQa={lcpMs:null,cls:0,longTaskCount:0,longTaskTotalMs:0};
      for (const [type, handler] of [
        ['largest-contentful-paint',e=>{window.__stagingQa.lcpMs=e.startTime;}],
        ['layout-shift',e=>{if(!e.hadRecentInput)window.__stagingQa.cls+=e.value;}],
        ['longtask',e=>{window.__stagingQa.longTaskCount++;window.__stagingQa.longTaskTotalMs+=e.duration;}],
      ]) { try { new PerformanceObserver(list=>list.getEntries().forEach(handler)).observe({type,buffered:true}); } catch {} }
    });
    const profiles = [
      {name:'desktop',viewport:{width:1440,height:900},latencyMs:20,download:1250000,upload:625000,cpu:1},
      {name:'mobile',viewport:{width:390,height:844},latencyMs:150,download:200000,upload:93750,cpu:4},
    ];
    for (const profile of profiles) {
      await page.setViewportSize(profile.viewport);
      await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:profile.latencyMs,downloadThroughput:profile.download,uploadThroughput:profile.upload});
      await cdp.send('Emulation.setCPUThrottlingRate',{rate:profile.cpu});
      for (const route of ROUTES) {
        for (let pair=1; pair<=pairs; pair++) {
          for (const cache of ['cold-browser','repeat-browser']) {
            // Freeze the previous record before beginning the next navigation.
            current=null;
            if(cache==='cold-browser') await cdp.send('Network.clearBrowserCache');
            await cdp.send('Network.setCacheDisabled',{cacheDisabled:false});
            const run={route,profile:profile.name,pair,cache,throttling:{latencyMs:profile.latencyMs,downloadBytesPerSecond:profile.download,cpu:profile.cpu},requests:0,sameOriginApiRequests:0,apiCounts:{},directStagingSupabaseAttempts:0,blockedRequests:0,blockedKinds:{},cacheEvents:0,diskCacheResponses:0,serviceWorkerResponses:0,networkEncodedBytes:0,networkFailures:0,runtimeErrors:0,consoleErrors:0,httpErrors:[],bannerResponses:[]};
            current=run;
            try {
              const response=await page.goto(ORIGIN+route,{waitUntil:'load'});
              run.status=response?.status() ?? null;
              if (!localRequest(page.url())) throw new Error('Unexpected navigation origin');
              await page.waitForTimeout(1500);
              run.metrics=await page.evaluate(()=>{
                const timing=e=>e?{dnsMs:e.domainLookupEnd-e.domainLookupStart,ttfbMs:e.responseStart-e.requestStart,responseStartMs:e.responseStart,downloadMs:e.responseEnd-e.responseStart,durationMs:e.duration,transferBytes:e.transferSize,encodedBodyBytes:e.encodedBodySize}:null;
                const n=performance.getEntriesByType('navigation')[0];
                const resources=performance.getEntriesByType('resource');
                const scripts=resources.filter(e=>e.initiatorType==='script');
                const banner=[...document.images].find(i=>i.currentSrc.includes('custom-project-banner'));
                const bannerEntry=banner?resources.find(e=>e.name===banner.currentSrc):null;
                return {navigation:timing(n),domContentLoadedMs:n?.domContentLoadedEventEnd,loadMs:n?.loadEventEnd,...window.__stagingQa,resourceCount:resources.length,jsTransferBytes:scripts.reduce((n,e)=>n+e.transferSize,0),jsEncodedBodyBytes:scripts.reduce((n,e)=>n+e.encodedBodySize,0),compilerRouteResources:resources.filter(e=>e.name.includes('/app/compiler/')).length,banner:banner?{timing:timing(bannerEntry),loading:banner.loading,fetchPriority:banner.fetchPriority,sizes:banner.sizes,width:banner.width,naturalWidth:banner.naturalWidth}:null,viewport:innerWidth,documentWidth:document.documentElement.scrollWidth,brokenImages:[...document.images].filter(i=>i.getClientRects().length&&i.complete&&!i.naturalWidth).length,missingImageAlt:[...document.images].filter(i=>!i.hasAttribute('alt')).length};
              });
              if (['/jobs','/projects'].includes(route) && pair===pairs && cache==='repeat-browser') {
                const evidence=await page.locator('main').evaluate((main,route)=>{
                  const links=[...main.querySelectorAll('a[href]')].filter(a=>{
                    const u=new URL(a.getAttribute('href'),location.href);
                    const pattern=route==='/jobs'?/^\/jobs\/[^/]+$/:/^\/projects\/[^/]+$/;
                    return u.origin===location.origin&&pattern.test(u.pathname)&&!['companies','trending','new','premium','best-sellers','category'].includes(u.pathname.split('/').at(-1));
                  });
                  const text=main.innerText;
                  return {visibleDetailLinkCount:links.filter(a=>a.getClientRects().length).length,renderedEmptyState:route==='/jobs'?text.includes('No open roles right now'):text.includes('No projects listed yet'),renderedErrorState:/temporarily unavailable|something went wrong|unable to load|try again/i.test(text)};
                },route);
                report.listingEvidence.push({route,profile:profile.name,...evidence});
              }
            } catch(e) { run.error={type:e.name}; addFailure('load '+route,e); }
            report.runs.push(run);
            console.log(`${profile.name} ${route} ${pair}/${pairs} ${cache}: status=${run.status ?? 'unavailable'} TTFB=${Math.round(run.metrics?.navigation?.ttfbMs ?? -1)}ms LCP=${Math.round(run.metrics?.lcpMs ?? -1)}ms API=${run.sameOriginApiRequests} Supabase-attempts=${run.directStagingSupabaseAttempts}`);
            if (run.error && !run.status) {
              report.skipped.push('Remaining visits and accessibility: target unreachable or navigation did not finish.');
              return;
            }
          }
        }
      }
    }
    current=null;
    await cdp.send('Network.setCacheDisabled',{cacheDisabled:false});
    await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});
    await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});
    async function check(name, fn) {
      try { const details=await fn();report.accessibility.push({name,result:'PASS',details});console.log('PASS '+name); }
      catch(e) {report.accessibility.push({name,result:'FAIL',errorType:e.name});console.log('FAIL '+name);}
    }
    function requireCondition(ok) { if(!ok) throw new Error('Check failed'); }
    async function dialogCheck(trigger, name) {
      await trigger.click();
      const dialog=page.getByRole('dialog',{name,exact:true});await dialog.waitFor({state:'visible'});
      requireCondition(await dialog.getAttribute('aria-modal')==='true');
      await page.waitForTimeout(150);
      requireCondition(await trigger.getAttribute('aria-expanded')==='true');
      requireCondition(await dialog.evaluate(e=>e.contains(document.activeElement)));
      // Exercise the actual wrapping boundaries, even when a drawer has more
      // controls than the additional sequential Tab presses below.
      await dialog.evaluate(e=>{
        const controls=[...e.querySelectorAll('a[href],button,input,select,textarea,[tabindex]')].filter(n=>n.tabIndex>=0&&!n.matches(':disabled')&&n.getClientRects().length&&getComputedStyle(n).visibility!=='hidden');
        controls.at(-1)?.focus();
      });
      await page.keyboard.press('Tab');
      requireCondition(await dialog.evaluate(e=>{
        const controls=[...e.querySelectorAll('a[href],button,input,select,textarea,[tabindex]')].filter(n=>n.tabIndex>=0&&!n.matches(':disabled')&&n.getClientRects().length&&getComputedStyle(n).visibility!=='hidden');
        return controls.length>0&&document.activeElement===controls[0];
      }));
      await page.keyboard.press('Shift+Tab');
      requireCondition(await dialog.evaluate(e=>{
        const controls=[...e.querySelectorAll('a[href],button,input,select,textarea,[tabindex]')].filter(n=>n.tabIndex>=0&&!n.matches(':disabled')&&n.getClientRects().length&&getComputedStyle(n).visibility!=='hidden');
        return document.activeElement===controls.at(-1);
      }));
      for(let i=0;i<12;i++) { await page.keyboard.press('Tab');requireCondition(await dialog.evaluate(e=>e.contains(document.activeElement))); }
      for(let i=0;i<12;i++) { await page.keyboard.press('Shift+Tab');requireCondition(await dialog.evaluate(e=>e.contains(document.activeElement))); }
      await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});
      requireCondition(await trigger.evaluate(e=>e===document.activeElement));
      requireCondition(await trigger.getAttribute('aria-expanded')==='false');
    }
    await page.setViewportSize({width:390,height:844});
    await page.goto(ORIGIN+'/',{waitUntil:'load'});await page.waitForTimeout(700);
    await check('mobile menu: name, state, Tab trap, Escape, return focus',async()=>{
      const trigger=page.getByRole('button',{name:'Open menu',exact:true});
      requireCondition(await trigger.getAttribute('aria-haspopup')==='dialog');
      requireCondition(await trigger.getAttribute('aria-expanded')==='false');
      await trigger.click();requireCondition(await trigger.getAttribute('aria-expanded')==='true');
      const menu=page.getByRole('dialog',{name:'Menu',exact:true});await menu.waitFor({state:'visible'});
      await page.waitForTimeout(150);
      await page.keyboard.press('Escape');
      await menu.waitFor({state:'hidden'});
      await dialogCheck(trigger,'Menu');
      requireCondition(await trigger.getAttribute('aria-expanded')==='false');
      return {tabPresses:24};
    });
    await page.keyboard.press('Escape');
    await check('mobile search: named modal, Tab trap, Escape, return focus',async()=>{
      await dialogCheck(page.getByRole('button',{name:'Search CampusEduX',exact:true}),'Search CampusEduX');return {tabPresses:24};
    });
    await page.keyboard.press('Escape');
    for (const route of ['/jobs','/projects']) {
      await check(route+' filter IDs and mobile label associations',async()=>{
        await page.goto(ORIGIN+route,{waitUntil:'load'});await page.waitForTimeout(500);
        const trigger=page.getByRole('button',{name:/^Filters/}).first();await trigger.click();
        const dialog=page.getByRole('dialog',{name:'Filters',exact:true});await dialog.waitFor({state:'visible'});
        const result=await page.evaluate(()=>{
          const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);
          const duplicates=ids.filter((id,i)=>ids.indexOf(id)!==i);
          const d=[...document.querySelectorAll('[role=dialog]')].find(e=>e.getAttribute('aria-label')==='Filters'&&getComputedStyle(e).visibility!=='hidden');
          const labels=d?[...d.querySelectorAll('label[for]')]:[];
          return {duplicateIdCount:new Set(duplicates).size,labelCount:labels.length,misdirectedLabels:labels.filter(l=>!l.control||!d.contains(l.control)).length};
        });
        requireCondition(result.duplicateIdCount===0&&result.labelCount>0&&result.misdirectedLabels===0);
        await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});return result;
      });
      await page.keyboard.press('Escape');
    }
    await check('project price bounds have explicit distinct names',async()=>{
      await page.setViewportSize({width:1440,height:900});await page.goto(ORIGIN+'/projects',{waitUntil:'load'});
      const min=page.locator('input[name=min]:visible'),max=page.locator('input[name=max]:visible');
      const names=await Promise.all([min.getAttribute('aria-label'),max.getAttribute('aria-label')]);
      requireCondition(names[0]==='Minimum price in rupees'&&names[1]==='Maximum price in rupees');return {namedBounds:2};
    });
    if(report.listingEvidence.some(e=>e.renderedEmptyState)) report.seedChecklist={
      interpretation:'The UI rendered an empty list. This does not prove the database contains no rows; publication, RLS, filters and server errors must be considered.',
      categories:{count:1,fields:['id','name']},
      companies:{count:1,fields:['id','name','about','website','logo_url (optional)']},
      projects:{count:1,fields:['id','title','status=published','target_type=global','category_id','category_name','description','tech_stack','price','thumbnail_url (optional)','images (optional)','rating=0','review_count=0','is_premium=false','is_best_seller=false','created_at'],note:'A second published project in the same category is needed to exercise related cards.'},
      jobs:{count:1,fields:['id','title','status=open','target_type=global','application_deadline=null or future','company_id','company_name','location','job_type=Full Time','experience_level=Fresher','description','requirements','skills','experience','salary_range','posted_at','apply_url (optional)']},
      action:'User creates synthetic staging data. The runner never writes data, submits applications or follows purchase/payment links.'
    };
  } catch(e) { addFailure('runner',e); }
  finally {
    if(context) await context.close().catch(()=>{});
    await browser.close().catch(()=>{});
    report.summary={runs:report.runs.length,failedLoads:report.failures.length,accessibilityPass:report.accessibility.filter(c=>c.result==='PASS').length,accessibilityFail:report.accessibility.filter(c=>c.result==='FAIL').length};
    const median=values=>{const a=values.filter(Number.isFinite).sort((x,y)=>x-y);return a.length?(a[Math.floor((a.length-1)/2)]+a[Math.floor(a.length/2)])/2:null;};
    const groups=new Map();
    for(const r of report.runs){const key=[r.route,r.profile,r.cache].join(' ');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(r);}
    const performanceSummary=[...groups.entries()].map(([group,rs])=>({group,samples:rs.length,statuses:[...new Set(rs.map(r=>r.status??null))],medianTTFBMs:median(rs.map(r=>r.metrics?.navigation?.ttfbMs)),medianLCPMs:median(rs.map(r=>r.metrics?.lcpMs)),medianJsTransferBytes:median(rs.map(r=>r.metrics?.jsTransferBytes)),apiRequestCounts:rs.map(r=>r.apiCounts),directStagingSupabaseAttempts:rs.map(r=>r.directStagingSupabaseAttempts),blockedRequests:rs.map(r=>r.blockedRequests),diskCacheResponses:rs.map(r=>r.diskCacheResponses),cacheEvents:rs.map(r=>r.cacheEvents),documentCacheHeaders:rs.map(r=>r.documentHeaders??{}),compilerRouteResources:rs.map(r=>r.metrics?.compilerRouteResources??null),runtimeErrors:rs.map(r=>r.runtimeErrors),consoleErrors:rs.map(r=>r.consoleErrors),httpErrors:rs.flatMap(r=>r.httpErrors)}));
    const compact={target:report.target,generatedAt:report.generatedAt,summary:report.summary,paymentFlows:report.paymentFlows,performance:performanceSummary,accessibility:report.accessibility,listingEvidence:report.listingEvidence,seedChecklist:report.seedChecklist??null,failures:report.failures,skipped:report.skipped,limitations:report.limitations};
    const summaryPath=output.replace(/\.json$/i,'')+'.summary.json';
    fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n',{mode:0o600});
    fs.writeFileSync(summaryPath,JSON.stringify(compact,null,2)+'\n',{mode:0o600});
    console.log('REPORT '+output);
    console.log('PASTE BACK '+summaryPath);
    console.log('SUMMARY '+JSON.stringify(report.summary));
    if(report.failures.length||report.summary.accessibilityFail)process.exitCode=1;
  }
}
run().catch(error=>{console.error('QA runner could not start: '+error.name+'. Check the documented local package/browser paths; no automatic download was attempted.');process.exitCode=1;});
