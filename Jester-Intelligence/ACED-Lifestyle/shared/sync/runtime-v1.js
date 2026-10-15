/* Optional personal Drive synchronization. No forecast or natal fields leave here. */
(function(root){'use strict';
const C=root.ACEUserSync,T=root.ACEDriveTransport,P='ace_drive_sync_v1.',esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let adapter,observed,account='',email='',token='',expires=0,transport=null,busy=false,applying=false,timer,interval,started=false,connecting=false,generation=0;
let draftId='';
let label='Not connected',detail='Checks, notes, practices, body observations and logs stay on this device until you connect.',lastSync='';
const actor=crypto.randomUUID();
function read(k,fallback){try{const raw=localStorage.getItem(P+k);return raw?JSON.parse(raw):fallback;}catch{return fallback;}}
function write(k,x){localStorage.setItem(P+k,JSON.stringify(x));}
function entries(){const out=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k.startsWith(P+'batch.')){const d=JSON.parse(localStorage.getItem(k));if(!d.account||d.account===account){C.readBatch(d.body);out.push({key:k,...d});}}}return out;}
function records(){return C.merge(...entries().map(x=>x.body.records));}
function pending(){return entries().filter(x=>x.local&&!read('ack.'+x.body.id,false));}
function setStatus(value,message=''){label=value;detail=message;paint();}
function paint(){
 const status=document.getElementById('ace-drive-status');if(!status)return;
 status.textContent=label+(pendingSafe()?' · '+pendingSafe()+' pending batch(es)':'');
 document.getElementById('ace-drive-detail').textContent=detail;
 document.getElementById('ace-drive-account').textContent=email?'Google account: '+email:account?'Previously linked Google account. Reconnect to synchronize.':'Use the same Google account on every device.';
 document.getElementById('ace-drive-last').textContent=lastSync?'Last confirmed sync: '+new Date(lastSync).toLocaleString('en-GB',{hour12:false}):'';
 document.getElementById('ace-drive-connect').disabled=connecting||!clientId()||!root.google?.accounts?.oauth2;
 document.getElementById('ace-drive-connect').textContent=token?'Reconnect Google':'Connect Google Drive';
 document.getElementById('ace-drive-now').disabled=busy||!token;
 document.getElementById('ace-drive-disconnect').disabled=!token&&!connecting;
}
function pendingSafe(){try{return pending().length;}catch{return 0;}}
function clientId(){return root.ACE_DRIVE_CONFIG?.clientId||read('clientId','');}
function loadGoogle(){
 if(root.google?.accounts?.oauth2){paint();return;}
 if(document.getElementById('ace-google-identity'))return;
 const script=document.createElement('script');script.id='ace-google-identity';script.src='https://accounts.google.com/gsi/client';script.async=true;
 script.onload=()=>{setStatus('Ready to connect','Select Connect Google Drive to authorize private app data.');};
 script.onerror=()=>{script.remove();setStatus('Google sign-in unavailable','Check your connection, then save setup again to retry. Local changes are retained.');};document.head.appendChild(script);
}
function persist(ops,seed=false){
 if(!Object.keys(ops).length)return;
 const prior=draftId?read('batch.'+draftId,null):null;
 const body=C.batch(draftId||crypto.randomUUID(),C.merge(prior?.body.records||{},ops));
 write('batch.'+body.id,{account:account||null,local:true,seed,body});draftId=body.id;
}
function acknowledge(body){for(const id of [body.id,...(body.sourceIds||[])])if(typeof id==='string'&&localStorage.getItem(P+'batch.'+id))write('ack.'+id,true);}
function capture(){
 if(!adapter||applying)return;
 try{const next=C.flatten(adapter.get());const ops=C.diff(observed||{},next,records(),actor,Date.now());persist(ops);observed=next;
 if(Object.keys(ops).length){setStatus(navigator.onLine?'Pending':'Offline',token?'Changes saved locally; synchronization queued.':'Changes saved locally. Connect Google Drive to sync.');schedule();}}
 catch{setStatus('Storage error','Could not persist synchronization records. Export your device data before clearing storage.');}
}
function editing(){const e=document.activeElement;return e&&(e.tagName==='TEXTAREA'||e.tagName==='INPUT'&&!['checkbox','button'].includes(e.type))&&!e.closest('#ace-drive-modal');}
function apply(){if(editing())return;const current=adapter.get(),next=C.apply(current,records());if(C.canonical(C.flatten(current))===C.canonical(C.flatten(next))){observed=C.flatten(next);return;}applying=true;try{adapter.apply(next);observed=C.flatten(adapter.get());}finally{applying=false;}}
function schedule(){clearTimeout(timer);if(token&&navigator.onLine)timer=setTimeout(()=>syncNow(),1000);}
async function syncNow(){
 if(busy||!adapter)return;
 if(!navigator.onLine){setStatus('Offline','Changes remain on this device and will synchronize when connected.');return;}
 if(!transport||Date.now()>=expires){token='';transport=null;setStatus('Reconnect required','Google sessions expire. Select Connect Google Drive; pending changes are retained.');return;}
 capture();busy=true;setStatus('Syncing','Reading private Drive app data and saving pending changes.');
 try{
  const session=transport,sessionAccount=account;
  for(const file of await session.list()){
   if(session!==transport)return;
   const key='batch.remote.'+sessionAccount+'.'+file.id;
   if(!localStorage.getItem(P+key)){const body=await session.read(file.id);if(session!==transport)return;write(key,{account:sessionAccount,local:false,body});acknowledge(body);}
  }
  const queued=pending();draftId=''; // Seal this snapshot before any network await.
  if(queued.length){
   if(session!==transport)return;
   const combined={...C.batch(crypto.randomUUID(),C.merge(...queued.map(x=>x.body.records))),sourceIds:queued.map(x=>x.body.id)};
   await session.append(combined);
   if(session!==transport)return;
   acknowledge(combined);
  }
  apply();lastSync=new Date().toISOString();write('lastSync',lastSync);
  setStatus(pending().length?'Pending':'Synced',editing()?'Remote changes received. They will display after you finish editing.':'Your devices converge when online and the app is open.');
 }catch(e){if(e.status===401){token='';transport=null;setStatus('Reconnect required',e.message);}else setStatus(navigator.onLine?'Sync error':'Offline',e.message||'Drive unavailable. Pending changes are retained.');}
 finally{busy=false;paint();if(pendingSafe()&&token&&navigator.onLine){clearTimeout(timer);timer=setTimeout(()=>syncNow(),30000);}}
}
function connect(){
 if(connecting)return;
 if(!clientId()){setStatus('Setup required','Add the public Google Web OAuth client ID in setup.');return;}
 if(!root.google?.accounts?.oauth2){loadGoogle();return;}
 const attempt=++generation;connecting=true;paint();
 try{const oauth=root.google.accounts.oauth2.initTokenClient({client_id:clientId(),scope:T.SCOPE,include_granted_scopes:false,
  error_callback:()=>{if(attempt!==generation)return;connecting=false;setStatus('Not connected','Google sign-in was closed or unavailable. Local changes are retained.');},
  callback:async response=>{
   try{
    if(attempt!==generation)return;
    if(response.error||!response.access_token||!root.google.accounts.oauth2.hasGrantedAllScopes(response,T.SCOPE))throw Error('App-data permission was not granted.');
    const candidate=new T.Drive(response.access_token),identity=await candidate.identity();
    if(attempt!==generation)return;
    if(account&&identity.permissionId!==account)throw Error('This browser is linked to a different Google account. Reconnect that account, or use a separate browser profile. Nothing was uploaded.');
    account=identity.permissionId;email=identity.emailAddress||'';write('identity',{account,email});
    for(const item of entries())if(!item.account){localStorage.setItem(item.key,JSON.stringify({...item,account}));}
    token=response.access_token;expires=Date.now()+Math.max(0,Number(response.expires_in||0)*1000-30000);transport=candidate;await syncNow();
   }catch(e){if(attempt!==generation)return;token='';transport=null;setStatus('Connection failed',e.message||'Google connection failed.');}
   finally{if(attempt===generation){connecting=false;paint();}}
  }});
 oauth.requestAccessToken({prompt:'select_account'});
 }catch{connecting=false;setStatus('Connection failed','Google sign-in could not open. Check the client setup and allow the Google sign-in popup.');}
}
function disconnect(){generation++;token='';transport=null;expires=0;connecting=false;clearTimeout(timer);setStatus('Disconnected','Local records and Drive data are retained. Reconnect the same account to resume.');}
function setup(){
 const id=document.getElementById('ace-drive-client').value.trim();
 if(!/^\d+-[a-zA-Z0-9_-]+\.apps\.googleusercontent\.com$/.test(id)){setStatus('Setup required','Enter a Google Web OAuth client ID ending in .apps.googleusercontent.com. Never enter a client secret.');return;}
 disconnect();write('clientId',id);setStatus('Loading Google sign-in','Preparing the Google authorization button.');loadGoogle();
}
function mount(){
 if(document.getElementById('ace-drive-modal'))return;
 const modal=document.createElement('dialog');modal.id='ace-drive-modal';modal.className='ace-drive-dialog';
 modal.innerHTML=`<button class="ace-drive-close" aria-label="Close sync settings">Close</button><h2>Sync your devices</h2><p id="ace-drive-status" role="status" aria-live="polite"></p><p id="ace-drive-detail"></p><p id="ace-drive-account"></p><small id="ace-drive-last"></small><p>Connect the same Google account on your phone, tablet and PC. This shares taken checkboxes, notes, practices, body observations and logs with your private Drive app data. Forecast scores and natal data are excluded.</p><div class="ace-drive-actions"><button id="ace-drive-connect">Connect Google Drive</button><button id="ace-drive-now">Sync now</button><button id="ace-drive-disconnect">Disconnect</button></div><p>Sync runs while this app is open and online, including when you return to it. Offline changes wait on your device. Reconnect if Google asks you to sign in again.</p><details id="ace-drive-setup"><summary>One-time Google setup</summary><p>A Google Web OAuth client must be configured for this application before sign-in can work. Use the same client ID on every device.</p><label>Public Google Web client ID<input id="ace-drive-client" type="text" autocomplete="off" spellcheck="false" placeholder="…apps.googleusercontent.com"></label><button id="ace-drive-save-setup">Save setup</button><p>Enable Drive API. Add this exact authorized JavaScript origin: <code>https://manuelruiferreira-byte.github.io</code>. Add your account as a test user if the consent app is in testing. Only the drive.appdata scope is needed. No client secret belongs in this app.</p><a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer">Google Cloud credentials</a></details>`;
 document.body.appendChild(modal);modal.querySelector('.ace-drive-close').onclick=()=>modal.close();
 document.getElementById('ace-drive-connect').onclick=connect;document.getElementById('ace-drive-now').onclick=()=>syncNow();document.getElementById('ace-drive-disconnect').onclick=disconnect;document.getElementById('ace-drive-save-setup').onclick=setup;
 const button=document.createElement('button');button.className='dock-btn';button.textContent='Sync';button.id='ace-drive-open';button.onclick=()=>{document.getElementById('ace-drive-client').value=clientId();document.getElementById('ace-drive-setup').open=!clientId();paint();modal.showModal();if(clientId())loadGoogle();};
 document.querySelector('.utility-dock').appendChild(button);paint();
}
function init(options){
 if(started)return;started=true;adapter=options;
 try{
  const identity=read('identity',{});account=identity.account||'';email=identity.email||'';lastSync=read('lastSync','');
  const current=C.flatten(adapter.get()),known=records(),missing=Object.fromEntries(Object.entries(current).filter(([key])=>!known[key]));
  persist(C.diff({},missing,known,actor,0,true),true);observed=current;apply();
 }catch{label='Storage error';detail='Sync storage could not be loaded. Existing app data has not been cleared.';}
 mount();if(clientId())loadGoogle();
 interval=setInterval(()=>{if(!document.hidden&&token)syncNow();},30000);
 root.addEventListener('online',()=>{if(token)syncNow();else setStatus('Not connected','Online. Connect Google Drive to synchronize pending changes.');});
 root.addEventListener('offline',()=>setStatus('Offline','Changes remain on your device.'));
 document.addEventListener('visibilitychange',()=>{if(!document.hidden){capture();try{apply();}catch{}if(token)syncNow();}});
 document.addEventListener('focusout',()=>setTimeout(()=>{try{apply();}catch{}},0));
 root.addEventListener('storage',e=>{if(e.key?.startsWith(P+'batch.')){try{capture();apply();}catch{}if(token)schedule();}});
}
root.ACECloudSync={init,capture,syncNow,connect,disconnect,status:()=>({label,detail,account,email,lastSync,pending:pendingSafe(),configured:!!clientId(),connected:!!token})};
})(globalThis);
