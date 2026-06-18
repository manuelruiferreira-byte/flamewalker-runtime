import {
  evaluateEsotericRegistry,
  evaluateBodyRegistry,
  evaluateFrequencyRegistry,
  evaluatePairingRegistry,
  optimize,
  canonicalize,
  sha256Hex
} from '../../../packages/engines/supplement/index.mjs?v=20260617-2';
import { compareLegacyToOptimizer } from './shadow-context-adapter.mjs?v=20260617-2';
import { buildLiveContext, readVisibleSupplementNames } from './live-context-adapter.mjs?v=20260617-2';
import { buildVisibleSupplementModel } from './optimizer-visible-model-v2.mjs?v=20260617-2';
import { renderVisibleSupplements } from './optimizer-visible-renderer.mjs?v=20260618-5';

const VERSION='ace_mind_optimizer_live.v2';
const BUILD='20260617-2';
const DB_NAME='ACE_MIND_OPTIMIZER_SHADOW_DB';
const DB_VERSION=1;
const STORE='runs';
const DISABLE_KEY='ace_mind_optimizer_live_v2_disabled';
const OLD_DISABLE_KEY='ace_mind_optimizer_shadow_disabled';
// Use default browser caching — the ?v= query param busts stale cache when code changes.
const REGISTRY_URL=new URL('../data/supplements/supplement-registry.v2.json?v=20260617-3',import.meta.url);
const STATE_KEYS=['ace_mind_state_v214','ace_mind_theon_state_v03_block_claim_engine','ace_mind_theon_state_v06','ace_mind_theon_state_v05','ace_mind_theon_state_v04','ace_mind_theon_state_v03'];
const NAD_IDS=new Set(['nr','nmn','nmnh']);
let registryPromise=null,latestRecord=null,lastInputHash='',lastQuickKey='',timer=null,running=false,observer=null;

try{localStorage.removeItem(OLD_DISABLE_KEY);}catch{}

