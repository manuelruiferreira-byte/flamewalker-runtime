/* Two independent devices against a deterministic Drive/GIS test double.
   This verifies the installed app's integration, not a real Google login. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const pw=require(process.env.ACE_PLAYWRIGHT||'@playwright/test'),root=path.resolve(__dirname,'../..');
const server=http.createServer((req,res)=>{const p=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);if(!p.startsWith(root+path.sep)){res.writeHead(403);return res.end();}try{res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html'})[path.extname(p)]||'application/json');res.end(fs.readFileSync(p));}catch{res.writeHead(404);res.end();}});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));try{for(const browserName of (process.env.ACE_BROWSERS||'chromium,firefox').split(',')){
 const options={headless:true};if(browserName==='chromium'&&process.env.ACE_CHROMIUM_PATH)Object.assign(options,{executablePath:process.env.ACE_CHROMIUM_PATH,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
 const browser=await pw[browserName].launch(options),cloud=[],pages=[];let failList=false,loseAcknowledgment=false;
 try{
 for(const [name,width,height]of [['phone',390,844],['tablet',800,1100]]){
  const ctx=await browser.newContext({viewport:{width,height}});
  await ctx.route('https://accounts.google.com/gsi/client',r=>r.fulfill({contentType:'text/javascript',body:`window.google={accounts:{oauth2:{hasGrantedAllScopes:()=>true,initTokenClient:c=>({requestAccessToken:()=>setTimeout(()=>c.callback({access_token:'test-'+(localStorage.getItem('test-account')||'A'),expires_in:3600,scope:c.scope}),0)})}}};`}));
  await ctx.route('https://www.googleapis.com/**',async route=>{
   const req=route.request(),url=new URL(req.url()),account=req.headers().authorization;
   const ok=x=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(x)});
   if(url.pathname.endsWith('/about'))return ok({user:{permissionId:'account-'+account.replace('Bearer test-',''),emailAddress:'test@example.invalid'}});
   if(req.method()==='POST'){
    const body=req.postData().split('\r\n').filter(s=>s.startsWith('{')).map(JSON.parse).find(x=>x.schema==='ace-user-sync-1');assert.ok(body);cloud.push({id:'file'+cloud.length,account,body});
    if(loseAcknowledgment){loseAcknowledgment=false;return route.fulfill({status:500,body:'{}'});}return ok({id:cloud.at(-1).id});
   }
   if(url.pathname.endsWith('/files')){if(failList){failList=false;return route.fulfill({status:401,body:'{}'});}return ok({files:cloud.filter(x=>x.account===account).map(x=>({id:x.id}))});}
   return ok(cloud.find(x=>x.id===url.pathname.split('/').at(-1)&&x.account===account)?.body||{});
  });
  const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/Jester-Intelligence/ACED-Lifestyle/ace-mind.html');await page.waitForFunction(()=>typeof appInitialized!=='undefined'&&appInitialized&&!!document.getElementById('ace-drive-open'));
  await page.getByRole('button',{name:'Sync',exact:true}).click();
  assert.ok((await page.locator('#ace-drive-detail').innerText()).includes('stay on this device'));
  await page.locator('#ace-drive-client').fill('123-test.apps.googleusercontent.com');await page.getByRole('button',{name:'Save setup',exact:true}).click();await page.waitForFunction(()=>!document.getElementById('ace-drive-connect').disabled);
  await page.locator('#ace-drive-connect').click();await page.waitForFunction(()=>ACECloudSync.status().label==='Synced',{},{timeout:5000}).catch(async e=>{console.error(await page.evaluate(()=>ACECloudSync.status()),errors);throw e;});
  await page.getByRole('button',{name:'Close sync settings',exact:true}).click();await page.evaluate(()=>{setDay('2026-10-19');setChamber('clubs');});
  pages.push({page,ctx,errors,name});
 }
 const [p,t]=pages.map(x=>x.page),fingerprint=page=>page.evaluate(()=>ACEResonance.canonicalize({supplements:ACEResonance.scoreSupplements('2026-10-19',FW_NATAL_PROFILE,ACEResonance.VERSION),domains:ACEResonance.scoreLifeDomains('2026-10-19',FW_NATAL_PROFILE,ACEResonance.VERSION)}));
 const baseline=JSON.parse(fs.readFileSync(__dirname+'/baseline.json')),hash=x=>crypto.createHash('sha256').update(x).digest('hex');assert.equal(hash(await fingerprint(p)),baseline.sha256);
 await p.locator('[data-taken="nr"]').check();await p.waitForFunction(()=>ACECloudSync.status().pending===0&&ACECloudSync.status().label==='Synced');
 await t.evaluate(()=>ACECloudSync.syncNow());assert.equal(await t.locator('[data-taken="nr"]').isChecked(),true);
 // Both devices edit offline. Different fields must survive concurrent reconnects.
 for(const x of pages)await x.ctx.setOffline(true);
 await p.locator('[data-taken="nr"]').uncheck();await t.locator('[data-taken="melatonin"]').check();
 await p.evaluate(()=>{state.notes['2026-10-19']='phone note';saveState();});await t.evaluate(()=>{state.notes['2026-10-20']='tablet note';saveState();});
 assert.ok(await p.evaluate(()=>ACECloudSync.status().pending>0));
 await Promise.all(pages.map(x=>x.ctx.setOffline(false)));await Promise.all(pages.map(x=>x.page.evaluate(()=>ACECloudSync.syncNow())));
 // Each may have listed before the other's upload. The following pull converges them.
 await Promise.all(pages.map(x=>x.page.waitForFunction(()=>!['Syncing'].includes(ACECloudSync.status().label))));
 await Promise.all(pages.map(x=>x.page.evaluate(()=>ACECloudSync.syncNow())));
 for(const x of pages){const s=await x.page.evaluate(()=>({nr:state.supp['2026-10-19__NR'],mel:state.supp['2026-10-19__Melatonin'],a:state.notes['2026-10-19'],b:state.notes['2026-10-20']}));assert.deepEqual(s,{nr:false,mel:true,a:'phone note',b:'tablet note'});assert.equal(hash(await fingerprint(x.page)),baseline.sha256);}
 // Lost HTTP acknowledgement cannot lose the saved edit or resurrect older state.
 loseAcknowledgment=true;await p.evaluate(async()=>{state.notes['2026-10-21']='retry note';saveState();await ACECloudSync.syncNow();});assert.equal(await p.evaluate(()=>ACECloudSync.status().label),'Sync error');assert.ok(await p.evaluate(()=>ACECloudSync.status().pending>0));await p.evaluate(()=>ACECloudSync.syncNow());assert.equal(await p.evaluate(()=>ACECloudSync.status().pending),0);
 // A full local outbox must never report Synced or upload an incomplete capture.
 const filesBeforeQuota=cloud.length;
 await p.evaluate(async()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k.startsWith('ace_drive_sync_v1.batch.'))throw new DOMException('quota','QuotaExceededError');return original.call(this,k,v);};try{state.notes['2026-10-22']='quota retry';saveState();await ACECloudSync.syncNow();}finally{Storage.prototype.setItem=original;}});
 assert.equal(await p.evaluate(()=>ACECloudSync.status().label),'Storage error');assert.equal(cloud.length,filesBeforeQuota);await p.evaluate(()=>ACECloudSync.syncNow());assert.equal(await p.evaluate(()=>ACECloudSync.status().label),'Synced');
 failList=true;await p.evaluate(()=>ACECloudSync.syncNow());assert.equal(await p.evaluate(()=>ACECloudSync.status().label),'Reconnect required');
 await p.getByRole('button',{name:'Sync',exact:true}).click();await p.locator('#ace-drive-connect').click();await p.waitForFunction(()=>ACECloudSync.status().label==='Synced');
 const before=cloud.length;await p.locator('#ace-drive-disconnect').click();await p.evaluate(()=>localStorage.setItem('test-account','B'));await p.locator('#ace-drive-connect').click();await p.waitForFunction(()=>ACECloudSync.status().label==='Connection failed');assert.equal(cloud.length,before);assert.ok((await p.locator('#ace-drive-detail').innerText()).includes('different Google account'));
 assert.ok(await p.evaluate(()=>!Object.values(localStorage).some(x=>x.includes('test-B'))));
 await p.getByRole('button',{name:'Close sync settings',exact:true}).click();
 // Reload restores offline data, but never an access token.
 await t.reload();await t.waitForFunction(()=>typeof appInitialized!=='undefined'&&appInitialized);assert.equal(await t.evaluate(()=>state.notes['2026-10-19']),'phone note');assert.equal(await t.evaluate(()=>ACECloudSync.status().connected),false);
 for(const x of pages){assert.deepEqual(x.errors,[]);await x.ctx.close();}
 assert.ok(cloud.every(f=>!JSON.stringify(f.body).includes('profile_id')));
 console.log('PASS '+browserName+' two-device online/offline checkbox+notes convergence, lost acknowledgement, expiry, account isolation, reload, token privacy, unchanged forecast');
 }finally{await browser.close();}
}}finally{server.close();}})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
