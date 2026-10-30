const fs=require('fs'),http=require('http'),assert=require('assert'),path=require('path');
const playwrightPath=['website/node_modules/playwright','build/playwright-mcp-phase7/node_modules/playwright'].map(p=>path.resolve(p)).find(p=>fs.existsSync(p));
if(!playwrightPath)throw new Error('Existing Playwright installation required; no dependencies installed.');
const {chromium}=require(playwrightPath);
const sharp=require(process.cwd()+'/website/node_modules/sharp');
const dir='/tmp/campusedux-ui-audit',results=[];
const server=http.createServer((req,res)=>{if(req.url.endsWith('.js')||req.url.endsWith('.css')){res.setHeader('Content-Type',req.url.endsWith('.js')?'application/javascript':'text/css');res.end(fs.readFileSync(dir+req.url));}else {res.setHeader("Content-Type","text/html");res.end(`<!doctype html><link rel="stylesheet" href="/style.css"><div id="root"></div><script src="/${req.url.includes('before')?'before':'after'}.js"></script>`)}});
(async()=>{await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(4178,'127.0.0.1',resolve)});const browser=await chromium.launch({headless:true,chromiumSandbox:true,...(process.env.UI_AUDIT_BROWSER?{executablePath:process.env.UI_AUDIT_BROWSER}:{})});const page=await browser.newPage();await page.route('**/*',route=>{const request=route.request();if(new URL(request.url()).origin!=='http://127.0.0.1:4178'||!['GET','HEAD'].includes(request.method()))return route.abort();return route.fallback();});let errors=[];page.on('pageerror',e=>{errors.push(e.message);console.log('PAGEERROR',e.message)});page.setDefaultTimeout(15000);
async function open(kind,mode='reject',variant='after'){errors=[];await page.goto(`http://127.0.0.1:4178/${variant}?t=${Date.now()}#${kind}`);await page.evaluate(m=>{window.mode=m;window.calls=0},mode);}
async function check(name,fn){try{await fn();results.push({name,ok:true});console.log('PASS',name)}catch(e){results.push({name,ok:false,error:e.message});console.log('FAIL',name,e.message)}}
if(!['lesson','shared','discovery','course'].includes(process.env.UI_AUDIT_SCOPE)) {
await check('Dialog initial focus, Tab containment, Escape restoration',async()=>{await open('dialog');await page.click('#opener');assert(await page.evaluate(()=>document.querySelector('[role=dialog]').contains(document.activeElement)));for(let i=0;i<12;i++){await page.keyboard.press('Tab');assert(await page.evaluate(()=>document.querySelector('[role=dialog]').contains(document.activeElement)))}await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>document.activeElement.id),'opener');assert.equal(await page.evaluate(()=>document.body.style.overflow),'')});
await check('Nested dialog only top closes; body remains locked',async()=>{await open('dialog');await page.click('#opener');await page.getByRole('button',{name:'Nested',exact:true}).click();await page.keyboard.press('Escape');await page.waitForTimeout(250);assert.equal(await page.locator('[role=dialog]:visible').count(),1);assert.equal(await page.evaluate(()=>document.body.style.overflow),'hidden');await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>document.body.style.overflow),'')});
await check('Long modal remains reachable at 320px',async()=>{await page.setViewportSize({width:320,height:568});await open('dialog');await page.click('#opener');await page.getByRole('button',{name:'Long content'}).click();const box=await page.locator('[role=dialog]').first().boundingBox();assert(box.y>=0&&box.y+box.height<=569);await page.getByRole('button',{name:'Last',exact:true}).click();assert(await page.locator('[role=dialog]').first().evaluate(e=>e.scrollTop>0))});
await check('Contact rejected action recovers and retains text',async()=>{await open('contact');await page.getByLabel('Your name').fill('Test Student');await page.locator('#contact-email').fill('student@example.com');await page.locator('#contact-message').fill('Test message for rejected request');await page.getByRole('button',{name:'Send message',exact:true}).click();await page.getByText('Request failed',{exact:true}).waitFor();assert(await page.getByRole('button',{name:'Send message',exact:true}).isEnabled());assert.equal(await page.locator('#contact-message').inputValue(),'Test message for rejected request');assert.deepEqual(errors,[])});
await check('Withdrawal accepts valid decimal 0.29',async()=>{await open('withdraw','success');await page.getByLabel('Withdrawal amount').fill('0.29');await page.getByLabel('UPI ID',{exact:true}).fill('student@bank');await page.getByRole('button',{name:'Request withdrawal'}).click();assert.equal(await page.evaluate(()=>window.calls),1)});
await check('Withdrawal rejected RPC recovers',async()=>{await open('withdraw');await page.getByLabel('Withdrawal amount').fill('10');await page.getByLabel('UPI ID',{exact:true}).fill('student@bank');await page.getByRole('button',{name:'Request withdrawal'}).click();await page.getByText('Request failed',{exact:true}).waitFor();assert(await page.getByRole('button',{name:'Request withdrawal'}).isEnabled());assert.deepEqual(errors,[])});
await check('Notification failed write rolls back unread state',async()=>{await open('notification','resultError');await page.getByRole('button').click();assert(await page.getByRole('button').evaluate(e=>e.className.includes('bg-primary-50/60')))});
await check('Saved removal stays disabled during request and recovers',async()=>{await open('remove');await page.getByRole('button').click();assert(await page.getByRole('button').isDisabled());await page.getByText('Request failed',{exact:true}).waitFor();assert(await page.getByRole('button').isEnabled());assert.deepEqual(errors,[])});
await check('Search updates incoming query',async()=>{await open('search');await page.getByRole('button',{name:'Update query'}).click();await page.waitForFunction(()=>document.querySelector('[role=combobox]').value==='updated')});
await check('Search old results cannot be selected for new query',async()=>{await page.route('**/api/search?**',async route=>{const q=new URL(route.request().url()).searchParams.get('q');if(q==='next')await new Promise(r=>setTimeout(r,500));await route.fulfill({json:{q,groups:[{type:'projects',label:'Projects',total:1,items:[{id:q,title:q,href:'/projects/'+q}]}],total:1}})});await open('search');const input=page.getByRole('combobox');await input.fill('first');await page.getByRole('option',{name:'first',exact:true}).waitFor();await input.fill('next');assert.equal(await page.getByRole('option',{name:'first',exact:true}).count(),0)});
await check('Session older response cannot resurrect previous user',async()=>{let count=0;await page.route('**/api/session',async route=>{count++;const n=count;if(n===1)await new Promise(r=>setTimeout(r,500));await route.fulfill({json:{profile:n===1?{id:'A'}:null}})});await open('session');await page.waitForTimeout(100);await page.evaluate(()=>window.emitSessionChange());await page.waitForTimeout(650);assert.equal(await page.locator('#profile').textContent(),'anon');await page.unroute('**/api/session')});
await check('Bookmarks isolate account switch and clear on logout',async()=>{let user='A';await page.route('**/api/session',route=>route.fulfill({json:{profile:user?{id:user}:null}}));await open('bookmarks','success');await page.waitForFunction(()=>document.querySelector('#bookmarks').textContent==='A');user='B';await page.evaluate(()=>{window.userId='B';window.emitSessionChange()});await page.waitForFunction(()=>document.querySelector('#bookmarks').textContent==='B');user=null;await page.evaluate(()=>window.emitSessionChange());await page.waitForFunction(()=>document.querySelector('#bookmarks').textContent==='');await page.unroute('**/api/session')});
await check('Mock-test rejected load recovers',async()=>{await open('quiz');await page.getByRole('button',{name:'Start Mock Test'}).click();await page.getByRole('alert').waitFor();assert.deepEqual(errors,[])});
await check('Mock-test countdown uses elapsed time',async()=>{await open('quiz','questions');await page.getByRole('button',{name:'Start Mock Test'}).click();await page.getByText('01:00',{exact:true}).waitFor();await page.evaluate(()=>{const original=Date.now;Date.now=()=>original()+30000});await page.waitForTimeout(1200);assert(await page.getByText('00:29',{exact:true}).count()||await page.getByText('00:30',{exact:true}).count())});
await check('Share revoke error is shown and action recovers',async()=>{await open('share','resultError');await page.getByRole('button',{name:'Share',exact:true}).click();await page.getByRole('button',{name:'Disable link'}).click();await page.getByText('Request failed',{exact:true}).waitFor();assert(await page.getByRole('button',{name:'Disable link'}).isEnabled());assert.deepEqual(errors,[])});
await check('Draft flush saves synchronous update, not previous render',async()=>{await open('draft','success');await page.waitForFunction(()=>document.querySelector('#draft')?.textContent==='ready');await page.getByRole('button',{name:'Save latest'}).click();await page.waitForFunction(()=>document.querySelector('#save-status').textContent==='saved');assert.equal(await page.evaluate(()=>window.writes[0].title),'Latest draft')});
await check('Draft write errors reject flush',async()=>{await open('draft','resultError');await page.waitForFunction(()=>document.querySelector('#draft')?.textContent==='ready');await page.getByRole('button',{name:'Save latest'}).click();await page.waitForFunction(()=>document.querySelector('#save-status').textContent==='failed');assert.deepEqual(errors,[])});
await check('Clearing draft cancels pending autosave',async()=>{await open('draft','success');await page.waitForFunction(()=>document.querySelector('#draft')?.textContent==='ready');await page.getByRole('button',{name:'Edit draft'}).click();await page.getByRole('button',{name:'Clear draft'}).click();await page.waitForTimeout(900);assert.equal(await page.evaluate(()=>(window.writes||[]).length),0);assert.equal(await page.evaluate(()=>window.deleted),true)});
await check('Resume autosave serializes writes and ignores stale completion',async()=>{await open('autosave','success');assert.equal(await page.evaluate(()=>(window.savedValues||[]).length),0);await page.getByRole('button',{name:'First edit'}).click();await page.waitForFunction(()=>window.savedValues?.length===1);await page.getByRole('button',{name:'Second edit'}).click();await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>window.savedValues.length),1);await page.evaluate(()=>window.finishSave());await page.waitForFunction(()=>window.savedValues.length===2);assert.equal(await page.locator('#autosave-status').textContent(),'saving');assert.deepEqual(await page.evaluate(()=>window.savedValues),['one','two']);await page.evaluate(()=>window.finishSave());await page.waitForFunction(()=>document.querySelector('#autosave-status').textContent==='saved')});
await check('Normal-state screenshots match within raster tolerance before/after at 320/768/1920',async()=>{for(const width of [320,768,1920]){await page.setViewportSize({width,height:900});for(const kind of ['contact','dialog']){const shots=[];for(const variant of ['before','after']){await open(kind,'success',variant);if(kind==='dialog')await page.click('#opener');if(kind==='dialog')await page.getByLabel('Dialog input').click();else await page.evaluate(()=>document.activeElement.blur());await page.waitForTimeout(300);shots.push(await page.screenshot({animations:'disabled',path:dir+'/'+kind+'-'+width+'-'+variant+'.png'}))}const a=await sharp(shots[0]).raw().toBuffer(),b=await sharp(shots[1]).raw().toBuffer();let count=0,max=0;for(let i=0;i<a.length;i++){const d=Math.abs(a[i]-b[i]);if(d)count++;max=Math.max(max,d)}assert(max<=5&&count<500,`Screenshot differs ${kind} ${width}: ${count} channels, max ${max}`)}}});
}