function disabled(){try{return localStorage.getItem(DISABLE_KEY)==='1';}catch{return false;}}
function esc(value){return String(value??'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'})[char]);}
function brusselsDate(){try{return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Brussels',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}catch{return new Date().toISOString().slice(0,10);}}
function root(){return document.getElementById('grid-clubs');}
function renderAuthorityState(kind,date,note){
  const chamber=root();if(!chamber)return false;
  const tone=kind==='held'?'var(--orange,#f97316)':'var(--cyan,#22d3ee)';
  const title=kind==='held'?'Supplement optimizer held':'Preparing supplement decision';
  chamber.innerHTML=`<div data-optimizer-live-v2="${esc(kind)}"><div class="card"><div class="focus-title">${title}</div><div class="small" style="margin-top:5px">${esc(note)}</div><div class="tiny" style="margin-top:5px;color:${tone}">Authority: individual optimizer v2 · ${esc(date||'')}</div></div></div>`;
  chamber.dataset.optimizerAuthority=`individual-v2-${kind}`;
  chamber.dataset.optimizerDate=String(date||'');
  chamber.dataset.optimizerVersion=VERSION;
  return true;
}
function claimPending(reason='loading'){return renderAuthorityState('pending',currentDate(),`Validating body, frequency, pairing, and rotation gates · ${reason}`);}
function failClosed(date,error){
  console.error('ACE optimizer live v2 safety hold',error);
  return renderAuthorityState('held',date,'No supplement recommendation is shown until every safety invariant passes.');
}
function readAgentSnapshot(){try{const raw=document.getElementById('agent-state')?.textContent;const parsed=raw?JSON.parse(raw):null;return parsed&&typeof parsed==='object'?parsed:{};}catch{return {};}}
function readState(){
  let fallback={};
  for(const key of STATE_KEYS){
    try{const raw=localStorage.getItem(key);if(!raw)continue;const value=JSON.parse(raw);if(!value||typeof value!=='object')continue;if(!Object.keys(fallback).length)fallback=value;if(value.suppLog&&typeof value.suppLog==='object')return value;}catch{}
  }
  return fallback;
}
function readSelectedDay(snapshot={}){
  try{if(typeof window.day==='function'){const value=window.day();if(value&&typeof value==='object')return value;}}catch{}
  return snapshot.day&&typeof snapshot.day==='object'?snapshot.day:{id:snapshot.active_day||snapshot.activeDate||brusselsDate()};
}
function currentDate(){const snapshot=readAgentSnapshot();return String(readSelectedDay(snapshot)?.id||snapshot.active_day||snapshot.activeDate||brusselsDate()).slice(0,10);}
function readBodySummary(date,snapshot={}){
  try{if(typeof window.bodySummaryForDate==='function'){const value=window.bodySummaryForDate(date);if(value&&typeof value==='object')return value;}}catch{}
  return snapshot.body&&typeof snapshot.body==='object'?snapshot.body:{};
}
// Cheap pre-check: if date, body state, and today's supplement log haven't changed,
// skip the full buildContext() + sha256 and re-render from the cached record.
function quickKey(date){
  try{
    const snapshot=readAgentSnapshot();
    const state=readState();
    const todayLog=state?.suppLog?.[date];
    const taken=JSON.stringify(todayLog?.taken??todayLog?.events??'');
    const logCount=Object.keys(state?.suppLog??{}).length;
    const body=JSON.stringify(readBodySummary(date,snapshot));
    return `${date}|${logCount}|${taken}|${body}`;
  }catch{return date;}
}
async function registry(){
  registryPromise??=fetch(REGISTRY_URL).then(response=>{if(!response.ok)throw new Error(`registry ${response.status}`);return response.json();});
  return registryPromise;
}
function openDb(){return new Promise((resolve,reject)=>{if(!('indexedDB'in window))return resolve(null);const request=indexedDB.open(DB_NAME,DB_VERSION);request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains(STORE)){const store=db.createObjectStore(STORE,{keyPath:'key'});store.createIndex('createdAt','createdAt');store.createIndex('date','date');}};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
async function persist(record){try{const db=await openDb();if(!db)return;await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(record);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});db.close();}catch(error){console.warn('ACE optimizer v2 storage skipped',error);}}
async function getHistory(limit=30){
  const safe=Math.max(0,Math.min(5000,Number.isFinite(Number(limit))?Math.floor(Number(limit)):30));
  const db=await openDb();if(!db)return latestRecord?[latestRecord]:[];
  return new Promise((resolve,reject)=>{const rows=[];const tx=db.transaction(STORE,'readonly');const request=tx.objectStore(STORE).index('createdAt').openCursor(null,'prev');request.onsuccess=()=>{const cursor=request.result;if(cursor&&rows.length<safe){rows.push(cursor.value);cursor.continue();}else{db.close();resolve(rows);}};request.onerror=()=>{db.close();reject(request.error);};});
}
async function buildContext(){
  const supplementRegistry=await registry();
  const snapshot=readAgentSnapshot();
  const state=readState();
  const selectedDay=readSelectedDay(snapshot);
  const date=String(selectedDay?.id||snapshot.active_day||snapshot.activeDate||brusselsDate()).slice(0,10);
  return {registry:supplementRegistry,context:buildLiveContext({snapshot,state,registry:supplementRegistry,day:selectedDay,bodySummary:readBodySummary(date,snapshot),visibleNames:readVisibleSupplementNames(),fallbackDate:brusselsDate()})};
}
function selectedMembers(output={}){return [...new Set((output.selected??[]).flatMap(item=>item?.atom?.memberIds??[]))].sort();}
function assertOutputSafety(output={}){
  const nad=selectedMembers(output).filter(id=>NAD_IDS.has(id));
  if(nad.length>1)throw new Error(`NAD exclusivity breach: ${nad.join(', ')}`);
  for(const item of output.selected??[]){if(!item?.atom?.primaryId||!(item?.atom?.memberIds??[]).includes(item.atom.primaryId))throw new Error('Malformed selected atom');}
}
function buildDiagnostics(supplementRegistry,layers,output){
  const selectedIds=new Set(selectedMembers(output));
  return Object.fromEntries([...(supplementRegistry.supplements??[])].sort((a,b)=>a.id.localeCompare(b.id)).map(item=>{
    const eso=layers.esoteric?.[item.id]??{},body=layers.body?.[item.id]??{},frequency=layers.frequency?.[item.id]??{},pairing=layers.pairing?.[item.id]??{};
    return [item.id,{esotericLabel:eso.label??'Unscored',esotericScalar:Number.isFinite(Number(eso.scalar))?Number(eso.scalar):null,bodyPermission:body.label??'unknown',frequencyState:frequency.state??'unknown',frequencyUrgency:Number.isFinite(Number(frequency.urgency))?Number(frequency.urgency):null,pairingState:selectedIds.has(item.id)?'complete':pairing.state??'unknown'}];
  }));
}
function applyVisibleAuthority(record,supplementRegistry){
  if(disabled())return failClosed(record?.date||currentDate(),new Error('optimizer disabled'));
  if(String(record?.date||'')!==currentDate())throw new Error(`stale optimizer date ${record?.date||'none'} != ${currentDate()}`);
  assertOutputSafety(record);
  buildVisibleSupplementModel(record,supplementRegistry);
  const model=renderVisibleSupplements(record,supplementRegistry);
  const chamber=root();
  if(chamber){const marker=document.createElement('span');marker.hidden=true;marker.dataset.optimizerLiveV2='1';chamber.prepend(marker);chamber.dataset.optimizerAuthority='individual-v2';chamber.dataset.optimizerVersion=VERSION;}
  return model;
}
async function run(reason='manual'){
  if(disabled()){failClosed(currentDate(),new Error('optimizer disabled'));return null;}
  if(running)return latestRecord;
  running=true;
  let date=currentDate();
  try{
    // Fast path: if date + body + today's log are unchanged and we have results, just re-render.
    const qk=quickKey(date);
    if(qk===lastQuickKey&&latestRecord&&latestRecord.date===date){applyVisibleAuthority(latestRecord,await registry());return latestRecord;}
    // Show loading only when we don't have valid results for today yet.
    if(!latestRecord||latestRecord.date!==date){claimPending(reason);}
    const {registry:supplementRegistry,context}=await buildContext();date=context.date;
    if(date!==currentDate()){schedule('date-race');return null;}
    const inputHash=sha256Hex(JSON.stringify(canonicalize(context)));
    if(inputHash===lastInputHash&&latestRecord){lastQuickKey=qk;applyVisibleAuthority(latestRecord,supplementRegistry);return latestRecord;}
    const layers={esoteric:evaluateEsotericRegistry(supplementRegistry,context.dayField),body:evaluateBodyRegistry(supplementRegistry,context.bodyState),frequency:evaluateFrequencyRegistry(supplementRegistry,date,context.histories),pairing:evaluatePairingRegistry(supplementRegistry,[])};
    const output=optimize({day:date,registry:supplementRegistry,daySignals:context.daySignals,layers,config:{}});
    assertOutputSafety(output);
    const comparison=compareLegacyToOptimizer(context.legacy,output),createdAt=new Date().toISOString();
    const record={key:`${date}:${inputHash}`,version:VERSION,build:BUILD,mode:'visible-authority-fail-closed',date,createdAt,reason,inputHash,optimizerHash:output.determinismHash,legacy:context.legacy,comparison,diagnostics:buildDiagnostics(supplementRegistry,layers,output),selected:output.selected,residual:output.residual,held:output.held,excluded:output.excluded};
    if(date!==currentDate()){schedule('date-race-after-build');return null;}
    latestRecord=record;lastInputHash=inputHash;lastQuickKey=qk;applyVisibleAuthority(record,supplementRegistry);void persist(record);
    window.dispatchEvent(new CustomEvent('ace-mind:optimizer-live',{detail:{date,comparison,optimizerHash:output.determinismHash,authority:'individual-v2'}}));
    return record;
  }catch(error){failClosed(date,error);return null;}finally{running=false;}
}
function schedule(reason='render'){clearTimeout(timer);timer=setTimeout(()=>void run(reason),50);}
function wrapAndSchedule(name,reason){
  const base=window[name];if(typeof base!=='function'||base.__aceOptimizerLiveV2Wrapped)return;
  // Do NOT call claimPending here — it would wipe valid results from a prior run.
  // The overwrite guard (MutationObserver) catches legacy overwrites; schedule() handles re-evaluation.
  function wrapped(...args){const result=base.apply(this,args);schedule(reason);return result;}
  wrapped.__aceOptimizerLiveV2Wrapped=true;wrapped.__aceOptimizerLiveV2Base=base;window[name]=wrapped;
}
function installHooks(){['render','setDay','fastRenderSelectedDay','tickSupp','setBodyState'].forEach(name=>wrapAndSchedule(name,name));}
function installOverwriteGuard(){
  const chamber=root();if(!chamber||observer)return;
  observer=new MutationObserver(()=>{if(running)return;if(!chamber.querySelector('[data-optimizer-live-v2]'))schedule('legacy-overwrite');});
  observer.observe(chamber,{childList:true,subtree:false});
}
function boot(){
  claimPending('boot');installHooks();installOverwriteGuard();schedule('module-ready');
  window.addEventListener('focus',()=>schedule('focus'));
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')schedule('visible');});
}

if(typeof window!=='undefined'){
  const api=Object.freeze({version:VERSION,build:BUILD,mode:'visible-authority-fail-closed',run,latest:()=>latestRecord,history:getHistory,disable(){localStorage.setItem(DISABLE_KEY,'1');failClosed(currentDate(),new Error('optimizer disabled'));},enable(){localStorage.removeItem(DISABLE_KEY);schedule('enabled');}});
  window.AceMindOptimizerShadow=api;window.AceMindOptimizerLive=api;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
}
