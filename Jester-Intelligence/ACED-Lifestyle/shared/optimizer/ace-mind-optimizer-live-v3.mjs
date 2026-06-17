import { canonicalize,sha256Hex } from '../../../packages/engines/supplement/index.mjs?v=20260617-3';
import { planSupplementDate } from './supplement-live-planner-v3.mjs?v=20260617-3';
import { buildVisibleSupplementModel } from './optimizer-visible-model-v2.mjs?v=20260617-3';
import { renderVisibleSupplements } from './optimizer-visible-renderer.mjs?v=20260617-3';

const VERSION='ace_mind_optimizer_live.v3';
const REGISTRY_URL=new URL('../data/supplements/supplement-registry.v1.json?v=20260617-3',import.meta.url);
const STATE_KEYS=['ace_mind_state_v214','ace_mind_theon_state_v03_block_claim_engine','ace_mind_theon_state_v06','ace_mind_theon_state_v05','ace_mind_theon_state_v04','ace_mind_theon_state_v03'];
const NAD_IDS=new Set(['nr','nmn','nmnh']);
let registryPromise=null,latestRecord=null,lastHash='',timer=null,running=false,observer=null;

function today(){try{return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Brussels',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}catch{return new Date().toISOString().slice(0,10);}}
function selectedDate(){try{const d=window.day?.();if(d?.id)return String(d.id).slice(0,10);}catch{}return today();}
function state(){for(const key of STATE_KEYS){try{const value=JSON.parse(localStorage.getItem(key)||'null');if(value?.suppLog)return value;}catch{}}return {};}
function registry(){return registryPromise??=fetch(REGISTRY_URL,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(`registry ${r.status}`);return r.json();});}
function root(){return document.getElementById('grid-clubs');}
function pending(note=''){const el=root();if(el)el.innerHTML=`<div data-optimizer-live-v3="pending"><div class="card"><div class="focus-title">Calculating supplements</div><div class="small">${note}</div></div></div>`;}
function held(error){console.error('ACE supplement planner held',error);const el=root();if(el)el.innerHTML='<div data-optimizer-live-v3="held"><div class="card"><div class="focus-title">Supplements held</div><div class="small">The calculation did not complete safely, so no recommendation is shown.</div></div></div>';}
function getDay(date){if(typeof window.fwEngineDay!=='function')throw new Error('dynamic day engine unavailable');return window.fwEngineDay(date);}
function getGuidance(day){if(typeof window.deriveGuidanceV23!=='function')throw new Error('daily guidance engine unavailable');return window.deriveGuidanceV23(day);}
function getBody(date){return typeof window.bodySummaryForDate==='function'?(window.bodySummaryForDate(date)||{}):{};}
function members(output={}){return [...new Set((output.selected??[]).flatMap(x=>x?.atom?.memberIds??[]))];}
function assertSafe(output={}){const nad=members(output).filter(id=>NAD_IDS.has(id));if(nad.length>1)throw new Error(`NAD exclusivity breach: ${nad.join(', ')}`);}
function diagnostics(registry,layers,output){
  const selected=new Set(members(output));
  return Object.fromEntries((registry.supplements??[]).map(item=>{
    const e=layers.esoteric?.[item.id]??{},b=layers.body?.[item.id]??{},f=layers.frequency?.[item.id]??{},p=layers.pairing?.[item.id]??{};
    return [item.id,{esotericLabel:e.label,esotericScalar:e.scalar,convergenceBand:e.convergenceBand,convergenceCount:e.convergenceCount,convergenceTotal:e.convergenceTotal,supportSystems:e.supportSystems,bodyPermission:b.label,frequencyState:f.state,frequencyUrgency:f.urgency,usesThisWindow:f.usesThisWindow,targetUses7d:f.targetUses7d,maxUses7d:f.maxUses7d,minimumGapHours:f.minimumGapHours,residualWindowHours:f.residualWindowHours,lastTakenDate:f.lastTakenDate,eligibleOpportunitiesRemaining:f.eligibleOpportunitiesRemaining,pairingState:selected.has(item.id)?'complete':p.state}];
  }));
}

async function run(reason='manual'){
  if(running)return latestRecord;
  running=true;pending(reason);
  const date=selectedDate();
  try{
    const reg=await registry();
    const plan=planSupplementDate({date,today:today(),state:state(),registry:reg,getDay,getGuidance,getBodySummary:getBody,config:{}});
    if(date!==selectedDate()){schedule('date changed');return null;}
    assertSafe(plan.output);
    const hash=sha256Hex(JSON.stringify(canonicalize({date,context:plan.context,historyMode:plan.historyMode,projectionTrail:plan.projectionTrail,actualHistories:plan.actualHistories})));
    const record={date,version:VERSION,reason,inputHash:hash,historyMode:plan.historyMode,projectionTrail:plan.projectionTrail,diagnostics:diagnostics(reg,plan.layers,plan.output),selected:plan.output.selected,residual:plan.output.residual,held:plan.output.held,excluded:plan.output.excluded};
    buildVisibleSupplementModel(record,reg);
    latestRecord=record;lastHash=hash;
    renderVisibleSupplements(record,reg);
    window.dispatchEvent(new CustomEvent('ace-mind:optimizer-live',{detail:{date,historyMode:plan.historyMode,hash}}));
    return record;
  }catch(error){held(error);return null;}finally{running=false;}
}
function schedule(reason){clearTimeout(timer);timer=setTimeout(()=>run(reason),20);}
function wrap(name){const base=window[name];if(typeof base!=='function'||base.__aceOptimizerV3)return;const wrapped=function(...args){const result=base.apply(this,args);schedule(name);return result;};wrapped.__aceOptimizerV3=true;window[name]=wrapped;}
function boot(){['render','setDay','fastRenderSelectedDay','tickSupp','setBodyState'].forEach(wrap);const el=root();if(el){observer=new MutationObserver(()=>{if(!running&&!el.querySelector('[data-optimizer-live-v3]'))schedule('legacy overwrite');});observer.observe(el,{childList:true});}schedule('boot');}

window.AceMindOptimizerLive=Object.freeze({version:VERSION,run,latest:()=>latestRecord,lastHash:()=>lastHash});
window.AceMindOptimizerShadow=window.AceMindOptimizerLive;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