if(!['shared','discovery','course'].includes(process.env.UI_AUDIT_SCOPE)) {
// Lesson cases use the actual route and existing client islands; all data access is mocked.
await page.route('**/api/session', route => route.fulfill({json:{profile:null}}));
await page.emulateMedia({reducedMotion:'reduce'});
for (const width of [320,360,390,430,768,1024,1280,1440]) {
  for (const dark of [false,true]) {
    await check(`Lesson layout ${width}px ${dark?'dark':'light'}`, async()=>{
      await page.setViewportSize({width,height:900});
      await open('lesson','success');
      await page.evaluate(dark=>document.documentElement.classList.toggle('dark',dark),dark);
      await page.getByRole('link',{name:'Sign in to bookmark'}).waitFor();
      const complete=page.getByRole('button',{name:'Mark as complete',exact:true}).first();
      await complete.waitFor();
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Page overflows horizontally');
      for(const target of [complete,page.getByRole('link',{name:'Sign in to bookmark'})]) {
        const box=await target.boundingBox();
        assert(box.width>=44&&box.height>=44,'Action has a small touch target');
        assert(await target.evaluate(e=>e.scrollWidth<=e.clientWidth&&e.scrollHeight<=e.clientHeight),'Action label is clipped');
      }
      const contentTop=await page.locator('#iteration-examples').evaluate(e=>e.getBoundingClientRect().top);
      if(width<640) assert(contentTop<500,`Reading starts at ${contentTop}px`);
      assert(await page.locator('.lesson-content pre').evaluate(e=>e.scrollWidth>e.clientWidth),'Code must scroll inside its own container');
      assert(await page.locator('.lesson-content table').evaluate(e=>e.parentElement.scrollWidth>e.parentElement.clientWidth),'Wide table must scroll inside its own container');
      if(width<640) {
        const layout=await page.locator('.lesson-content pre').evaluate(pre=>{
          const rect=pre.getBoundingClientRect(),wrapper=pre.parentElement;
          const tools=[...wrapper.querySelectorAll('button[title]')].map(button=>button.getBoundingClientRect());
          return {bounded:rect.left>=0&&rect.right<=innerWidth,tools:tools.map(r=>({left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height})),preTop:rect.top};
        });
        assert(layout.bounded,'Code container extends beyond the viewport');
        layout.tools.forEach((tool,i)=>{
          assert(tool.width>=44&&tool.height>=44,'Code toolbar has a small touch target');
          assert(tool.bottom<=layout.preTop,'Toolbar overlaps the code container');
          if(i) {
            const previous=layout.tools[i-1];
            assert(tool.left>=previous.right||tool.top>=previous.bottom,'Code toolbar controls overlap');
          }
        });
      }
      await page.screenshot({path:`${dir}/lesson-${width}-${dark?'dark':'light'}.png`,fullPage:true,animations:'disabled'});
      assert.deepEqual(errors,[]);
    });
  }
}
await check('Lesson reading starts higher than the original layout on phones',async()=>{
  for(const width of [320,360,390,430]) {
    await page.setViewportSize({width,height:900});
    const positions=[];
    for(const variant of ['before','after']) {
      await open('lesson','success',variant);
      await page.getByRole('link',{name:'Sign in to bookmark'}).waitFor();
      await page.getByRole('button',{name:'Mark as complete',exact:true}).first().waitFor();
      positions.push(await page.locator('#iteration-examples').evaluate(e=>e.getBoundingClientRect().top));
    }
    assert(positions[0]-positions[1]>=64,`Only ${positions[0]-positions[1]}px recovered at ${width}px`);
  }
});
await check('Long lesson titles remain readable at 320px',async()=>{
  await page.setViewportSize({width:320,height:900});
  await open('lesson-long','success');
  await page.locator('#lesson-article h1').waitFor();
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert(await page.locator('#lesson-article h1').evaluate(e=>e.scrollHeight<=e.clientHeight));
});
await check('Lesson code Copy, Run, and Open retain their existing behavior',async()=>{
  await page.setViewportSize({width:390,height:900});
  await open('lesson','success');
  const code=page.locator('.lesson-content pre code').first();
  await code.waitFor();
  const original=await code.textContent();
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.fixtureCopiedCode=text}}}));
  await page.getByRole('button',{name:'Copy code',exact:true}).click();
  assert.equal(await page.evaluate(()=>window.fixtureCopiedCode),original);
  await page.getByRole('button',{name:'Run this code in the CampusEduX compiler',exact:true}).click();
  const run=new URL(await page.evaluate(()=>window.destination),'http://127.0.0.1:4178');
  assert.equal(run.pathname,'/compiler');
  assert.equal(run.searchParams.get('code'),original);
  assert.equal(run.searchParams.get('autorun'),'1');
  await page.getByRole('button',{name:'Open this code in the CampusEduX compiler',exact:true}).click();
  const compiler=new URL(await page.evaluate(()=>window.destination),'http://127.0.0.1:4178');
  assert.equal(compiler.pathname,'/compiler');
  assert.equal(compiler.searchParams.get('code'),original);
  assert.equal(compiler.searchParams.has('autorun'),false);
});
await check('Lesson contents supports keyboard focus, Escape, and syllabus links',async()=>{
  await open('lesson','success');
  const trigger=page.getByRole('button',{name:'Course contents',exact:true});
  await trigger.click();
  const dialog=page.getByRole('dialog',{name:'Course contents',exact:true});
  await dialog.waitFor();
  assert.equal(await trigger.getAttribute('aria-expanded'),'true');
  for(let i=0;i<12;i++) {
    await page.keyboard.press('Tab');
    assert(await dialog.evaluate(e=>e.contains(document.activeElement)));
  }
  assert.equal(await dialog.getByRole('link',{name:'Classes and objects'}).getAttribute('href'),'/learning/java/classes');
  await page.keyboard.press('Escape');
  assert.equal(await trigger.getAttribute('aria-expanded'),'false');
  assert(await trigger.evaluate(e=>e===document.activeElement));
});
await check('Lesson completion and undo survive reload through the existing store',async()=>{
  await open('lesson','success');
  await page.getByRole('button',{name:'Mark as complete',exact:true}).first().click();
  await page.getByRole('button',{name:'Completed',exact:true}).waitFor();
  await page.reload();
  const completed=page.getByRole('button',{name:'Completed',exact:true});
  await completed.waitFor();
  assert.equal(await completed.getAttribute('aria-pressed'),'true');
  await completed.click();
  await page.reload();
  const incomplete=page.getByRole('button',{name:'Mark as complete',exact:true}).first();
  await incomplete.waitFor();
  assert.equal(await incomplete.getAttribute('aria-pressed'),'false');
});
await check('Lesson bookmark write failure recovers and success retains the existing action',async()=>{
  await page.unroute('**/api/session');
  await page.route('**/api/session',route=>route.fulfill({json:{profile:{id:'A',email:'student@example.com',fullName:'Test Student',isPremium:false,avatarUrl:null}}}));
  await open('lesson','resultError');
  await page.getByRole('button',{name:'Bookmark',exact:true}).click();
  await page.getByText("Couldn't update the bookmark. Try again.",{exact:true}).waitFor();
  assert(await page.getByRole('button',{name:'Bookmark',exact:true}).isEnabled());
  await page.evaluate(()=>{window.mode='success'});
  await page.getByRole('button',{name:'Bookmark',exact:true}).click();
  await page.getByRole('button',{name:'Bookmarked',exact:true}).waitFor();
  await page.getByRole('button',{name:'Bookmarked',exact:true}).click();
  await page.getByRole('button',{name:'Bookmark',exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>window.deleted),true);
  await page.unroute('**/api/session');
  await page.route('**/api/session',route=>route.fulfill({json:{profile:null}}));
});
await check('Locked lesson keeps its existing premium gate and withholds content',async()=>{
  await open('lesson-locked','success');
  await page.getByText('This is a premium lesson',{exact:true}).waitFor();
  assert.equal(await page.locator('#iteration-examples').count(),0);
  assert.equal(await page.getByRole('button',{name:'Mark as complete',exact:true}).count(),0);
});
await check('Lesson accessibility in light and dark themes',async()=>{
  for(const dark of [false,true]) {
    await open('lesson','success');
    await page.getByRole('link',{name:'Sign in to bookmark'}).waitFor();
    await page.evaluate(dark=>document.documentElement.classList.toggle('dark',dark),dark);
    await page.addScriptTag({path:require.resolve('axe-core/axe.min.js',{paths:[process.cwd()+'/website']})});
    const audit=await page.evaluate(()=>axe.run(document.querySelector('main'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}}));
    assert.deepEqual(audit.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})),[]);
  }
});
}

