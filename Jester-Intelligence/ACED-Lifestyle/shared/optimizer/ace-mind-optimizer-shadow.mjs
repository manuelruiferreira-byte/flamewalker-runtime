import {
  evaluateEsotericRegistry,
  evaluateBodyRegistry,
  evaluateFrequencyRegistry,
  evaluatePairingRegistry,
  optimize,
  canonicalize,
  sha256Hex
} from '../../../packages/engines/supplement/index.mjs';
import {
  snapshotToContext,
  compareLegacyToOptimizer
} from './shadow-context-adapter.mjs';
import { buildShadowReport } from './shadow-report.mjs';
import { renderVisibleSupplements } from './optimizer-visible-renderer.mjs';

const VERSION='ace_mind_optimizer_live.v1';
const DB_NAME='ACE_MIND_OPTIMIZER_SHADOW_DB';
const DB_VERSION=1;
const STORE='runs';
const DISABLE_KEY='ace_mind_optimizer_shadow_disabled';
const REGISTRY_URL=new URL('../data/supplements/supplement-registry.v1.json',import.meta.url);
const STATE_KEYS=['ace_mind_state_v214','ace_mind_theon_state_v03_block_claim_engine','ace_mind_theon_state_v06','ace_mind_theon_state_v05','ace_mind_theon_state_v04','ace_mind_theon_state_v03'];
let registryPromise=null, latestRecord=null, lastInputHash='', timer=null, running=false;
let reportPromise=null, reportCache=null;

function disabled(){
  try{return localStorage.getItem(DISABLE_KEY)==='1';}
  catch{return false;}
}

function readAgentSnapshot(){
  try{
    const raw=document.getElementById('agent-state')?.textContent;
    const parsed=raw?JSON.parse(raw):null;
    return parsed&&typeof parsed==='object'?parsed:null;
  }catch{return null;}
}

