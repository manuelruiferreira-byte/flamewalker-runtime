/* Real browser regression runner. CI runs Chromium and Firefox; phone/tablet/desktop. */
const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const pw=require(process.env.ACE_PLAYWRIGHT||'@playwright/test');
const root=path.resolve(__dirname,'../..'),route='/Jester-Intelligence/ACED-Lifestyle/ace-mind.html';
const baseline=JSON.parse(fs.readFileSync(__dirname+'/baseline.json'));
const server=http.createServer((req,res)=>{const p=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);if(!p.startsWith(root+path.sep)){res.writeHead(403);return res.end();}try{res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png'})[path.extname(p)]||'application/octet-stream');res.end(fs.readFileSync(p));}catch{res.writeHead(404);res.end();}});
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
(async()=>{await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const url='http://127.0.0.1:'+server.address().port+route;let count=0;
try{
for(const browserName of (process.env.ACE_BROWSERS||'chromium,firefox').split(',')){
 const opts={headless:true};if(browserName==='chromium'&&process.env.ACE_CHROMIUM_PATH){opts.executablePath=process.env.ACE_CHROMIUM_PATH;opts.args=['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'];}
 const browser=await pw[browserName].launch(opts);
 try{for(const [device,width,height,timezoneId] of [['phone',390,844,'Europe/Brussels'],['tablet',800,1100,'America/New_York'],['desktop',1440,1000,'Asia/Tokyo']]){
  const ctx=await browser.newContext({viewport:{width,height},timezoneId});const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.clock.install({time:new Date('2026-10-14T12:00:00Z')});
  await page.addInitScript(()=>{if(!localStorage.getItem('ace-test-seeded')){localStorage.setItem('ace-test-seeded','yes');localStorage.setItem('ace_mind_state_v214',JSON.stringify({activeDate:'2026-10-19',notes:{'2026-10-19':'preserve regression note'},supp:{'2026-10-19__NR':true},logs:[{type:'test',note:'preserve regression log'}],suppCardPlanHistory:{'2026-10-19':{selected:['nr'],scoreSnapshot:{nr:{score:.82}}}},savedAt:'2026-10-13T12:00:00Z'}));}});
  await page.goto(url);await page.waitForFunction(()=>typeof ACEResonance!=='undefined'&&typeof appInitialized!=='undefined'&&appInitialized);
  const fingerprint=()=>page.evaluate(()=>ACEResonance.canonicalize({supplements:ACEResonance.scoreSupplements('2026-10-19',FW_NATAL_PROFILE,ACEResonance.VERSION),domains:ACEResonance.scoreLifeDomains('2026-10-19',FW_NATAL_PROFILE,ACEResonance.VERSION)}));
  assert.equal(hash(await fingerprint()),baseline.sha256);
  await page.evaluate(()=>{setDay('2026-10-19');setChamber('clubs');});
  assert.equal(await page.locator('[data-supplement-id]').count(),42);
  const visibleScores=()=>page.locator('[data-supplement-id]').evaluateAll(nodes=>nodes.map(n=>[n.dataset.supplementId,n.dataset.score]));
  const before=await visibleScores();
  await page.locator('[data-taken="nr"]').setChecked(false);
  assert.deepEqual(await visibleScores(),before);assert.equal(hash(await fingerprint()),baseline.sha256);
  await page.evaluate(()=>{setBody('2026-10-19','liver','red');setBody('2026-10-19','sleep','orange');});
  assert.deepEqual(await visibleScores(),before);assert.equal(hash(await fingerprint()),baseline.sha256);
  await page.evaluate(()=>{setDay('2026-10-20');setDay('2026-10-19');});assert.deepEqual(await visibleScores(),before);
  for(const clock of ['2026-10-17T12:00:00Z','2026-10-19T06:59:00Z','2026-10-19T07:01:00Z']){await page.clock.setSystemTime(new Date(clock));assert.equal(hash(await fingerprint()),baseline.sha256);}
  await page.reload();await page.waitForFunction(()=>typeof appInitialized!=='undefined'&&appInitialized);assert.equal(hash(await fingerprint()),baseline.sha256);
  await page.evaluate(async()=>{for(const k of await caches.keys())await caches.delete(k);});await page.reload();await page.waitForFunction(()=>typeof appInitialized!=='undefined'&&appInitialized);assert.equal(hash(await fingerprint()),baseline.sha256);
  const saved=await page.evaluate(()=>({note:state.notes['2026-10-19'],log:state.logs.some(x=>x.note==='preserve regression log'),legacy:state.suppCardPlanHistory['2026-10-19'],backup:!!localStorage.getItem('ace_mind_pre_resonance_v1'),motion:FW_NATAL_PROFILE.planets.neptune.motion}));
  assert.equal(saved.note,'preserve regression note');assert.ok(saved.log&&saved.backup);assert.equal(saved.legacy.scoreSnapshot.nr.score,.82);assert.equal(saved.motion,'stationary_direct');
  await page.evaluate(()=>{setDay('2026-10-19');setChamber('hearts');});assert.equal(await page.locator('.ace-domain-dot').count(),9);
  await page.locator('.ace-domain-dot[data-domain="love"]').click();assert.ok((await page.locator('#ace-domain-explanation').innerText()).includes('Neutral baseline 50'));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,'horizontal overflow');
  await page.evaluate(()=>setChamber('clubs'));assert.equal(await page.locator('[data-taken]:disabled').count(),0);
  const manifestHref=await page.locator('link[rel="manifest"]').getAttribute('href');assert.ok(manifestHref.includes('manifest-ace-mind.webmanifest'));
  const manifest=await (await page.request.get(new URL(manifestHref,url).href)).json();assert.ok(manifest.start_url.includes('ace-resonance-1.0.0'));
  for(const icon of manifest.icons){assert.ok((await page.request.get(new URL(icon.src,url).href)).ok());}
  // Real export -> empty site storage -> import, modeling a data-destructive reinstall.
  const [download]=await Promise.all([page.waitForEvent('download',{timeout:10000}),page.getByRole('navigation',{name:'Utilities'}).getByRole('button',{name:'Export',exact:true}).click({timeout:10000})]);
  const backup=fs.readFileSync(await download.path());
  const exported=JSON.parse(backup);assert.equal(exported.canonicalProfile.version,'3.4_ORACLE/1');
  assert.equal(exported.notes['2026-10-19'],'preserve regression note');assert.ok(exported.preResonanceBackup);
  await page.evaluate(async()=>{localStorage.clear();localStorage.setItem('ace-test-seeded','yes');for(const r of await navigator.serviceWorker.getRegistrations())await r.unregister();for(const k of await caches.keys())await caches.delete(k);});
  await page.reload();await page.waitForFunction(()=>typeof appInitialized!=='undefined'&&appInitialized);
  await page.locator('#importFile').setInputFiles({name:'ace-backup.json',mimeType:'application/json',buffer:backup});
  await page.waitForFunction(()=>state.notes['2026-10-19']==='preserve regression note');
  assert.equal(hash(await fingerprint()),baseline.sha256);
  assert.equal(await page.evaluate(()=>activeDate),'2026-10-19');
  assert.ok(await page.evaluate(()=>state.logs.some(x=>x.note==='preserve regression log')&&!!localStorage.getItem('ace_mind_pre_resonance_v1')));
  await page.evaluate(()=>setChamber('clubs'));assert.deepEqual(await visibleScores(),before);
  if(process.env.ACE_SCREENSHOTS){fs.mkdirSync(process.env.ACE_SCREENSHOTS,{recursive:true});await page.screenshot({path:path.join(process.env.ACE_SCREENSHOTS,browserName+'-'+device+'.png')});}
  assert.deepEqual(errors,[]);count++;console.log('PASS '+browserName+' '+device+' date, checkbox, body, navigation, reload, cache, data preservation, domains, layout, manifest');await ctx.close();
 }}finally{await browser.close();}
}
console.log('Browser scenarios passed: '+count);
}finally{server.close();}})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
