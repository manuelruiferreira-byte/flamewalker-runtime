import {
  evaluateEsotericRegistry,
  evaluateBodyRegistry,
  evaluateFrequencyRegistry,
  evaluatePairingRegistry,
  optimize,
  canonicalize,
  sha256Hex
} from '../../../packages/engines/supplement/index.mjs?v=20260618-1';
import { applyCanonicalSupplementPolicy, POLICY_VERSION } from '../data/supplements/canonical-policy-v3.mjs?v=20260618-1';
import { compareLegacyToOptimizer } from './shadow-context-adapter.mjs?v=20260618-1';
import { buildLiveContext, readVisibleSupplementNames } from './live-context-adapter.mjs?v=20260618-1';
import { buildVisibleSupplementModel } from './optimizer-visible-model-v2.mjs?v=20260618-1';
import { renderVisibleSupplements } from './optimizer-visible-renderer.mjs?v=20260618-1';

const VERSION='ace_mind_optimizer_live.v3-policy';
const BUILD='20260618-1';
const DB_NAME='ACE_MIND_OPTIMIZER_POLICY_V3_DB';
const DB_VERSION=1;
const STORE='runs';
const DISABLE_KEY='ace_mind_optimizer_live_v3_disabled';
const OLD_DISABLE_KEYS=['ace_mind_optimizer_live_v2_disabled','ace_mind_optimizer_shadow_disabled'];
const REGISTRY_URL=new URL('../data/supplements/supplement-registry.v2.json?v=20260618-1',import.meta.url);
const STATE_KEYS=['ace_mind_state_v214','ace_mind_theon_state_v03_block_claim_engine','ace_mind_theon_state_v06','ace_mind_theon_state_v05','ace_mind_theon_state_v04','ace_mind_theon_state_v03'];
const NAD_IDS=new Set(['nr','nmn','nmnh']);
const WEEKLY_IDS=['ashwagandha','reishi','gotu_kola','fadogia_agrestis','turkesterone'];
let registryPromise=null,latestRecord=null,lastInputHash='',timer=null,running=false,observer=null;

for(const key of OLD_DISABLE_KEYS){try{localStorage.removeItem(key);}catch{}}