function brusselsDate(){
  try{return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Brussels',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
  catch{return new Date().toISOString().slice(0,10);}
}

function readState(){
  for(const key of STATE_KEYS){
    try{
      const raw=localStorage.getItem(key);
      if(raw){
        const value=JSON.parse(raw);
        if(value&&typeof value==='object')return value;
      }
    }catch{}
  }
  return {};

}

async function registry(){
  registryPromise??=fetch(REGISTRY_URL,{cache:'no-store'}).then(response=>{
    if(!response.ok)throw new Error(`registry ${response.status}`);
    return response.json();
  });
  return registryPromise;
}

function openDb(){
  return new Promise((resolve,reject)=>{
    if(!('indexedDB'in window))return resolve(null);
    const request=indexedDB.open(DB_NAME,DB_VERSION);
    request.onupgradeneeded=()=>{
      const db=request.result;
      if(!db.objectStoreNames.contains(STORE)){
        const store=db.createObjectStore(STORE,{keyPath:'key'});
        store.createIndex('createdAt','createdAt');
        store.createIndex('date','date');
      }
    };
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
  });
}

async function persist(record){
  try{
    const db=await openDb();
    if(!db)return;
    await new Promise((resolve,reject)=>{
      const transaction=db.transaction(STORE,'readwrite');
      transaction.objectStore(STORE).put(record);
      transaction.oncomplete=resolve;
      transaction.onerror=()=>reject(transaction.error);
    });
    db.close();
  }catch(error){
    console.warn('ACE optimizer storage skipped',error);
  }
}

async function getHistory(limit=30){
  const safeLimit=Math.max(0,Math.min(5000,Number.isFinite(Number(limit))?Math.floor(Number(limit)):30));
  const db=await openDb();
  if(!db)return latestRecord?[latestRecord]:[];
  return new Promise((resolve,reject)=>{
    const rows=[];
    const transaction=db.transaction(STORE,'readonly');
    const request=transaction.objectStore(STORE).index('createdAt').openCursor(null,'prev');
    request.onsuccess=()=>{
      const cursor=request.result;
      if(cursor&&rows.length<safeLimit){rows.push(cursor.value);cursor.continue();}
      else{db.close();resolve(rows);}
    };
    request.onerror=()=>{db.close();reject(request.error);};
  });
}

async function refreshReport(){
  if(reportPromise)return reportPromise;
  reportPromise=(async()=>{
    try{
      reportCache=buildShadowReport(await getHistory(5000));
      return reportCache;
    }catch(error){
      console.warn('ACE optimizer report failed open',error);
      reportCache=buildShadowReport([]);
      return reportCache;
    }finally{
      reportPromise=null;
    }
  })();
  return reportPromise;
}

async function buildContext(){
  const supplementRegistry=await registry();
  const snapshot=readAgentSnapshot();
  const state=readState();
  return {
    registry:supplementRegistry,
    context:snapshotToContext(snapshot,supplementRegistry,state,brusselsDate())
  };
}

function buildDiagnostics(supplementRegistry,layers,output){
  const selectedIds=new Set((output.selected??[]).flatMap(item=>item?.atom?.memberIds??[]));
  return Object.fromEntries([...(supplementRegistry.supplements??[])]
    .sort((a,b)=>a.id.localeCompare(b.id))
    .map(item=>{
      const eso=layers.esoteric?.[item.id]??{};
      const body=layers.body?.[item.id]??{};
      const frequency=layers.frequency?.[item.id]??{};
      const pairing=layers.pairing?.[item.id]??{};
      return [item.id,{
        esotericLabel:eso.label??'Unscored',
        esotericScalar:Number.isFinite(Number(eso.scalar))?Number(eso.scalar):null,
        bodyPermission:body.label??'unknown',
        frequencyState:frequency.state??'unknown',
        frequencyUrgency:Number.isFinite(Number(frequency.urgency))?Number(frequency.urgency):null,
        pairingState:selectedIds.has(item.id)?'complete':pairing.state??'unknown'
      }];
    }));
}

function applyVisibleAuthority(record,supplementRegistry){
  if(disabled())return null;
  try{return renderVisibleSupplements(record,supplementRegistry);}
  catch(error){
    console.error('ACE optimizer visible authority rejected output',error);
    return null;
  }
}

async function run(reason='manual'){
  if(disabled()||running)return latestRecord;
  running=true;
  try{
    const {registry:supplementRegistry,context}=await buildContext();
    const date=context.date;
    const inputHash=sha256Hex(JSON.stringify(canonicalize(context)));
    if(inputHash===lastInputHash&&latestRecord){
      applyVisibleAuthority(latestRecord,supplementRegistry);
      return latestRecord;
    }

    const layers={
      esoteric:evaluateEsotericRegistry(supplementRegistry,context.dayField),
      body:evaluateBodyRegistry(supplementRegistry,context.bodyState),
      frequency:evaluateFrequencyRegistry(supplementRegistry,date,context.histories),
      pairing:evaluatePairingRegistry(supplementRegistry,[])
    };
    const output=optimize({day:date,registry:supplementRegistry,daySignals:context.daySignals,layers,config:{}});
    const comparison=compareLegacyToOptimizer(context.legacy,output);
    const createdAt=new Date().toISOString();
    const record={
      key:`${date}:${inputHash}`,
      version:VERSION,
      mode:'visible-authority',
      date,
      createdAt,
      reason,
      inputHash,
      optimizerHash:output.determinismHash,
      legacy:context.legacy,
      comparison,
      diagnostics:buildDiagnostics(supplementRegistry,layers,output),
      selected:output.selected,
      residual:output.residual,
      held:output.held,
      excluded:output.excluded
    };
    latestRecord=record;
    lastInputHash=inputHash;
    reportCache=null;
    applyVisibleAuthority(record,supplementRegistry);
    await persist(record);
    window.dispatchEvent(new CustomEvent('ace-mind:optimizer-live',{detail:{date,comparison,optimizerHash:output.determinismHash,authority:'individual'}}));
    return record;
  }catch(error){
    console.error('ACE optimizer live authority failed',error);
    return null;
  }finally{
    running=false;
  }
}

function schedule(reason='render'){
  clearTimeout(timer);
  timer=setTimeout(()=>run(reason),120);
}

function installRenderHook(){
  const base=window.render;
  if(typeof base!=='function'||base.__aceOptimizerLiveWrapped)return;
  function wrapped(...args){
    const result=base.apply(this,args);
    schedule('render');
    return result;
  }
  wrapped.__aceOptimizerLiveWrapped=true;
  wrapped.__aceOptimizerLiveBase=base;
  window.render=wrapped;
}

if(typeof window!=='undefined'){
  const api=Object.freeze({
    version:VERSION,
    mode:'visible-authority',
    run,
    latest:()=>latestRecord,
    history:getHistory,
    report:refreshReport,
    disable(){
      localStorage.setItem(DISABLE_KEY,'1');
      if(typeof window.render==='function')window.render();
    },
    enable(){localStorage.removeItem(DISABLE_KEY);schedule('enabled');}
  });
  window.AceMindOptimizerShadow=api;
  window.AceMindOptimizerLive=api;
  installRenderHook();
  window.addEventListener('focus',()=>schedule('focus'));
  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='visible')schedule('visible');
  });
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>schedule('dom-ready'),{once:true});
  }else{
    schedule('module-ready');
  }
}
