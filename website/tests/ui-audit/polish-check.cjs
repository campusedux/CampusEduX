// Run: PLAYWRIGHT_BROWSERS_PATH=/tmp/campusedux-browsers node website/tests/ui-audit/polish-check.cjs
const { chromium } = require(require.resolve('playwright', {paths:[process.cwd()+'/website', '/tmp/campusedux-ui-tools']}));
const fs = require('fs'), http = require('http'), path = require('path'), assert = require('assert');
const out = '/tmp/campusedux-polish', results = [];
const previous=(process.env.UI_POLISH_RETRY_FAILED==='1'||process.env.UI_POLISH_RECAPTURE==='1')&&fs.existsSync(out+'/results.json')?JSON.parse(fs.readFileSync(out+'/results.json','utf8')):null;
const retryNames=previous?new Set(previous.filter(r=>!r.ok||(process.env.UI_POLISH_RECAPTURE==='1'&&/ (360|390)px normal in$/.test(r.name))).map(r=>r.name)):null;
// Reuse the production build's downloaded fonts when available; never fetch them in fixtures.
const buildStatic='/tmp/campusedux-polish-build/.next/static';
let fontCss='';
fs.mkdirSync(out+'/fonts',{recursive:true});
if(fs.existsSync(buildStatic+'/media')) for(const file of fs.readdirSync(buildStatic+'/media').filter(f=>f.endsWith('.woff2'))) fs.copyFileSync(buildStatic+'/media/'+file,out+'/fonts/'+file);
if(fs.existsSync(buildStatic+'/css')) {
  const css=fs.readdirSync(buildStatic+'/css').filter(f=>f.endsWith('.css')).map(f=>fs.readFileSync(buildStatic+'/css/'+f,'utf8')).join('\n');
  fontCss=(css.match(/@font-face\{[^}]+\}/g)||[]).join('\n');
  const sans=fontCss.match(/font-family:([^;]*Plus_Jakarta_Sans[^;]*);/)?.[1];
  const display=fontCss.match(/font-family:([^;]*Bricolage_Grotesque[^;]*);/)?.[1];
  if(sans&&display)fontCss+=`:root{--font-sans:${sans};--font-display:${display}}`;
}
const server = http.createServer((req,res) => {
  const url = new URL(req.url,'http://localhost');
  if(url.pathname==='/fonts.css'){res.setHeader('Content-Type','text/css');res.end(fontCss);return;}
  if(url.pathname.startsWith('/_next/static/media/')&&/^[\w.-]+\.woff2$/.test(path.basename(url.pathname))){const file=out+'/fonts/'+path.basename(url.pathname);if(!fs.existsSync(file)){res.statusCode=404;res.end();return;}res.setHeader('Content-Type','font/woff2');res.end(fs.readFileSync(file));return;}
  if(url.pathname==='/api/session') {res.setHeader('Content-Type','application/json');res.end(JSON.stringify({profile:new URL(req.headers.referer||'http://localhost').searchParams.get('auth')==='out'?null:{id:'fixture-user',fullName:'Test Student',email:'student@example.test'}}));return;}
  if(url.pathname==='/api/announcements') {res.setHeader('Content-Type','application/json');res.end(JSON.stringify({announcement:null}));return;}
  if(url.pathname==='/api/search') {res.setHeader('Content-Type','application/json');res.end(JSON.stringify({groups:[],total:0}));return;}
  const file = url.pathname.startsWith('/brand/') ? process.cwd()+'/website/public'+url.pathname : out+url.pathname;
  if(/\.(js|css|png)$/.test(url.pathname)&&fs.existsSync(file)) {res.setHeader('Content-Type',url.pathname.endsWith('.js')?'application/javascript':url.pathname.endsWith('.css')?'text/css':'image/png');res.end(fs.readFileSync(file));return;}
  const variant=url.searchParams.get('variant')==='before'?'before':'after';
  res.setHeader('Content-Type','text/html');res.end(`<!doctype html><html lang="en" class="dark"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/fonts.css"><link rel="stylesheet" href="/${variant}.css"><body class="font-sans"><div id="root"></div><script src="/${variant}.js"></script></body></html>`);
});
async function check(name,fn) {
  if(retryNames&&!retryNames.has(name))return;
  try {await fn();results.push({name,ok:true});console.log('PASS',name);}
  catch(e){results.push({name,ok:false,error:e.message});console.log('FAIL',name,e.message);}
}
(async()=>{
  await new Promise((ok,no)=>{server.once('error',no);server.listen(4182,'127.0.0.1',ok)});
  const browser=await chromium.launch({headless:true});
  try {
    const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
    page.setDefaultTimeout(30000);
    let errors=[];page.on('pageerror',e=>errors.push(e.message));
    // No remote resources: all data fixtures and browser requests remain on loopback.
    await page.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
    async function open(route,state='normal',auth='in',variant='after') {
      errors=[];await page.goto(`http://127.0.0.1:4182/?page=${route}&state=${state}&auth=${auth}&variant=${variant}`,{waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
      await page.evaluate(()=>document.fonts.ready);
      await page.waitForTimeout(250);
    }
    const pages=['home','learning','jobs','projects','account'];
    for(const width of [360,390,430]) {
      await page.setViewportSize({width,height:844});
      for(const route of pages) {
        for(const state of ['normal','long','empty','many']) for(const auth of ['in','out']) {
          await check(`${route} ${width}px ${state} ${auth}`,async()=>{
            await open(route,state,auth);
            assert.deepEqual(errors,[],'Browser errors');
            assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Horizontal page overflow');
            if(route==='account'&&auth==='out') {assert((await page.locator('html').getAttribute('data-redirect')).includes('REDIRECT:/login'));return;}
            const heading=page.locator('main h1');assert.equal(await heading.count(),1,'One page title');
            assert.equal(await heading.evaluate(e=>getComputedStyle(e).fontSize),'22px');
            if(['learning','jobs','projects'].includes(route)) {
              const expected={learning:'rgb(13, 148, 136)',jobs:'rgb(59, 130, 246)',projects:'rgb(251, 146, 60)'}[route];
              assert.equal(await page.locator('.page-header > div > svg').evaluate(e=>getComputedStyle(e).color),expected,'Section accent must tint the header icon');
            }
            const header=await page.locator('body #root > header').boundingBox(), title=await heading.boundingBox();
            assert(title.y>=header.y+header.height,'Header overlaps title');
            for(const target of await page.locator('nav[aria-label=Primary] a, .chip-row a, main button[type=submit]').all()) {
              if(!await target.isVisible())continue;
              const box=await target.boundingBox();assert(box.height>=44&&box.width>=44,'Small touch target');
            }
            if(state==='normal'&&width!==430&&auth==='in') {
              // Reveal the real below-fold sections before the full-page capture.
              await page.evaluate(async()=>{for(let y=0;y<document.documentElement.scrollHeight;y+=innerHeight/2){scrollTo({top:y,behavior:'instant'});await new Promise(r=>setTimeout(r,25));}scrollTo({top:0,behavior:'instant'});});
              await page.waitForTimeout(250);
              await page.screenshot({path:path.join(out,`${route}-${width}-after.png`),animations:'disabled'});
              await page.screenshot({path:path.join(out,`${route}-${width}-full.png`),fullPage:true,animations:'disabled'});
            }
            if(state==='many'&&['learning','jobs','projects'].includes(route)) {
              const prefix=route==='learning'?'/learning/course-':route==='jobs'?'/jobs/job-':'/projects/project-';
              assert(await page.locator(`main a[href^="${prefix}"]`).count()>=105,'Stress fixture must render at least 105 items');
              await page.evaluate(()=>scrollTo(0,500));
              const chip=await page.locator('.chip-row').boundingBox(), top=await page.locator('body #root > header').boundingBox();
              assert(Math.abs(chip.y-(top.y+top.height))<=1,'Sticky chips overlap header or do not stick');
            }
            await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));
            const clearance=await page.evaluate(()=>{const main=document.querySelector('main'),nav=document.querySelector('nav[aria-label=Primary]');return {bottom:main.getBoundingClientRect().bottom-parseFloat(getComputedStyle(main).paddingBottom),nav:nav.getBoundingClientRect().top,padding:parseFloat(getComputedStyle(main).paddingBottom)}});
            assert(clearance.padding===76,'Bottom padding must equal 60px nav + 16px');
            assert(clearance.bottom<=clearance.nav-15,'Last content hidden by bottom nav');
            if(state==='empty'&&['learning','jobs','projects'].includes(route)) assert(await page.getByText(route==='jobs'?'No open roles right now':route==='projects'?'No projects listed yet':'No courses yet',{exact:true}).count(),'Missing honest empty state');
          });
        }
        for(const state of ['loading',...(['learning','jobs','projects'].includes(route)?['error']:[])]) {
          await check(`${route} ${width}px ${state}`,async()=>{
            await open(route,state);
            assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
            if(state==='loading'){assert.equal(await page.getByRole('status').count(),1);assert.equal(await page.locator('.animate-spin').count(),0);}
            else {assert.equal(await page.getByRole('alert').count(),1);assert(!await page.locator('main').textContent().then(s=>s.includes('Private fixture diagnostics')));await page.getByRole('button',{name:'Retry',exact:true}).click();assert.equal(await page.locator('html').getAttribute('data-retried'),'true');}
          });
        }
      }
      await check(`Navigation overlays ${width}px`,async()=>{
        await open('jobs');
        await page.getByRole('button',{name:'Search CampusEduX',exact:true}).click();
        const search=page.getByRole('dialog',{name:'Search CampusEduX',exact:true});
        await search.waitFor({state:'visible'});
        assert.equal(await search.evaluate(e=>getComputedStyle(e.parentElement).zIndex),'50');
        assert(await page.evaluate(()=>!document.elementFromPoint(innerWidth/2,innerHeight-20)?.closest('nav[aria-label=Primary]')),'Bottom nav is above the search overlay');
        await page.getByRole('button',{name:'Close search',exact:true}).click();
        await page.getByRole('button',{name:'Filters',exact:true}).click();
        const filter=page.getByRole('dialog',{name:'Filters',exact:true});
        await filter.waitFor({state:'visible'});
        assert.equal(await filter.evaluate(e=>getComputedStyle(e.parentElement).zIndex),'50');
        const bounds=await filter.boundingBox();assert(bounds.x>=0&&bounds.x+bounds.width<=width&&bounds.y>=0,'Filter drawer is clipped');
        await page.keyboard.press('Escape');
        assert.equal(await page.evaluate(()=>document.body.style.overflow),'');
      });
    }
    for(const width of (fs.existsSync(out+'/before.js')?[360,390]:[])) for(const route of pages) await check(`Before capture ${route} ${width}px`,async()=>{
      await page.setViewportSize({width,height:844});await open(route,'normal','in','before');await page.screenshot({path:path.join(out,`${route}-${width}-before.png`),fullPage:true,animations:'disabled'});
    });
    await check('Reduced motion disables list animation',async()=>{
      await page.emulateMedia({reducedMotion:'reduce'});await open('learning');assert.equal(await page.locator('.list-enter').first().evaluate(e=>getComputedStyle(e).animationName),'none');
    });
    await check('Motion duration and card press feedback',async()=>{
      await page.emulateMedia({reducedMotion:'no-preference'});await open('learning');assert.equal(await page.locator('.list-enter').first().evaluate(e=>getComputedStyle(e).animationDuration),'0.2s');
      const card=page.locator('a.card-hover').first();assert.equal(await card.evaluate(e=>getComputedStyle(e).transitionDuration),'0.12s');
      await card.hover();await page.mouse.down();await page.waitForTimeout(160);assert((await card.evaluate(e=>getComputedStyle(e).transform)).includes('0.98'));await page.mouse.up();
    });
  } finally {
    const combined=previous?previous.map(old=>{const rerun=results.find(r=>r.name===old.name);return rerun?{...rerun,previousError:old.error}:old}):results;
    fs.writeFileSync(out+'/results.json',JSON.stringify(combined,null,2));
    if(previous)fs.writeFileSync(out+'/recheck-results.json',JSON.stringify(results,null,2));
    await browser.close();
  }
  server.close();console.log(`${results.filter(r=>r.ok).length}/${results.length} browser checks passed`);process.exitCode=results.some(r=>!r.ok)?1:0;
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