function disabled(){try{return localStorage.getItem(DISABLE_KEY)==='1';}catch{return false;}}
function esc(value){return String(value??'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'})[char]);}
function brusselsDate(){try{return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Brussels',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}catch{return new Date().toISOString().slice(0,10);}}
function root(){return document.getElementById('grid-clubs');}
function renderAuthorityState(kind,date,note){
  const chamber=root();if(!chamber)return false;
  const tone=kind==='held'?'var(--orange,#f97316)':'var(--cyan,#22d3ee)';
  const title=kind==='held'?'Supplement optimizer held':'Preparing supplement decision';
  chamber.innerHTML=`<div data-optimizer-live-v3="${esc(kind)}"><div class="card"><div class="focus-title">${title}</div><div class="small" style="margin-top:5px">${esc(note)}</div><div class="tiny" style="margin-top:5px;color:${tone}">Authority: canonical 42-card policy · ${esc(date||'')}</div></div></div>`;
  chamber.dataset.optimizerAuthority=`individual-v3-${kind}`;
  chamber.dataset.optimizerDate=String(date||'');
  chamber.dataset.optimizerVersion=VERSION;
  return true;
}
function claimPending(reason='loading'){return renderAuthorityState('pending',currentDate(),`Validating canonical policy, body, frequency, pairing, and rotation · ${reason}`);}
function failClosed(date,error){console.error('ACE optimizer policy v3 safety hold',error);return renderAuthorityState('held',date,'No recommendation is shown until the canonical policy and every safety invariant pass.');}
function readAgentSnapshot(){try{const raw=document.getElementById('agent-state')?.textContent;const parsed=raw?JSON.parse(raw):null;return parsed&&typeof parsed==='object'?parsed:{};}catch{return {};}}
function readState(){
  let fallback={};
  for(const key of STATE_KEYS){
    try{const raw=localStorage.getItem(key);if(!raw)continue;const value=JSON.parse(raw);if(!value||typeof value!=='object')continue;if(!Object.keys(fallback).length)fallback=value;if(value.suppLog&&typeof value.suppLog==='object')return value;}catch{}
  }
  return fallback;
}
function readSelectedDay(snapshot={}){try{if(typeof window.day==='function'){const value=window.day();if(value&&typeof value==='object')return value;}}catch{}return snapshot.day&&typeof snapshot.day==='object'?snapshot.day:{id:snapshot.active_day||snapshot.activeDate||brusselsDate()};}
function currentDate(){const snapshot=readAgentSnapshot();return String(readSelectedDay(snapshot)?.id||snapshot.active_day||snapshot.activeDate||brusselsDate()).slice(0,10);}
function readBodySummary(date,snapshot={}){try{if(typeof window.bodySummaryForDate==='function'){const value=window.bodySummaryForDate(date);if(value&&typeof value==='object')return value;}}catch{}return snapshot.body&&typeof snapshot.body==='object'?snapshot.body:{};}

function assertCanonicalPolicy(registry){
  if(registry.policyVersion!==POLICY_VERSION)throw new Error(`policy version mismatch: ${registry.policyVersion||'none'}`);
  if((registry.supplements??[]).length!==42)throw new Error(`canonical table requires 42 cards, found ${(registry.supplements??[]).length}`);
  const index=new Map(registry.supplements.map(card=>[card.id,card]));
  for(const id of WEEKLY_IDS){
    const card=index.get(id);if(!card)throw new Error(`weekly card missing: ${id}`);
    if(card.autoSelection!=='manual_only')throw new Error(`${id} must be manual_only`);
    if(card.frequency?.maxUses7d!==1||card.frequency?.rollingWindowDays!==7||card.frequency?.automaticFrequencyBoost!==false)throw new Error(`${id} weekly governance incomplete`);
  }
  for(const card of index.values()){
    if(!card.protocolPolicy?.practicalTimingAuthority)throw new Error(`${card.id} missing practical timing authority`);
    if(!Number.isFinite(Number(card.esotericSignature?.numerology?.numerologySum)))throw new Error(`${card.id} missing canonical numerology`);
    if(!card.esotericSignature?.bazi?.dayMasterStem||!card.esotericSignature?.bazi?.polarity)throw new Error(`${card.id} missing canonical BaZi stem/polarity`);
  }
}

async function registry(){
  registryPromise??=fetch(REGISTRY_URL,{cache:'no-store'})
    .then(response=>{if(!response.ok)throw new Error(`registry ${response.status}`);return response.json();})
    .then(raw=>applyCanonicalSupplementPolicy(raw))
    .then(canonical=>{assertCanonicalPolicy(canonical);return canonical;});
  return registryPromise;
}
function openDb(){return new Promise((resolve,reject)=>{if(!('indexedDB'in window))return resolve(null);const request=indexedDB.open(DB_NAME,DB_VERSION);request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains(STORE)){const store=db.createObjectStore(STORE,{keyPath:'key'});store.createIndex('createdAt','createdAt');store.createIndex('date','date');}};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
async function persist(record){try{const db=await openDb();if(!db)return;await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(record);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});db.close();}catch(error){console.warn('ACE optimizer v3 storage skipped',error);}}
async function getHistory(limit=30){const safe=Math.max(0,Math.min(5000,Number.isFinite(Number(limit))?Math.floor(Number(limit)):30));const db=await openDb();if(!db)return latestRecord?[latestRecord]:[];return new Promise((resolve,reject)=>{const rows=[];const tx=db.transaction(STORE,'readonly');const request=tx.objectStore(STORE).index('createdAt').openCursor(null,'prev');request.onsuccess=()=>{const cursor=request.result;if(cursor&&rows.length<safe){rows.push(cursor.value);cursor.continue();}else{db.close();resolve(rows);}};request.onerror=()=>{db.close();reject(request.error);};});}
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
    return [item.id,{
      esotericLabel:eso.label??'Unscored',
      convergenceLabel:eso.convergenceLabel??'None',
      esotericScalar:Number.isFinite(Number(eso.scalar))?Number(eso.scalar):null,
      numerologyScalar:Number.isFinite(Number(eso.components?.numerology?.scalar))?Number(eso.components.numerology.scalar):null,
      baziScalar:Number.isFinite(Number(eso.components?.bazi?.scalar))?Number(eso.components.bazi.scalar):null,
      bodyPermission:body.label??'unknown',
      frequencyState:frequency.state??'unknown',
      frequencyUrgency:Number.isFinite(Number(frequency.urgency))?Number(frequency.urgency):null,
      calendarEligible:frequency.calendarEligible??null,
      pairingState:selectedIds.has(item.id)?'complete':pairing.state??'unknown',
      policyVersion:supplementRegistry.policyVersion
    }];
  }));
}
function applyVisibleAuthority(record,supplementRegistry){
  if(disabled())return failClosed(record?.date||currentDate(),new Error('optimizer disabled'));
  if(String(record?.date||'')!==currentDate())throw new Error(`stale optimizer date ${record?.date||'none'} != ${currentDate()}`);
  assertOutputSafety(record);
  buildVisibleSupplementModel(record,supplementRegistry);
  const model=renderVisibleSupplements(record,supplementRegistry);
  const chamber=root();
  if(chamber){const marker=document.createElement('span');marker.hidden=true;marker.dataset.optimizerLiveV3='1';chamber.prepend(marker);chamber.dataset.optimizerAuthority='individual-card-policy-v3';chamber.dataset.optimizerVersion=VERSION;}
  return model;
}
async function run(reason='manual'){
  if(disabled()){failClosed(currentDate(),new Error('optimizer disabled'));return null;}
  if(running)return latestRecord;
  running=true;
  if(!latestRecord||latestRecord.date!==currentDate())claimPending(reason);
  let date=currentDate();
  try{
    const {registry:supplementRegistry,context}=await buildContext();date=context.date;
    if(date!==currentDate()){schedule('date-race');return null;}
    const hashPayload={policyVersion:supplementRegistry.policyVersion,context};
    const inputHash=sha256Hex(JSON.stringify(canonicalize(hashPayload)));
    if(inputHash===lastInputHash&&latestRecord){applyVisibleAuthority(latestRecord,supplementRegistry);return latestRecord;}
    const layers={
      esoteric:evaluateEsotericRegistry(supplementRegistry,context.dayField),
      body:evaluateBodyRegistry(supplementRegistry,context.bodyState),
      frequency:evaluateFrequencyRegistry(supplementRegistry,date,context.histories),
      pairing:evaluatePairingRegistry(supplementRegistry,[])
    };
    const output=optimize({day:date,registry:supplementRegistry,daySignals:context.daySignals,layers,config:{}});
    assertOutputSafety(output);
    const comparison=compareLegacyToOptimizer(context.legacy,output),createdAt=new Date().toISOString();
    const record={key:`${date}:${inputHash}`,version:VERSION,build:BUILD,policyVersion:supplementRegistry.policyVersion,mode:'canonical-card-policy-fail-closed',date,createdAt,reason,inputHash,optimizerHash:output.determinismHash,legacy:context.legacy,comparison,diagnostics:buildDiagnostics(supplementRegistry,layers,output),selected:output.selected,residual:output.residual,held:output.held,excluded:output.excluded};
    if(date!==currentDate()){schedule('date-race-after-build');return null;}
    latestRecord=record;lastInputHash=inputHash;applyVisibleAuthority(record,supplementRegistry);void persist(record);
    window.dispatchEvent(new CustomEvent('ace-mind:optimizer-live',{detail:{date,policyVersion:supplementRegistry.policyVersion,comparison,optimizerHash:output.determinismHash,authority:'canonical-card-policy-v3'}}));
    return record;
  }catch(error){failClosed(date,error);return null;}finally{running=false;}
}
function schedule(reason='render'){clearTimeout(timer);timer=setTimeout(()=>void run(reason),20);}
function wrapAndSchedule(name,reason){
  const base=window[name];if(typeof base!=='function'||base.__aceOptimizerLiveV3Wrapped)return;
  function wrapped(...args){const result=base.apply(this,args);schedule(reason);return result;}
  wrapped.__aceOptimizerLiveV3Wrapped=true;wrapped.__aceOptimizerLiveV3Base=base;window[name]=wrapped;
}
function installHooks(){['render','setDay','fastRenderSelectedDay','tickSupp','setBodyState'].forEach(name=>wrapAndSchedule(name,name));}
function installOverwriteGuard(){
  const chamber=root();if(!chamber||observer)return;
  observer=new MutationObserver(()=>{if(running)return;if(!chamber.querySelector('[data-optimizer-live-v3]')&&!chamber.querySelector('[data-optimizer-supp]'))schedule('legacy-overwrite');});
  observer.observe(chamber,{childList:true,subtree:false});
}
function boot(){claimPending('boot');installHooks();installOverwriteGuard();schedule('module-ready');window.addEventListener('focus',()=>schedule('focus'));document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')schedule('visible');});}

if(typeof window!=='undefined'){
  const api=Object.freeze({version:VERSION,build:BUILD,policyVersion:POLICY_VERSION,mode:'canonical-card-policy-fail-closed',run,latest:()=>latestRecord,history:getHistory,disable(){localStorage.setItem(DISABLE_KEY,'1');failClosed(currentDate(),new Error('optimizer disabled'));},enable(){localStorage.removeItem(DISABLE_KEY);schedule('enabled');}});
  window.AceMindOptimizerShadow=api;window.AceMindOptimizerLive=api;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
}