if(!['lesson','discovery','course'].includes(process.env.UI_AUDIT_SCOPE)) {
await page.route('**/api/session',route=>route.fulfill({json:{profile:null}}));
await page.emulateMedia({reducedMotion:'reduce'});
for(const width of [320,360,390,430,1024,1440]) {
  for(const dark of [false,true]) {
    await check(`Shared UI ${width}px ${dark?'dark':'light'}`,async()=>{
      await page.setViewportSize({width,height:900});
      await open('shared','success');
      await page.evaluate(dark=>document.documentElement.classList.toggle('dark',dark),dark);
      await page.locator('header').getByRole('link',{name:'Log in',exact:true}).waitFor();
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Shared UI overflows the viewport');
      const header=await page.locator('header').boundingBox();
      const reading=await page.locator('.pointer-events-none.fixed[aria-hidden="true"]:has(> .origin-left)').boundingBox();
      assert(Math.abs(header.y+header.height-reading.y)<=1,'Reading progress overlaps or detaches from the header');
      for(const input of await page.locator('main input[type=search]').all()) {
        const box=await input.boundingBox();
        const form=await input.evaluate(e=>e.closest('form').getBoundingClientRect().width);
        assert(box.width>=form*0.6,'Search input is cramped');
        assert(box.x>=0&&box.x+box.width<=width,'Search input is clipped');
      }
      for(const button of await page.locator('main button[type=submit]').all()) {
        const box=await button.boundingBox();
        assert(box.width>=44&&box.height>=44,'Search submit target is too small');
      }
      const bottom=page.getByRole('navigation',{name:'Primary',exact:true});
      if(width<768) {
        assert.equal(await bottom.getByRole('link').count(),5);
        for(const link of await bottom.getByRole('link').all()) {
          const box=await link.boundingBox();
          assert(box.width>=44&&box.height>=44,'Bottom tab has a small touch target');
        }
        await page.locator('#shared-last-control').scrollIntoViewIfNeeded();
        await page.evaluate(()=>scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'}));
        const last=await page.locator('#shared-last-control').boundingBox(),nav=await bottom.boundingBox();
        assert(last.y+last.height<=nav.y,`Bottom navigation obscures the last control: ${JSON.stringify({last,nav})}`);
      } else assert.equal(await bottom.isVisible(),false);
      if(width>=1280) {
        const field=page.locator('header').getByRole('combobox');
        const before=await field.boundingBox();
        await field.focus();
        const after=await field.boundingBox();
        assert.equal(after.width,before.width,'Desktop search shifts navigation when focused');
      }
      await page.screenshot({path:`${dir}/shared-${width}-${dark?'dark':'light'}.png`,fullPage:true,animations:'disabled'});
      assert.deepEqual(errors,[]);
    });
  }
}
await check('Shared search retains GET fields and query submission',async()=>{
  await page.setViewportSize({width:390,height:900});
  await open('shared','success');
  const basic=page.locator('main form').first();
  await basic.getByRole('searchbox').fill('java tutorial');
  assert.deepEqual(await basic.evaluate(form=>[...new FormData(form).entries()]),[['q','java tutorial'],['type','learning']]);
  const global=page.locator('main form').nth(1);
  await global.getByRole('combobox').fill('  java   tutorial ');
  await global.getByRole('button',{name:'Search',exact:true}).click();
  assert.equal(await page.evaluate(()=>window.destination),'/search?q=java%20tutorial');
});
await check('Global search suggestions preserve keyboard navigation',async()=>{
  await page.route('**/api/search?**',route=>route.fulfill({json:{q:'java',groups:[{type:'projects',label:'Projects',total:1,items:[{id:'fixture',title:'Java fixture result',href:'/projects/java-fixture'}]}],total:1}}));
  await open('shared','success');
  const input=page.locator('main').getByRole('combobox');
  await input.fill('java');
  await page.getByRole('option',{name:'Java fixture result',exact:true}).waitFor();
  await input.press('ArrowDown');
  await input.press('Enter');
  assert.equal(await page.evaluate(()=>window.destination),'/projects/java-fixture');
  await page.unroute('**/api/search?**');
});
await check('Mobile search sheet keeps focus, touch targets, and dismissal',async()=>{
  await page.setViewportSize({width:320,height:900});
  await open('shared','success');
  const trigger=page.locator('header').getByRole('button',{name:'Search CampusEduX',exact:true});
  await trigger.click();
  const dialog=page.getByRole('dialog',{name:'Search CampusEduX',exact:true});
  await dialog.waitFor();
  const close=dialog.getByRole('button',{name:'Close search',exact:true});
  const box=await close.boundingBox();
  assert(box.width>=44&&box.height>=44);
  assert(await dialog.evaluate(e=>e.contains(document.activeElement)));
  for(let i=0;i<8;i++) {
    await page.keyboard.press('Tab');
    assert(await dialog.evaluate(e=>e.contains(document.activeElement)));
  }
  await page.keyboard.press('Escape');
  assert.equal(await dialog.count(),0);
  assert(await trigger.evaluate(e=>document.activeElement===e));
  await trigger.click();
  await page.getByRole('button',{name:'Close search',exact:true}).click();
  assert.equal(await page.getByRole('dialog',{name:'Search CampusEduX',exact:true}).count(),0);
});
await check('Menu exposes state, traps focus, closes on its active route and restores the opener',async()=>{
  await page.setViewportSize({width:390,height:844});
  await open('shared','success');
  const trigger=page.getByRole('button',{name:'Open menu',exact:true});
  assert.equal(await trigger.getAttribute('aria-haspopup'),'dialog');
  assert.equal(await trigger.getAttribute('aria-expanded'),'false');
  await trigger.click();
  const dialog=page.getByRole('dialog',{name:'Menu',exact:true});
  await dialog.waitFor();
  assert.equal(await trigger.getAttribute('aria-expanded'),'true');
  for(let i=0;i<25;i++) {
    await page.keyboard.press('Tab');
    assert(await dialog.evaluate(e=>e.contains(document.activeElement)));
  }
  const home=dialog.getByRole('navigation',{name:'Main menu'}).getByRole('link',{name:'Home',exact:true});
  assert.equal(await home.getAttribute('aria-current'),'page');
  await home.evaluate(e=>e.addEventListener('click',event=>event.preventDefault()));
  await home.click();
  await dialog.waitFor({state:'hidden'});
  assert.equal(await trigger.getAttribute('aria-expanded'),'false');
  assert(await trigger.evaluate(e=>document.activeElement===e));
});
await check('Mobile search skips option Tab stops, supports pointer selection and restores focus',async()=>{
  await page.route('**/api/search?**',route=>route.fulfill({json:{q:'java',groups:[{type:'projects',label:'Projects',total:1,items:[{id:'fixture',title:'Java fixture result',href:'/projects/java-fixture'}]}],total:1}}));
  await page.setViewportSize({width:390,height:844});
  await open('shared','success');
  const trigger=page.locator('header').getByRole('button',{name:'Search CampusEduX',exact:true});
  await trigger.click();
  const dialog=page.getByRole('dialog',{name:'Search CampusEduX',exact:true});
  const input=dialog.getByRole('combobox');
  await input.fill('java');
  const option=dialog.getByRole('option',{name:'Java fixture result',exact:true});
  await option.waitFor();
  for(const result of await dialog.getByRole('option').all()) assert.equal(await result.getAttribute('tabindex'),'-1');
  await input.press('Tab');
  assert(await dialog.getByRole('button',{name:'Close search',exact:true}).evaluate(e=>document.activeElement===e));
  await page.keyboard.press('Shift+Tab');
  assert(await input.evaluate(e=>document.activeElement===e));
  await option.click();
  assert.equal(await page.evaluate(()=>window.destination),'/projects/java-fixture');
  await dialog.waitFor({state:'hidden'});
  assert(await trigger.evaluate(e=>document.activeElement===e));
  await page.unroute('**/api/search?**');
});
await check('Project filter drawer keeps unique IDs, local labels and named price values',async()=>{
  await page.setViewportSize({width:390,height:844});
  await open('project-filters','success');
  await page.getByRole('button',{name:'Filters',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Filters',exact:true});
  await dialog.waitFor();
  const ids=await page.locator('[id]').evaluateAll(elements=>elements.map(e=>e.id));
  assert.equal(new Set(ids).size,ids.length);
  assert(await dialog.locator('label[for]').evaluateAll(labels=>labels.every(label=>label.closest('[role="dialog"]').contains(document.getElementById(label.htmlFor)))));
  const min=dialog.getByRole('spinbutton',{name:'Minimum price in rupees',exact:true});
  const max=dialog.getByRole('spinbutton',{name:'Maximum price in rupees',exact:true});
  assert.equal(await min.inputValue(),'100');
  assert.equal(await max.inputValue(),'2000');
  await min.fill('250');
  await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Filters',exact:true}).click();
  assert.equal(await min.inputValue(),'250');
  assert.equal(await dialog.locator('form').getAttribute('action'),'/projects');
  assert.equal(await dialog.locator('form').getAttribute('method'),'get');
  await page.keyboard.press('Escape');
});
await check('Reading progress continues to follow article scrolling',async()=>{
  await open('shared','success');
  await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight/2));
  await page.waitForFunction(()=>{
    const bar=document.querySelector('.pointer-events-none.fixed[aria-hidden="true"]:has(> .origin-left) > div');
    return bar&&Number(bar.style.transform.match(/scaleX\(([^)]+)\)/)?.[1])>0;
  });
  const fraction=await page.locator('.pointer-events-none.fixed[aria-hidden="true"]:has(> .origin-left) > div').evaluate(e=>Number(e.style.transform.match(/scaleX\(([^)]+)\)/)[1]));
  assert(fraction>0&&fraction<=1);
});
}
if(!['lesson','shared','course'].includes(process.env.UI_AUDIT_SCOPE)) {
await page.route('**/api/session',route=>route.fulfill({json:{profile:{id:'A',email:'student@example.com',fullName:'Test Student',isPremium:false,avatarUrl:null}}}));
await page.setViewportSize({width:390,height:900});
await open('lesson','success');
await page.getByRole('group',{name:'Lesson actions'}).waitFor();
const mark=page.getByRole('button',{name:'Mark as complete',exact:true}).first();
if(await mark.isVisible()) await mark.click();
await page.getByRole('button',{name:'Completed',exact:true}).waitFor();
await page.emulateMedia({reducedMotion:'reduce'});
for(const width of [320,360,390,430,768,1024,1280,1440]) {
  for(const dark of [false,true]) {
    for(const kind of ['discovery-home','discovery-learning']) {
      await check(`${kind} ${width}px ${dark?'dark':'light'}`,async()=>{
        await page.setViewportSize({width,height:900});
        await open(kind,'success');
        await page.locator('main h1').waitFor();
        await page.evaluate(dark=>document.documentElement.classList.toggle('dark',dark),dark);
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Page-level horizontal overflow');
        const input=page.locator('main input[type=search]');
        const box=await input.boundingBox();
        assert(box.width>=140&&box.x>=0&&box.x+box.width<=width,'Search input is cramped or clipped');
        const submit=await page.locator('main button[type=submit]').boundingBox();
        assert(submit.width>=44&&submit.height>=44,'Search submit target is too small');
        if(kind==='discovery-home') {
          for(const name of ['Start learning','Find jobs & internships']) {
            const target=await page.getByRole('link',{name,exact:true}).boundingBox();
            assert(target.width>=44&&target.height>=44,'Hero CTA has a small touch target');
          }
        } else {
          const resume=page.locator('[aria-labelledby=continue-title]');
          await resume.waitFor();
          assert.equal(await resume.getByRole('link').first().getAttribute('href'),'/learning/java/loops');
          assert(await resume.getByText('1 of 3 lessons · 33%',{exact:true}).count());
          for(const title of await page.locator('main h3').all()) assert(await title.evaluate(e=>e.scrollWidth<=e.clientWidth),'Course title overflows');
          for(const filter of await page.getByRole('navigation',{name:'Filter by access'}).getByRole('link').all()) {
            const target=await filter.boundingBox();
            assert(target.width>=44&&target.height>=44,'Access filter has a small touch target');
          }
        }
        await page.screenshot({path:`${dir}/${kind}-${width}-${dark?'dark':'light'}.png`,fullPage:true,animations:'disabled'});
        assert.deepEqual(errors,[]);
      });
    }
  }
}
await check('Home hero is more compact than the original on phones',async()=>{
  for(const width of [320,360,390,430]) {
    await page.setViewportSize({width,height:900});
    const heights=[];
    for(const variant of ['before','after']) {
      await open('discovery-home','success',variant);
      const hero=page.locator('[aria-labelledby=home-hero-title]');
      await hero.waitFor();
      heights.push((await hero.boundingBox()).height);
    }
    assert(heights[0]-heights[1]>=64,`Hero only reduced by ${heights[0]-heights[1]}px at ${width}px`);
  }
});
await check('Learning catalogue remains honestly empty when its data is empty',async()=>{
  await open('discovery-learning-empty','success');
  await page.getByText('No courses yet',{exact:true}).waitFor();
  assert.equal(await page.locator('[aria-labelledby=all-courses-title]').count(),0);
  assert.equal(await page.locator('[aria-labelledby=continue-title]').count(),0);
});
}
if(!['lesson','shared','discovery'].includes(process.env.UI_AUDIT_SCOPE)) {
await page.route('**/api/session',route=>route.fulfill({json:{profile:{id:'A',email:'student@example.com',fullName:'Test Student',isPremium:false,avatarUrl:null}}}));
await page.setViewportSize({width:390,height:900});
await open('lesson','success');
const completion=page.locator('[aria-label="Lesson actions"] button[aria-pressed]').first();
await completion.waitFor();
if(await completion.getAttribute('aria-pressed')==='false') await completion.click();
await page.getByRole('button',{name:'Completed',exact:true}).waitFor();
await page.emulateMedia({reducedMotion:'reduce'});
for(const width of [320,360,390,430,768,1024,1280,1440]) {
  for(const dark of [false,true]) {
    await check(`Course detail ${width}px ${dark?'dark':'light'}`,async()=>{
      await page.setViewportSize({width,height:900});
      await open('course','success');
      await page.locator('main h1').waitFor();
      await page.evaluate(dark=>document.documentElement.classList.toggle('dark',dark),dark);
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Course page overflows horizontally');
      const hero=page.locator('main header');
      assert(await hero.getByText('Original course description preserved in full. Original course description preserved in full.',{exact:true}).count());
      const outcomes=hero.locator('details');
      assert.equal(await outcomes.getAttribute('open'),null);
      await outcomes.locator('summary').click();
      assert.notEqual(await outcomes.getAttribute('open'),null);
      await outcomes.locator('summary').click();
      const curriculum=page.locator('[aria-labelledby=curriculum-title]');
      await curriculum.getByRole('button',{name:'Expand all',exact:true}).click();
      const titles=curriculum.locator('a[href^="/learning/"]');
      assert.equal(await titles.count(),9);
      for(const link of await titles.all()) {
        const box=await link.boundingBox();
        assert(box.height>=44,'Lesson target is too small');
        assert(await link.evaluate(e=>e.scrollWidth<=e.clientWidth),'Lesson row overflows');
      }
      if(width<1024) {
        const cta=page.locator('.fixed.z-30');
        await cta.getByRole('link',{name:'Continue',exact:true}).waitFor();
        const action=await cta.getByRole('link').boundingBox();
        assert(action.width>=44&&action.height>=44,'Course CTA target is too small');
        if(width<768) {
          const tabs=await page.getByRole('navigation',{name:'Primary',exact:true}).boundingBox();
          const bar=await cta.boundingBox();
          assert(Math.abs(bar.y+bar.height-tabs.y)<=1,'Course CTA overlaps the bottom tabs');
        }
        await curriculum.getByRole('link').last().scrollIntoViewIfNeeded();
        await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));
        const last=await curriculum.getByRole('link').last().boundingBox(),bar=await cta.boundingBox();
        assert(last.y+last.height<=bar.y,'Fixed CTA hides the last curriculum link');
      }
      await page.screenshot({path:`${dir}/course-${width}-${dark?'dark':'light'}.png`,fullPage:true,animations:'disabled'});
      assert.deepEqual(errors,[]);
    });
  }
}
await check('Course curriculum keeps its filter, clear, and section toggles',async()=>{
  await page.setViewportSize({width:390,height:900});
  await open('course','success');
  const curriculum=page.locator('[aria-labelledby=curriculum-title]');
  const input=curriculum.getByRole('searchbox',{name:'Search lessons in this course',exact:true});
  await input.fill('Lesson 9');
  await curriculum.getByText('1 lesson match “Lesson 9”',{exact:true}).waitFor();
  assert.equal(await curriculum.locator('a[href^="/learning/"]').count(),1);
  assert.equal(await curriculum.locator('a[href^="/learning/"]').getAttribute('href'),'/learning/java/lesson-9');
  await input.fill('No matching lesson');
  await curriculum.getByText('0 lessons match “No matching lesson”',{exact:true}).waitFor();
  const clear=curriculum.getByRole('button',{name:'Clear search',exact:true});
  const box=await clear.boundingBox();
  assert(box.width>=44&&box.height>=44);
  await clear.click();
  assert.equal(await input.inputValue(),'');
  await curriculum.getByRole('button',{name:'Expand all',exact:true}).click();
  assert.equal(await curriculum.locator('details[open]').count(),2);
  await curriculum.getByRole('button',{name:'Collapse all',exact:true}).click();
  assert.equal(await curriculum.locator('details[open]').count(),0);
});
}
fs.writeFileSync(dir+'/browser-results.json',JSON.stringify(results,null,2));await browser.close();server.close();process.exitCode=results.some(r=>!r.ok)?1:0;})().catch(e=>{console.error(e);server.close();process.exit(1)});
